from fastapi import APIRouter,Depends,HTTPException,Header
from app.database import get_db
from sqlalchemy.orm import Session
from app.model import Chair, OpeningDate, QueueSlots,User,BookedStatus,TypeUser,UserRole,Barber
from app.notification_service import (
    notify_queue_booked, notify_queue_cancelled, notify_queue_no_show
)
from datetime import date
from app.schemas import QueueResponse
from app.rolebase import require_roles,require_barber
from app.backtask import get_current_user
from datetime import datetime, timedelta
from sqlalchemy.orm import joinedload

router = APIRouter(prefix="/queue_service",tags=["Queue_Service"])

allowed_transitions = {
    BookedStatus.AVAILABLE: [BookedStatus.BOOKED],
    BookedStatus.CANCELLED: [BookedStatus.BOOKED],
    BookedStatus.NO_SHOW:   [BookedStatus.BOOKED],
    BookedStatus.BOOKED: [BookedStatus.CHECKIN, BookedStatus.CANCELLED, BookedStatus.NO_SHOW],
    BookedStatus.CHECKIN: [BookedStatus.COMPLETE],
}

def validate_transition(current, new):
    if new not in allowed_transitions.get(current, []):
        raise HTTPException(400, "Invalid state transition")

def get_queue_or_404(db: Session, queue_id: int):
    queue = db.query(QueueSlots)\
        .filter(QueueSlots.id == queue_id)\
        .with_for_update()\
        .first()
    if not queue:
        raise HTTPException(404, "Queue not found")
    return queue

@router.get("/chairs")
def viewChairs(dateshop:date = date.today(),db:Session = Depends(get_db)):
    opening = db.query(OpeningDate).filter(OpeningDate.date_open == dateshop).first()
    if not opening:
        raise HTTPException(status_code=400,detail="No schedule for this day")
    if not opening.is_open:
        raise HTTPException(status_code=400, detail="Shop closed")
    chairs = db.query(Chair).filter(Chair.barber_id.isnot(None)).all()
    return {
        "date": dateshop,
        "open_time": opening.open_time,
        "close_time": opening.close_time,
        "chairs": chairs
    }

@router.get("/chairs/{chair_id}/queues", response_model=list[QueueResponse])
def viewChair(chair_id: int,dateshop:date = date.today(), db: Session = Depends(get_db)):
    opening = db.query(OpeningDate).filter(OpeningDate.date_open == dateshop).first()
    if not opening:
        raise HTTPException(status_code=400,detail="No schedule for this day")
    if not opening.is_open:
        raise HTTPException(status_code=400, detail="Shop closed")
    chair = db.query(Chair).filter(Chair.id == chair_id).first()
    if not chair:
        raise HTTPException(status_code=404, detail="Chair not found")
    queues_slot = db.query(QueueSlots).filter( QueueSlots.chair_id == chair.id,QueueSlots.date_working == dateshop).all()
    return queues_slot

@router.get("/barber/queues", response_model=list[QueueResponse])
def view_barber_queues(
    dateshop: date = date.today(),
    user: User = Depends(require_barber()),
    db: Session = Depends(get_db),
):
    """
    Barber/Owner ดูตารางงานของตัวเอง
    ตาม wireframe Book queue (Barber) และ IF (Barber)
    """
    barber = user.barber
    if not barber:
        raise HTTPException(403, "No barber profile")
 
    chair = db.query(Chair).filter(Chair.barber_id == barber.id).first()
    if not chair:
        raise HTTPException(404, "ยังไม่ได้รับมอบหมายเก้าอี้")
 
    return db.query(QueueSlots).filter(
        QueueSlots.chair_id == chair.id,
        QueueSlots.date_working == dateshop,
    ).order_by(QueueSlots.start_time).all()
 
 


@router.post("/user/{chair_id}/queues/{queue_id}/booked", response_model=QueueResponse)
def bookedQueuesByCustomer(
    chair_id:int,
    queue_id: int,
    user: User = Depends(require_roles([UserRole.CUSTOMER])),
    db: Session = Depends(get_db)
):
    chair = db.query(Chair).filter(Chair.id == chair_id).first()
    if not chair:
        raise HTTPException(404, "Chair not found")
    queue = get_queue_or_404(db, queue_id)
    if queue.chair_id != chair_id:
        raise HTTPException(400, "Queue not in this chair")
    if queue.status != BookedStatus.AVAILABLE:
        raise HTTPException(400, "Slot not available")
    validate_transition(queue.status, BookedStatus.BOOKED)
    queue.customer_id = user.id
    queue.status = BookedStatus.BOOKED
    queue.status_user = TypeUser.ONLINE
    notify_queue_booked(
        db, user.id, queue.id,
        str(queue.start_time), str(queue.date_working)
    )
    try:
        db.commit()
        db.refresh(queue)
    except:
        db.rollback()
        raise HTTPException(500, "Database error")
    return queue

