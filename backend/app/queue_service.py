from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import date, datetime, timedelta,time
from abc import ABC, abstractmethod

from app.database import get_db
from app.model import (
    Chair, OpeningDate, QueueSlots, User, 
    BookedStatus, TypeUser, UserRole
)
from app.notification_service import (
    notify_queue_booked, notify_queue_cancelled
)
from app.schemas import QueueResponse
from app.rolebase import require_roles, require_barber

router = APIRouter(prefix="/queue_service", tags=["Queue_Service"])

# ==========================================
# 1. STATE PATTERN
# ==========================================
class QueueStateManager:
    """จัดการ Logic การเปลี่ยนสถานะของคิว"""
    ALLOWED_TRANSITIONS = {
        BookedStatus.AVAILABLE: [BookedStatus.BOOKED],
        BookedStatus.CANCELLED: [BookedStatus.BOOKED],
        BookedStatus.NO_SHOW:   [BookedStatus.BOOKED],
        BookedStatus.BOOKED:    [BookedStatus.CHECKIN, BookedStatus.CANCELLED, BookedStatus.NO_SHOW],
        BookedStatus.CHECKIN:   [BookedStatus.COMPLETE],
    }

    @staticmethod
    def transition_to(queue: QueueSlots, new_status: BookedStatus):
        if new_status not in QueueStateManager.ALLOWED_TRANSITIONS.get(queue.status, []):
            raise HTTPException(400, f"ไม่สามารถเปลี่ยนสถานะจาก {queue.status.value} เป็น {new_status.value}")
        queue.status = new_status

# ==========================================
# 2. TEMPLATE METHOD PATTERN (Cancellation)
# ==========================================
class BaseCancelProcess(ABC):
    """โครงร่างหลักของการยกเลิกคิว"""
    def execute(self, db: Session, chair_id: int, queue_id: int, user: User):
        # 1. ตรวจสอบเก้าอี้
        self._validate_chair(db, chair_id, user)
        # 2. ดึงข้อมูลคิว
        queue = self._get_queue(db, queue_id, chair_id)
        # 3. ตรวจสอบสิทธิ์เฉพาะ (Implement ต่างกัน)
        self._validate_permission(queue, user)
        # 4. เปลี่ยนสถานะ (ใช้ State Pattern)
        QueueStateManager.transition_to(queue, BookedStatus.CANCELLED)
        # 5. ล้างข้อมูลผู้จอง
        customer_id_for_notify = queue.customer_id
        queue.customer_id = None
        queue.status_user = TypeUser.NONE
        # 6. ส่งแจ้งเตือน (Implement ต่างกัน)
        self._send_notification(db, user, customer_id_for_notify, queue.id)
        
        return queue

    def _validate_chair(self, db, chair_id, user):
        chair = db.query(Chair).filter(Chair.id == chair_id).first()
        if not chair: raise HTTPException(404, "Chair not found")
        return chair

    def _get_queue(self, db, queue_id, chair_id):
        queue = db.query(QueueSlots).filter(QueueSlots.id == queue_id).with_for_update().first()
        if not queue: raise HTTPException(404, "Queue not found")
        if queue.chair_id != chair_id: raise HTTPException(400, "Queue not in this chair")
        return queue

    @abstractmethod
    def _validate_permission(self, queue, user): pass

    @abstractmethod
    def _send_notification(self, db, user, customer_id, queue_id): pass

class CustomerCancel(BaseCancelProcess):
    def _validate_permission(self, queue, user):
        if queue.customer_id != user.id:
            raise HTTPException(403, "ไม่ใช่คิวของคุณ")

    def _send_notification(self, db, user, customer_id, queue_id):
        notify_queue_cancelled(db, user.id, queue_id, "ยกเลิกโดยผู้ใช้")

class BarberCancel(BaseCancelProcess):
    def _validate_chair(self, db, chair_id, user):
        chair = super()._validate_chair(db, chair_id, user)
        if chair.barber_id != user.barber.id:
            raise HTTPException(403, "ไม่ใช่เก้าอี้ที่คุณรับผิดชอบ")

    def _validate_permission(self, queue, user):
        if queue.status != BookedStatus.BOOKED:
            raise HTTPException(400, "คิวนี้ไม่ได้ถูกจองไว้ ไม่ต้องยกเลิก")

    def _send_notification(self, db, user, customer_id, queue_id):
        if customer_id:
            notify_queue_cancelled(db, customer_id, queue_id, "ยกเลิกโดยพนักงาน")

