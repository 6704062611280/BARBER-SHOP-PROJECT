from pydantic import BaseModel,EmailStr, Field
from datetime import datetime,date,time
from app.model import UserRole,BookedStatus,TypeUser
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
    email: EmailStr
    phone: str
    create_at: datetime
    update_at: datetime
    

    class Config:
        from_attributes = True

class UserCreateLogin(BaseModel):
    username:str
    password: str = Field(min_length=8)

class UserResponseLogin(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    
    class Config:
        from_attributes = True



class QueueResponse(BaseModel):
    id: int
    start_time: time
    end_time: time
    chair_id: int
    barber_id: Optional[int]
    customer_id: Optional[int]
    date_working: date
    status: BookedStatus
    status_user: TypeUser


    class Config:
        from_attributes = True

class ChairCreate(BaseModel):
    chair_name: str


class ChairResponse(BaseModel):
    id:int
    name:str

class OpenDateCreate(BaseModel):
    date_open: date
    open_time: time
    close_time: time
    is_open: bool


class OpenDateResponse(BaseModel):
    date_open: date
    open_time: time
    close_time: time
    is_open: bool

    class Config:
        from_attributes = True

class UserCreatePreRegister(BaseModel):
    username:str
    password: str = Field(min_length=8)
    firstname:str
    lastname: str|None = None
    email: EmailStr
    phone: str

class UserResponsePreRegister(BaseModel):
    id:int
    username:str
    firstname:str
    lastname: str|None = None
    rolestatus: UserRole
    email: EmailStr
    phone: str
    is_verified: bool
    

    class Config:
        from_attributes = True

class UserUpdateProfile(BaseModel):
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    profile_img: Optional[str] = None

class UserChangePassword(BaseModel):
    old_password: str = Field(min_length=8)
    new_password: str = Field(min_length=8)


class UserChangeEmail(BaseModel):
    new_email: str
    otp: str

    