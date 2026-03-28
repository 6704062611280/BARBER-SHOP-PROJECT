from pydantic import BaseModel
from datetime import datetime,date,time
from app.model import UserRole
from typing import Optional


class UserCreateRegister(BaseModel):
    email: str
    otp: str


class UserResponseRegister(BaseModel):
    id:int
    username:str
    firstname:str
    lastname: str|None = None
    rolestatus: UserRole
    email: str
    phone: str
    create_at: datetime
    update_at: datetime
    

    class Config:
        from_attributes = True

class UserCreateLogin(BaseModel):
    username:str
    password:str

class UserResponseLogin(BaseModel):
    username:str
    
    class Config:
        from_attributes = True

class QueueCreate(BaseModel):
    barber_id: int
    date: date
    time: time


class QueueResponse(BaseModel):
    id: int
    start_time: time
    end_time: time
    chair_id: int
    date_working: date
    status: str

    class Config:
        from_attributes = True

class ChairCreate(BaseModel):
    chair_name: str


class ChairResponse(BaseModel):
    id:int
    chair_name:str

class OpenDateCreate(BaseModel):
    open_date:date
    start_time:time
    end_time:time
    is_open: bool


class OpenDateResponse(BaseModel):
    open_date:date
    start_time:time
    end_time:time
    is_open: bool

    class Config:
        from_attributes = True

class UserCreatePreRegister(BaseModel):
    username:str
    password:str
    firstname:str
    lastname: str|None = None
    email: str
    phone: str

class UserResponsePreRegister(BaseModel):
    id:int
    username:str
    firstname:str
    lastname: str|None = None
    rolestatus: UserRole
    email: str
    phone: str
    is_verified: bool
    

    class Config:
        from_attributes = True

class UserUpdateProfile(BaseModel):
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    profile_img: Optional[str] = None

class UserChangePassword(BaseModel):
    old_password: str
    new_password: str

class UserChangeEmail(BaseModel):
    new_email: str
    otp: str