# ==========================================
# 3. ROUTERS
# ==========================================

def get_queue_or_404(db: Session, queue_id: int):
    queue = db.query(QueueSlots).filter(QueueSlots.id == queue_id).with_for_update().first()
    if not queue: raise HTTPException(404, "Queue not found")
    return queue

# แก้ไขใน router.get("/chairs")
@router.get("/chairs")
def view_chairs(dateshop: date = date.today(), db: Session = Depends(get_db)):
    # 1. เช็คสถานะการเปิดร้านจากหน้า ShopSetting (OpeningDate)
    opening = db.query(OpeningDate).filter(OpeningDate.date_open == dateshop).first()
    
    # ถ้าร้านปิด หรือยังไม่ได้กดเปิดร้าน (ไม่มี record)
    if not opening or not opening.is_open:
        return {
            "shop_status": "closed",
            "chairs": []
        }

    # 2. ถ้าร้านเปิด -> ดึงเก้าอี้ "ทั้งหมด" (เพื่อให้โชว์ตัวที่ไม่พร้อมด้วย)
    all_chairs = db.query(Chair).all()
    
    result = []
    for c in all_chairs:
        # A. เช็คว่ามีคนตัด (ช่างประจำ) ไหม
        if not c.barber_id:
            status = "not_ready"
            status_text = "ไม่พร้อมบริการ (ไม่มีช่าง)"
            allow_booking = False
        else:
            # B. ถ้ามีคนตัด เช็คคิวที่สร้างขึ้นมาตอน open_shop ว่าเหลือว่างไหม
            available_slots = db.query(QueueSlots).filter(
                QueueSlots.chair_id == c.id,
                QueueSlots.date_working == dateshop,
                QueueSlots.status == BookedStatus.AVAILABLE
            ).count()

            if available_slots > 0:
                status = "ready"
                status_text = "พร้อมให้บริการ"
                allow_booking = True
            else:
                status = "full"
                status_text = "คิวเต็ม"
                allow_booking = False

        result.append({
            "id": c.id,
            "name": c.name,
            "status": status,
            "statusText": status_text,
            "allowBooking": allow_booking,
            "barber_name": c.barber.user_data.firstname if c.barber else None
        })

    return {
        "shop_status": "open",
        "chairs": result
    }

@router.post("/user/{chair_id}/queues/{queue_id}/booked", response_model=QueueResponse)
def booked_by_customer(chair_id: int, queue_id: int, user: User = Depends(require_roles([UserRole.CUSTOMER])), db: Session = Depends(get_db)):
    queue = get_queue_or_404(db, queue_id)
    if queue.status != BookedStatus.AVAILABLE:
        raise HTTPException(400, "คิวนี้ไม่ว่าง")
    
    QueueStateManager.transition_to(queue, BookedStatus.BOOKED)
    queue.customer_id = user.id
    queue.status_user = TypeUser.ONLINE
    
    notify_queue_booked(db, user.id, queue.id, str(queue.start_time), str(queue.date_working))
    db.commit()
    return queue

@router.post("/user/{chair_id}/queues/{queue_id}/cancel")
def cancel_by_customer(chair_id: int, queue_id: int, user: User = Depends(require_roles([UserRole.CUSTOMER])), db: Session = Depends(get_db)):
    process = CustomerCancel()
    queue = process.execute(db, chair_id, queue_id, user)
    db.commit()
    return {"message": "ยกเลิกคิวเรียบร้อยแล้ว"}

@router.post("/chairs/{chair_id}/queues/{queue_id}/cancel")
def cancel_by_barber(chair_id: int, queue_id: int, user: User = Depends(require_barber()), db: Session = Depends(get_db)):
    process = BarberCancel()
    process.execute(db, chair_id, queue_id, user)
    db.commit()
    return {"message": "พนักงานยกเลิกคิวเรียบร้อยแล้ว"}

@router.post("/chairs/{chair_id}/queues/{queue_id}/checkin")
def checkin(chair_id: int, queue_id: int, user: User = Depends(require_barber()), db: Session = Depends(get_db)):
    queue = get_queue_or_404(db, queue_id)
    QueueStateManager.transition_to(queue, BookedStatus.CHECKIN)
    db.commit()
    return {"message": "เช็คอินเรียบร้อย"}

