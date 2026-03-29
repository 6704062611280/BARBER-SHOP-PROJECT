from sqlalchemy import UniqueConstraint,Column,CheckConstraint, Integer, Time, Boolean, String, ForeignKey, Float, Enum, Date, DateTime,Table,func
from datetime import datetime,date,time,timezone
from app.database import Base, engine, get_db
import enum
from sqlalchemy.orm import relationship,Mapped,mapped_column

class BookedStatus(enum.Enum):
    AVAILABLE = "AVAILABLE"
    BOOKED = "BOOKED"
    CHECKIN = "CHECKIN"
    CANCELLED = "CANCELLED"
    COMPLETE = "COMPLETE"
    NO_SHOW = "NO_SHOW"

class PreUserStatus(enum.Enum):
    CHANGE_EMAIL = "CHANGE_EMAIL"
    REGISTER = "REGISTER"
    RESET_PASSWORD = "RESET_PASSWORD"


class TypeUser(enum.Enum):
    WALK_IN = "WALK_IN"
    ONLINE = "ONLINE"
    NONE = "NONE"

class UserRole(enum.Enum):
    CUSTOMER = "CUSTOMER"
    EMPLOYEE = "EMPLOYEE"
    OWNER = "OWNER"

class LeaveStatus(enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class User(Base):
    __tablename__ = "users"

    id:Mapped[int] = mapped_column(primary_key=True)
    username:Mapped[str] = mapped_column(String(50),unique=True,nullable=False)
    password_hash:Mapped[str] = mapped_column(String(255),nullable=False)
    firstname:Mapped[str] = mapped_column(String(50),nullable=False)
    lastname:Mapped[str | None] = mapped_column(String(50))
    rolestatus:Mapped[UserRole] = mapped_column(Enum(UserRole),default=UserRole.CUSTOMER)#member barber(staff) owner
    email:Mapped[str] = mapped_column(String(50),unique=True,nullable=False)
    phone:Mapped[str] = mapped_column(String(50),nullable=False)
    last_activity:Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    barber:Mapped["Barber"] = relationship(back_populates="user_data", uselist=False)
    profile_img:Mapped[str | None] = mapped_column(String(255))#ใส่path
    create_at:Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    update_at:Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    queues:Mapped[list["QueueSlots"]] = relationship(back_populates="customer")
   
    


class PreUser(Base):
    __tablename__="pre_user"

    id:Mapped[int] = mapped_column(primary_key=True)
    username:Mapped[str] = mapped_column(String(50),nullable=False)
    password_hash:Mapped[str] = mapped_column(String(255),nullable=False)
    firstname:Mapped[str] = mapped_column(String(50),nullable=False)
    lastname:Mapped[str | None] = mapped_column(String(50))
    phone:Mapped[str] = mapped_column(String(50),nullable=False)
    email:Mapped[str] = mapped_column(String(50),nullable=False)
    purpose: Mapped[PreUserStatus] = mapped_column(Enum(PreUserStatus))
    otp_code:Mapped[str] = mapped_column(String(50),nullable=True)
    otp_expire:Mapped[datetime] = mapped_column(DateTime(timezone=True),nullable=True)
    otp_attempts:Mapped[int] = mapped_column(Integer,default=0)
    is_verified:Mapped[bool] = mapped_column(Boolean, default=False)
    __table_args__ = (
    UniqueConstraint("email", "purpose", name="uq_email_purpose"),
)

class Barber(Base):
    __tablename__ = "barbers"

    id:Mapped[int] = mapped_column(primary_key=True)
    user_id:Mapped[int] = mapped_column(ForeignKey("users.id"))
    user_data:Mapped["User"] = relationship("User", back_populates="barber")
    leave_letter:Mapped[list["LeaveLetter"]] = relationship("LeaveLetter", back_populates="barber")



class Chair(Base):
    __tablename__ = "chairs"

    id:Mapped[int] = mapped_column(primary_key=True)
    name = mapped_column(String(50), nullable=False)
    queues:Mapped[list["QueueSlots"]] = relationship("QueueSlots",back_populates="chair")

class QueueSlots(Base):
    __tablename__ = "queue_slots"

    id:Mapped[int] = mapped_column(primary_key=True)
    start_time:Mapped[time] = mapped_column(Time,nullable=False)
    end_time:Mapped[time] = mapped_column(Time,nullable=False)
    chair_id:Mapped[int] = mapped_column(ForeignKey("chairs.id"))
    customer_id:Mapped[int | None] = mapped_column(
    ForeignKey("users.id", ondelete="SET NULL"),
    nullable=True
)
    #AVAILABLE, BOOKED, SERVING, CANCELLED, COMPLETED
    status:Mapped[BookedStatus] = mapped_column(Enum(BookedStatus),default=BookedStatus.AVAILABLE)
    status_user:Mapped[TypeUser] = mapped_column(Enum(TypeUser),default=TypeUser.NONE)
    date_working: Mapped[date] = mapped_column(Date, nullable=False)
    chair:Mapped["Chair"] = relationship(back_populates="queues")
    customer:Mapped["User"] = relationship(back_populates="queues")
    __table_args__ = (UniqueConstraint("chair_id", "date_working", "start_time"),CheckConstraint("end_time > start_time")
)
   
   
    

class LeaveLetter(Base):
    __tablename__ = "leave_letters"

    id:Mapped[int] = mapped_column(primary_key=True)
    barber_id:Mapped[int] = mapped_column(ForeignKey("barbers.id"))
    report:Mapped[str] = mapped_column(String(255),nullable=False)
    date_leave:Mapped[date] = mapped_column(Date, default=date.today)
    status:Mapped[LeaveStatus] = mapped_column(Enum(LeaveStatus),default=LeaveStatus.PENDING)
    create_at:Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    barber = relationship("Barber", back_populates="leave_letter")

class OpeningDate(Base):
    __tablename__ = "opening_date"

    id = mapped_column(primary_key=True)
    is_open = mapped_column(Boolean, default=False)

    open_time = mapped_column(Time, nullable=False)
    close_time = mapped_column(Time, nullable=False)

    
class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    token_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    jti = Column(String, unique=True, index=True)
    
    user = relationship("User")