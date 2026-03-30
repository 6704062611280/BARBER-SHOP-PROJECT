"""
Notification Service
────────────────────
ทุก event ที่ต้องแจ้งเตือนผ่าน helper นี้เท่านั้น
ไม่ insert Notification โดยตรงใน router
"""
from sqlalchemy.orm import Session
from app.model import Notification, NotificationType
 
 
def _push(
    db: Session,
    user_id: int,
    ntype: NotificationType,
    title: str,
    message: str,
    ref_id: int | None = None,
):
    n = Notification(
        user_id=user_id,
        type=ntype,
        title=title,
        message=message,
        ref_id=ref_id,
    )
    db.add(n)
    # caller ต้อง commit เอง (ให้อยู่ใน transaction เดียวกับ business logic)
 
 
# ── Queue events ──────────────────────────────────
 
def notify_queue_booked(db: Session, user_id: int, queue_id: int, start_time: str, date_str: str):
    _push(
        db, user_id,
        NotificationType.QUEUE_BOOKED,
        title="จองคิวสำเร็จ",
        message=f"คิวของคุณเวลา {start_time} วันที่ {date_str} ได้รับการยืนยันแล้ว",
        ref_id=queue_id,
    )
 
def notify_queue_cancelled(db: Session, user_id: int, queue_id: int, reason: str = ""):
    _push(
        db, user_id,
        NotificationType.QUEUE_CANCELLED,
        title="คิวถูกยกเลิก",
        message=f"คิวของคุณถูกยกเลิก{(' — ' + reason) if reason else ''}",
        ref_id=queue_id,
    )
 
def notify_queue_no_show(db: Session, user_id: int, queue_id: int):
    _push(
        db, user_id,
        NotificationType.QUEUE_CANCELLED,
        title="คิวถูกยกเลิกอัตโนมัติ",
        message="คิวของคุณถูกยกเลิกเนื่องจากไม่มาตามเวลาที่กำหนด",
        ref_id=queue_id,
    )
 
 
# ── Leave events ──────────────────────────────────
 
def notify_leave_approved(db: Session, user_id: int, letter_id: int, date_leave: str):
    _push(
        db, user_id,
        NotificationType.LEAVE_APPROVED,
        title="คำขอลาได้รับการอนุมัติ",
        message=f"คำขอลาวันที่ {date_leave} ของคุณได้รับการอนุมัติแล้ว",
        ref_id=letter_id,
    )
 
def notify_leave_rejected(db: Session, user_id: int, letter_id: int, date_leave: str):
    _push(
        db, user_id,
        NotificationType.LEAVE_REJECTED,
        title="คำขอลาถูกปฏิเสธ",
        message=f"คำขอลาวันที่ {date_leave} ของคุณถูกปฏิเสธ",
        ref_id=letter_id,
    )