@router.post("/chairs/{chair_id}/queues/{queue_id}/booked", response_model=QueueResponse)
def bookedQueuesByBarber(
    chair_id: int,
    queue_id: int,
    user: User = Depends(require_barber()),
    db: Session = Depends(get_db)
):
    chair = db.query(Chair).filter(Chair.id == chair_id).first()
    if not chair:
        raise HTTPException(404, "Chair not found")

    # ✅ เช็ค ownership
    if chair.barber_id != user.barber.id:
        raise HTTPException(403, "Not your chair")

    queue = get_queue_or_404(db, queue_id)

    if queue.chair_id != chair_id:
        raise HTTPException(400, "Queue not in this chair")

    if queue.status != BookedStatus.AVAILABLE:
        raise HTTPException(400, "Slot not available")

    validate_transition(queue.status, BookedStatus.BOOKED)

    queue.customer_id = None
    queue.status = BookedStatus.BOOKED
    queue.status_user = TypeUser.WALK_IN

    try:
        db.commit()
        db.refresh(queue)
    except:
        db.rollback()
        raise HTTPException(500, "Database error")

    return queue


@router.post("/user/{chair_id}/queues/{queue_id}/cancel", response_model=QueueResponse)
def cancelByCustomer(
    chair_id: int,
    queue_id: int,
    user: User = Depends(require_roles([UserRole.CUSTOMER])),
    db: Session = Depends(get_db)
):
    # 🔹 check chair
    chair = db.query(Chair).filter(Chair.id == chair_id).first()
    if not chair:
        raise HTTPException(status_code=404, detail="Chair not found")

    queue = get_queue_or_404(db, queue_id)

    # 🔹 ensure queue belongs to chair
    if queue.chair_id != chair_id:
        raise HTTPException(400, "Queue not in this chair")

    # 🔹 ownership check
    if queue.customer_id != user.id:
        raise HTTPException(status_code=403, detail="Not your queue")

    # 🔹 state check
    if queue.status not in [BookedStatus.BOOKED]:
        raise HTTPException(400, "Cannot cancel this queue")

    validate_transition(queue.status, BookedStatus.CANCELLED)

    queue.status = BookedStatus.CANCELLED
    queue.customer_id = None
    queue.status_user = TypeUser.NONE
    notify_queue_cancelled(db, user.id, queue.id, "ยกเลิกโดยผู้ใช้")
    try:
        db.commit()
        db.refresh(queue)
    except:
        db.rollback()
        raise HTTPException(500, "Database error")

    return queue

@router.post("/chairs/{chair_id}/queues/{queue_id}/cancel")
def cancelByBarber(
    chair_id: int,
    queue_id: int,
    user: User = Depends(require_barber()),
    db: Session = Depends(get_db)
):
    chair = db.query(Chair).filter(Chair.id == chair_id).first()
    if not chair:
        raise HTTPException(404, "Chair not found")

    # ✅ ownership
    if chair.barber_id != user.barber.id:
        raise HTTPException(403, "Not your chair")

    queue = get_queue_or_404(db, queue_id)

    if queue.chair_id != chair_id:
        raise HTTPException(400, "Queue not in this chair")

    if queue.status != BookedStatus.BOOKED:
        raise HTTPException(400, "Cannot cancel this queue")

    validate_transition(queue.status, BookedStatus.CANCELLED)
    if queue.customer_id:
        notify_queue_cancelled(db, queue.customer_id, queue.id, "ยกเลิกโดยพนักงาน")
    queue.status = BookedStatus.CANCELLED
    queue.customer_id = None
    queue.status_user = TypeUser.NONE

    try:
        db.commit()
        db.refresh(queue)
    except:
        db.rollback()
        raise HTTPException(500, "Database error")

    return {"message": "Queue cancelled"}

@router.post("/chairs/{chair_id}/queues/{queue_id}/checkin")
def checkin(
    chair_id: int,
    queue_id: int,
    user: User = Depends(require_barber()),
    db: Session = Depends(get_db)
):
    chair = db.query(Chair).filter(Chair.id == chair_id).first()
    if not chair:
        raise HTTPException(404, "Chair not found")

    # ✅ ownership
    if chair.barber_id != user.barber.id:
        raise HTTPException(403, "Not your chair")

    queue = get_queue_or_404(db, queue_id)

    if queue.chair_id != chair_id:
        raise HTTPException(400, "Queue not in this chair")

    if queue.status != BookedStatus.BOOKED:
        raise HTTPException(400, "Only booked queue can check in")

    validate_transition(queue.status, BookedStatus.CHECKIN)

    queue.status = BookedStatus.CHECKIN

    try:
        db.commit()
        db.refresh(queue)
    except:
        db.rollback()
        raise HTTPException(500, "Database error")

    return {"message": "Customer checked in"}

