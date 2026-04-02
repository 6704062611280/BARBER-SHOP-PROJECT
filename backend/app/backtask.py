# backtask.py
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi_utils.tasks import repeat_every
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.database import SessionLocal, get_db
from jose import jwt
from app.model import (
    QueueSlots, BookedStatus, TypeUser, PreUser,
    NotificationType, Notification, User
)
import os

# ========================
# Config
# ========================
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
SESSION_TIMEOUT = timedelta(minutes=180)


# ========================
# Tasks
# ========================
def create_tasks(app: FastAPI):

    @app.on_event("startup")
    @repeat_every(seconds=60)
    async def auto_no_show():
        """
        ถ้าไม่มาภายใน 5 นาทีจะยกเลิกอัตโนมัติ
        ทำงานทุก 1 นาที
        """
        now = datetime.now(timezone.utc)
        db: Session = SessionLocal()
        try:
            queues = db.query(QueueSlots).filter(
                QueueSlots.status == BookedStatus.BOOKED,
                QueueSlots.date_working == now.date(),
                QueueSlots.start_time <= (now - timedelta(minutes=5)).time(),
            ).all()

            for q in queues:
                # แจ้งเตือนลูกค้า (ถ้าเป็น Online booking)
                if q.customer_id:
                    n = Notification(
                        user_id=q.customer_id,
                        type=NotificationType.QUEUE_CANCELLED,
                        title="คิวถูกยกเลิกอัตโนมัติ",
                        message="คิวของคุณถูกยกเลิกเนื่องจากไม่มาตามเวลา",
                        ref_id=q.id,
                    )
                    db.add(n)

                q.status = BookedStatus.NO_SHOW
                q.customer_id = None
                q.status_user = TypeUser.NONE

            if queues:
                db.commit()
        finally:
            db.close()


def create_otp_cleanup_task(app: FastAPI):

    @app.on_event("startup")
    @repeat_every(seconds=300)
    async def cleanup_expired_otps():
        """
        ลบ PreUser ที่ OTP หมดอายุ
        ทำงานทุก 5 นาที
        """
        now = datetime.now(timezone.utc)
        with SessionLocal() as db:
            expired = db.query(PreUser).filter(
                PreUser.is_verified == False,
                PreUser.otp_expire < now,
            ).all()
            for u in expired:
                db.delete(u)
            if expired:
                db.commit()


# ========================
# Current User
# ========================
def get_current_user(request: Request, db: Session = Depends(get_db)):
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "): # เช็ค format token ด้วย
        raise HTTPException(status_code=401, detail="Missing or invalid token format")
    
    try:
        token_str = token.split(" ")[1]
        payload = jwt.decode(token_str, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
    except:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    # ดึงเวลาปัจจุบันที่เป็น UTC Aware
    now = datetime.now(timezone.utc)

    if user.last_activity:
        last_act = user.last_activity
        if last_act.tzinfo is None:
            last_act = last_act.replace(tzinfo=timezone.utc)
        
        # ตรวจสอบ Timeout
        if now - last_act > SESSION_TIMEOUT:
            raise HTTPException(status_code=401, detail="Session expired due to inactivity")
    
    # อัปเดตเวลาการใช้งานล่าสุด
    user.last_activity = now
    try:
        db.commit()
    except:
        db.rollback() # ป้องกัน DB ค้างถ้า commit พัง
    
    return user