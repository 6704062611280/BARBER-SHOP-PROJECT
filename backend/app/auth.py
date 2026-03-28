from app.security import hash_password, verify_password
from fastapi import APIRouter,Depends,HTTPException, Request
from sqlalchemy.orm import Session
from app.model import User,PreUser,PreUserStatus, RefreshToken
from app.schemas import UserResponseRegister,UserCreateRegister,UserCreateLogin,UserCreatePreRegister,UserResponsePreRegister,UserUpdateProfile,UserChangePassword,UserChangeEmail
from app.database import get_db
from jose import jwt
from datetime import datetime, timedelta, timezone
import os
from app.email_service import send_otp_email,generate_otp
from app.backtask import get_current_user
import uuid

router = APIRouter(prefix="/auth",tags=["Auth"])

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = 180

def create_refresh_token():
    return str(uuid.uuid4())

def create_access_token(data:dict):
 try:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    if not SECRET_KEY or not ALGORITHM:
     raise ValueError("Missing SECRET_KEY or ALGORITHM")
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
 except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


def create_refresh_token():
    import secrets
    return secrets.token_urlsafe(64)

@router.post("/send_OTP")
def sendOTP(email: str, purpose: PreUserStatus, db: Session):
    pre_user = db.query(PreUser).filter(
    PreUser.email == email,
    PreUser.purpose == purpose
).first()
    if not pre_user:
        pre_user = PreUser(
        email=email,
        username="",
        password_hash="",
        firstname="",
        phone="",
        purpose=purpose
        )
        db.add(pre_user)
    if pre_user.otp_expire and pre_user.otp_expire > datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="กรุณารอก่อนขอ OTP ใหม่")
    OTP = generate_otp()
    pre_user.otp_code = hash_password(OTP)
    pre_user.otp_expire = datetime.now(timezone.utc) + timedelta(minutes=5)
    pre_user.otp_attempts = 0
    db.commit()
    send_otp_email(email, OTP)
    return {"message": "OTP sent"}


def verify_otp_internal(email: str, pin: str, purpose: PreUserStatus, db: Session):
    pre_user = db.query(PreUser).filter(
        PreUser.email == email,
        PreUser.purpose == purpose
    ).first()
    if not pre_user:
        raise HTTPException(status_code=404, detail="ไม่พบ email")
    if pre_user.otp_attempts >= 5:
        raise HTTPException(status_code=429, detail="พยายามมากเกินไป")
    if not pre_user.otp_expire or pre_user.otp_expire < datetime.now(timezone.utc):
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
    return pre_user
   
@router.post("/verify_OTP")
def verify_otp_endpoint(email: str, purpose: PreUserStatus,pin: str, db: Session = Depends(get_db)):
    verify_otp_internal(email, pin,purpose, db)
    return {
    "message": "OTP verified",
    "email": email,
    "verified": True
}




@router.post("/register",response_model= UserResponseRegister)
def register(user: UserCreateRegister, db: Session = Depends(get_db)):
    pre_user = db.query(PreUser).filter(
    PreUser.email == user.email,
    PreUser.purpose == PreUserStatus.REGISTER
).first()
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
def login(user: UserCreateLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()

    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token({
        "sub": db_user.username,
        "user_id": db_user.id,
        "role": db_user.rolestatus.value
    })

    refresh_token = create_refresh_token()

    refresh_token = create_refresh_token()

    db_token = RefreshToken(
      user_id=db_user.id,
      jti=refresh_token,  # ✅ เก็บ plain token (หรือ hash ก็ได้)
      token_hash=hash_password(refresh_token),
      expires_at=datetime.now(timezone.utc) + timedelta(days=7)
)

    db.add(db_token)
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/pre_register",response_model= UserResponsePreRegister)
def pre_register(user: UserCreatePreRegister, db:Session = Depends(get_db)):
   exist_user = db.query(User).filter(User.username == user.username).first()
   if exist_user :
        raise HTTPException(status_code=401,detail="Usernameถูกใช้ไปแล้ว")
   exist_email = db.query(User).filter(User.email == user.email).first()
   if exist_email:
        raise HTTPException(status_code=401, detail="Emailนี้ถูกใช้ไปแล้ว")
   exist_pre = db.query(PreUser).filter(
   PreUser.email == user.email,
   PreUser.purpose == PreUserStatus.REGISTER).first()
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
                    is_verified = False,
                    purpose=PreUserStatus.REGISTER
                    )
   db.add(new_user)
   db.commit()
   db.refresh(new_user)
   send_otp_email(new_user.email,OTP)


   return new_user

@router.get("/profile")
def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "email": current_user.email
    }