@router.post("/chairs/{chair_id}/queues/{queue_id}/complete")
def complete(chair_id: int, queue_id: int, user: User = Depends(require_barber()), db: Session = Depends(get_db)):
    queue = get_queue_or_404(db, queue_id)
    QueueStateManager.transition_to(queue, BookedStatus.COMPLETE)
    db.commit()
    return {"message": "เสร็จสิ้นบริการ"}

@router.post("/open_shop")
def open_shop(interval_minutes: int = 60, user: User = Depends(require_roles([UserRole.OWNER])), db: Session = Depends(get_db)):
    today = date.today()
    opening = db.query(OpeningDate).filter(OpeningDate.date_open == today).first()
    if not opening or not opening.is_open:
        raise HTTPException(400, "ไม่มีการตั้งค่าเวลาเปิดร้านสำหรับวันนี้")

    chairs = db.query(Chair).filter(Chair.barber_id.isnot(None)).all()
    if not chairs: raise HTTPException(400, "ไม่มีช่างประจำเก้าอี้")

    start_dt = datetime.combine(today, opening.open_time)
    end_dt = datetime.combine(today, opening.close_time)
    current = start_dt
    new_slots = []

    while current < end_dt:
        next_time = current + timedelta(minutes=interval_minutes)
        for chair in chairs:
            new_slots.append(QueueSlots(
                start_time=current.time(), end_time=next_time.time(),
                chair_id=chair.id, date_working=today,
                status=BookedStatus.AVAILABLE, status_user=TypeUser.NONE
            ))
        current = next_time

    db.bulk_save_objects(new_slots)
    db.commit()
    return {"message": f"เปิดร้านเรียบร้อย สร้างคิวทั้งหมด {len(new_slots)} คิว"}

@router.get("/user/my_queue")
def view_my_queue(user: User = Depends(require_roles([UserRole.CUSTOMER])), db: Session = Depends(get_db)):
    queues = db.query(QueueSlots).options(joinedload(QueueSlots.chair)).filter(
        QueueSlots.customer_id == user.id,
        QueueSlots.date_working >= date.today()
    ).order_by(QueueSlots.date_working, QueueSlots.start_time).all()
    
    return [{
        "queue_id": q.id, "chair_name": q.chair.name if q.chair else None,
        "date": q.date_working, "start_time": q.start_time, "status": q.status.value
    } for q in queues]

@router.post("/set_opening")
def set_opening(
    open_time: str,
    close_time: str,
    is_open: bool,
    db: Session = Depends(get_db)
):
    today = date.today()

    opening = db.query(OpeningDate).filter(
        OpeningDate.date_open == today
    ).first()

    if not opening:
        opening = OpeningDate(date_open=today)
        db.add(opening)

    opening.open_time = time.fromisoformat(open_time)
    opening.close_time = time.fromisoformat(close_time)
    opening.is_open = is_open

    db.commit()

    return {"message": "ตั้งค่าเวลาเรียบร้อย"}

@router.post("/close_shop")
def close_shop(
    user: User = Depends(require_roles([UserRole.OWNER])),
    db: Session = Depends(get_db)
):
    today = date.today()

    # หา opening วันนี้
    opening = db.query(OpeningDate).filter(
        OpeningDate.date_open == today
    ).first()

    if not opening or not opening.is_open:
        raise HTTPException(400, "ร้านไม่ได้เปิดอยู่")

    # ปิดร้าน
    opening.is_open = False

    # ลบ queue ทั้งหมดของวันนี้
    db.query(QueueSlots).filter(
        QueueSlots.date_working == today
    ).delete(synchronize_session=False)

    db.commit()

    return {"message": "ปิดร้านเรียบร้อยและลบคิวทั้งหมดเรียบร้อย"}

@router.get("/queues")
def get_queues_by_chair(chair_id: int, dateshop: date = date.today(), db: Session = Depends(get_db)):
    # ดึงคิวทั้งหมดของเก้าอี้ตัวนี้ในวันที่กำหนด
    queues = db.query(QueueSlots).filter(
        QueueSlots.chair_id == chair_id,
        QueueSlots.date_working == dateshop
    ).order_by(QueueSlots.start_time).all()
    
    return queues