from fastapi import FastAPI,Depends, HTTPException, Request
from fastapi_utils.tasks import repeat_every
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.database import SessionLocal
from jose import jwt
from app.model import QueueSlots, BookedStatus, TypeUser, PreUser
from app.database import get_db
from app.model import User
import os

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
SESSION_TIMEOUT = timedelta(minutes=15)

def create_tasks(app: FastAPI):

    @app.on_event("startup")
    @repeat_every(seconds=60)  
    def auto_cancel_no_show():
        now = datetime.now(timezone.utc)
        db: Session = SessionLocal()
        try:
            queues = db.query(QueueSlots).filter(
                QueueSlots.status == BookedStatus.BOOKED,
                QueueSlots.date_working == now.date(),
                QueueSlots.start_time <= now - timedelta(minutes=5)
            ).all()
            for q in queues:
                q.status = BookedStatus.NO_SHOW
                q.customer_id = None
                q.status_user = TypeUser.NONE
            db.commit()
        finally:
            db.close()


def create_otp_cleanup_task(app: FastAPI):
    @app.on_event("startup")
    @repeat_every(seconds=60)  
    def cleanup_expired_otps():
        now = datetime.now(timezone.utc)
        with SessionLocal() as db:
            expired_users = db.query(PreUser).filter(
                PreUser.is_verified == False,
                PreUser.otp_expire < now
            ).all()

            for user in expired_users:
                print(f"ลบ PreUser ที่หมดอายุ OTP: {user.email}")
                db.delete(user)

            if expired_users:
                db.commit()

def get_current_user(request: Request, db: Session = Depends(get_db)):
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")    
    try:
        payload = jwt.decode(token.split(" ")[1], SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
    except:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if user.last_activity and datetime.now(timezone.utc) - user.last_activity > SESSION_TIMEOUT:
        raise HTTPException(status_code=401, detail="Session expired due to inactivity")
    user.last_activity = datetime.now(timezone.utc)
    db.commit()
    return user