@router.patch("/edit_profile")
def edit_profile(
    user_update: UserUpdateProfile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user_update.firstname is not None:
        current_user.firstname = user_update.firstname

    if user_update.lastname is not None:
        current_user.lastname = user_update.lastname

    if user_update.phone is not None:
        current_user.phone = user_update.phone
    
    if user_update.profile_img is not None:
        current_user.profile_img = user_update.profile_img

    db.commit()
    db.refresh(current_user)

    return {
        "message": "Profile updated successfully",
        "user": {
            "username": current_user.username,
            "firstname": current_user.firstname,
            "lastname": current_user.lastname,
            "phone": current_user.phone,
            "profile_img" : current_user.profile_img
        }
    }

@router.patch("/change_email")
def change_email(
    data: UserChangeEmail,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # เช็ค email ซ้ำ
    exist_email = db.query(User).filter(User.email == data.new_email).first()
    if exist_email:
        raise HTTPException(status_code=400, detail="Email นี้ถูกใช้แล้ว")

    # หา pre_user (ใช้เป็น temp เก็บ OTP)
    pre_user = db.query(PreUser).filter(
    PreUser.email == data.new_email,
    PreUser.purpose == PreUserStatus.CHANGE_EMAIL).first()
    if not pre_user:
        raise HTTPException(status_code=400, detail="กรุณาขอ OTP ก่อน")

    # verify OTP
    verify_otp_internal(
    data.new_email,
    data.otp,
    PreUserStatus.CHANGE_EMAIL,
    db
)

    # update email
    current_user.email = data.new_email

    # ลบ pre_user
    db.delete(pre_user)

    db.commit()

    return {"message": "เปลี่ยน email สำเร็จ"}


@router.patch("/change_password")
def change_password(
    data: UserChangePassword,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # เช็ครหัสเดิม
    if not verify_password(data.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="รหัสผ่านเดิมไม่ถูกต้อง")

    # กันตั้งรหัสซ้ำ
    if verify_password(data.new_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="ห้ามใช้รหัสเดิม")

    # อัปเดต
    current_user.password_hash = hash_password(data.new_password)

    db.commit()

    return {"message": "เปลี่ยนรหัสผ่านสำเร็จ"}


@router.post("/request_reset_password")
def request_reset_password(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="ไม่พบ email")

    OTP = generate_otp()

    pre_user = db.query(PreUser).filter(
        PreUser.email == email,
        PreUser.purpose == PreUserStatus.RESET_PASSWORD
    ).first()

    if not pre_user:
        pre_user = PreUser(
            email=email,
            username=user.username,
            password_hash="",
            firstname="",
            phone="",
            purpose=PreUserStatus.RESET_PASSWORD
        )
        db.add(pre_user)

    pre_user.otp_code = hash_password(OTP)
    pre_user.otp_expire = datetime.now(timezone.utc) + timedelta(minutes=5)
    pre_user.otp_attempts = 0
    pre_user.is_verified = False

    db.commit()

    send_otp_email(email, OTP)

    return {"message": "OTP sent"}

@router.patch("/reset_password")
def reset_password(
    email: str,
    otp: str,
    new_password: str,
    db: Session = Depends(get_db)
):
    pre_user = verify_otp_internal(
        email,
        otp,
        PreUserStatus.RESET_PASSWORD,
        db
    )

    user = db.query(User).filter(User.email == email).first()

    user.password_hash = hash_password(new_password)

    db.delete(pre_user)
    db.commit()

    return {"message": "รีเซ็ตรหัสผ่านสำเร็จ"}

@router.post("/refresh")
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):

    db_token = db.query(RefreshToken).filter(
        RefreshToken.jti == refresh_token,
        RefreshToken.is_revoked == False
    ).first()

    if not db_token:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if db_token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Token expired")

    # rotate
    db_token.is_revoked = True

    new_refresh = create_refresh_token()

    new_db_token = RefreshToken(
        user_id=db_token.user_id,
        jti=new_refresh,
        token_hash=hash_password(new_refresh),
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )

    db.add(new_db_token)
    db.commit()

    user = db.query(User).filter(User.id == db_token.user_id).first()

    new_access = create_access_token({
        "sub": user.username,
        "user_id": user.id,
        "role": user.rolestatus.value
    })

    return {
        "access_token": new_access,
        "refresh_token": new_refresh
    }

@router.post("/logout")
def logout(refresh_token: str, db: Session = Depends(get_db)):

    db_token = db.query(RefreshToken).filter(
        RefreshToken.jti == refresh_token,
        RefreshToken.is_revoked == False
    ).first()

    if not db_token:
        raise HTTPException(status_code=401, detail="Invalid token")

    db_token.is_revoked = True
    db.commit()

    return {"message": "Logged out"}