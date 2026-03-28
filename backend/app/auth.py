from app.security import hash_password, verify_password
from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
from app.model import User,PreUser
from app.schemas import UserResponseRegister,UserCreateRegister,UserCreateLogin,UserCreatePreRegister,UserResponsePreRegister
from app.database import get_db
from jose import jwt
from datetime import datetime, timedelta, timezone
import os
from app.email_service import send_otp_email,generate_otp

router = APIRouter(prefix="/auth",tags=["Auth"])

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = 180

def create_access_token(data:dict):
 try:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    if not SECRET_KEY or not ALGORITHM:
     raise ValueError("Missing SECRET_KEY or ALGORITHM")
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
 except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/send_OTP")
def sendOTP(email: str, db: Session = Depends(get_db)):
    pre_user = db.query(PreUser).filter(PreUser.email == email).first()
    if not pre_user:
        raise HTTPException(status_code=401, detail="ไม่พบ email")
    if pre_user.otp_expire and pre_user.otp_expire > datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="กรุณารอก่อนขอ OTP ใหม่")
    OTP = generate_otp()
    pre_user.otp_code = hash_password(OTP)
    pre_user.otp_expire = datetime.now(timezone.utc) + timedelta(minutes=5)
    pre_user.otp_attempts = 0
    db.commit()
    send_otp_email(email, OTP)
    return {"message": "OTP sent"}


def verify_otp_internal(email: str, pin: str, db: Session):
    pre_user = db.query(PreUser).filter(PreUser.email == email).first()
    if not pre_user:
        raise HTTPException(status_code=401, detail="ไม่พบ email")
    if pre_user.otp_attempts >= 5:
        raise HTTPException(status_code=429, detail="พยายามมากเกินไป")
    if pre_user.otp_expire < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="OTP หมดอายุ")
    if pre_user.is_verified:
        raise HTTPException(status_code=401, detail="OTP ถูกยืนยันไปแล้ว")
    if not verify_password(pin, pre_user.otp_code):
        pre_user.otp_attempts += 1
        db.commit()
        raise HTTPException(status_code=401, detail="OTP ไม่ถูกต้อง")
    pre_user.is_verified = True
    pre_user.otp_code = None
    db.commit()
   
@router.post("/verify_OTP")
def verify_otp_endpoint(email: str, pin: str, db: Session = Depends(get_db)):
    verify_otp_internal(email, pin, db)
    return {
    "message": "OTP verified",
    "email": email,
    "verified": True
}




@router.post("/register",response_model= UserResponseRegister)
def register(user: UserCreateRegister, db: Session = Depends(get_db)):
    pre_user = db.query(PreUser).filter(PreUser.email == user.email).first()
    if not pre_user:
        raise HTTPException(status_code=401, detail="ไม่พบ pre-register")
    if not pre_user.is_verified:
        raise HTTPException(status_code=401, detail="ยังไม่ได้ยืนยัน OTP")
    new_user = User(username=pre_user.username,
                    password_hash=pre_user.password_hash,
                    firstname=pre_user.firstname,
                    lastname=pre_user.lastname,
                    email=pre_user.email,
                    phone=pre_user.phone
                    )
    db.add(new_user)
    db.delete(pre_user)
    db.commit()
    db.refresh(new_user)
    

    return new_user

@router.post("/login")
def login(user:UserCreateLogin,db:Session =  Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user :
        raise HTTPException(status_code=401,detail="Usernameไม่ถูกต้อง กรุณากรอกใหม่อีกครั้ง")
    if not verify_password(user.password,db_user.password_hash):
        raise HTTPException(status_code=401,detail="Passwordไม่ถูกต้อง กรุณากรอกใหม่อีกครั้ง")
    access_token = create_access_token(
        data={
            "sub": db_user.username,
            "user_id": db_user.id,
            "role": db_user.rolestatus.value
        }
    )
    return{
        "access_token": access_token,
        "token_type": "bearer",
        "role": db_user.rolestatus.value
        }

@router.post("/pre_register",response_model= UserResponsePreRegister)
def pre_register(user: UserCreatePreRegister, db:Session = Depends(get_db)):
   exist_user = db.query(User).filter(User.username == user.username).first()
   if exist_user :
        raise HTTPException(status_code=401,detail="Usernameถูกใช้ไปแล้ว")
   exist_email = db.query(User).filter(User.email == user.email).first()
   if exist_email:
        raise HTTPException(status_code=401, detail="Emailนี้ถูกใช้ไปแล้ว")
   exist_pre = db.query(PreUser).filter(PreUser.email == user.email).first()
   if exist_pre:
        raise HTTPException(status_code=400, detail="กรุณายืนยัน OTP ก่อนสมัครใหม่")
   OTP = generate_otp()
   OTP_code = hash_password(OTP)
   new_user = PreUser(username=user.username,
                    password_hash=hash_password(user.password),
                    firstname=user.firstname,
                    lastname=user.lastname,
                    email=user.email,
                    phone=user.phone,
                    otp_code=OTP_code,
                    otp_expire=datetime.now(timezone.utc) + timedelta(minutes=5),
                    is_verified = False
                    )
   db.add(new_user)
   db.commit()
   db.refresh(new_user)
   send_otp_email(new_user.email,OTP)


   return new_user