@router.post("/chairs/{chair_id}/queues/{queue_id}/complete")
def complete(
    chair_id: int,
    queue_id: int,
    user: User = Depends(require_barber()),
    db: Session = Depends(get_db)
):
    chair = db.query(Chair).filter(Chair.id == chair_id).first()
    if not chair:
        raise HTTPException(404, "Chair not found")

    # ✅ ownership
    if chair.barber_id != user.barber.id:
        raise HTTPException(403, "Not your chair")

    queue = get_queue_or_404(db, queue_id)

    if queue.chair_id != chair_id:
        raise HTTPException(400, "Queue not in this chair")

    if queue.status != BookedStatus.CHECKIN:
        raise HTTPException(400, "Only checked-in queue can be completed")

    validate_transition(queue.status, BookedStatus.COMPLETE)

    queue.status = BookedStatus.COMPLETE

    try:
        db.commit()
        db.refresh(queue)
    except:
        db.rollback()
        raise HTTPException(500, "Database error")

    return {"message": "Service completed"}

@router.post("/open_shop")
def open_shop(
    interval_minutes: int = 60,
    user: User = Depends(require_roles([UserRole.OWNER])),
    db: Session = Depends(get_db),
):
    today = date.today()

    # ---------------------------
    # 1. VALIDATE INPUT
    # ---------------------------
    if interval_minutes <= 0:
        raise HTTPException(400, "Invalid interval")

    # ---------------------------
    # 2. LOAD OPENING CONFIG
    # ---------------------------
    opening = db.query(OpeningDate).filter(
        OpeningDate.date_open == today
    ).first()

    if not opening:
        raise HTTPException(404, "No opening config for today")

    if not opening.is_open:
        raise HTTPException(400, "Shop is closed today")

    if opening.open_time >= opening.close_time:
        raise HTTPException(400, "Invalid opening hours")

    # ---------------------------
    # 3. CHECK ALREADY OPENED
    # ---------------------------
    already = db.query(QueueSlots).filter(
        QueueSlots.date_working == today
    ).first()

    if already:
        raise HTTPException(400, "Shop already opened")

    # ---------------------------
    # 4. GET ACTIVE CHAIRS (🔥 ตรงนี้แหละที่คุณงง)
    # ---------------------------
    chairs = db.query(Chair).filter(
        Chair.barber_id.isnot(None)   # ✅ สำคัญ
    ).all()

    if not chairs:
        raise HTTPException(400, "No active chairs (assign barber first)")

    # ---------------------------
    # 5. GENERATE QUEUE
    # ---------------------------
    new_slots = []
    created = 0

    start_dt = datetime.combine(today, opening.open_time)
    end_dt = datetime.combine(today, opening.close_time)

    current = start_dt

    while current < end_dt:
        next_time = current + timedelta(minutes=interval_minutes)

        for chair in chairs:
            new_slots.append(
                QueueSlots(
                    start_time=current.time(),
                    end_time=next_time.time(),
                    chair_id=chair.id,
                    date_working=today,
                    status=BookedStatus.AVAILABLE,
                    status_user=TypeUser.NONE
                )
            )
            created += 1

        current = next_time

    # ---------------------------
    # 6. SAVE
    # ---------------------------
    try:
        db.bulk_save_objects(new_slots)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Database error: {str(e)}")

    return {
        "message": "Shop opened & queues generated",
        "created_slots": created
    }

@router.post("/close_shop")
def close_shop(
    user: User = Depends(require_roles([UserRole.OWNER])),
    db: Session = Depends(get_db),
):
    today = date.today()

    # 🔥 ปิด slot ที่ยังว่าง
    db.query(QueueSlots).filter(
    QueueSlots.date_working == today,
    QueueSlots.status == BookedStatus.AVAILABLE
).update({"status": BookedStatus.CANCELLED})
    db.commit()

    return {"message": "Shop closed"}

@router.get("/user/my_queue")
def view_my_queue(
    user: User = Depends(require_roles([UserRole.CUSTOMER])),
    db  : Session = Depends(get_db),
):
    """ลูกค้าดูคิวของตัวเอง (ตาม wireframe View Queue Customer)"""
    queues = (
        db.query(QueueSlots)
        .options(joinedload(QueueSlots.chair))
        .filter(
            QueueSlots.customer_id == user.id,
            QueueSlots.date_working >= date.today(),
        )
        .order_by(QueueSlots.date_working, QueueSlots.start_time)
        .all()
    )
    return [
        {
            "queue_id"   : q.id,
            "chair_name" : q.chair.name if q.chair else None,
            "date"       : q.date_working,
            "start_time" : q.start_time,
            "end_time"   : q.end_time,
            "status"     : q.status.value,
        }
        for q in queues
    ]