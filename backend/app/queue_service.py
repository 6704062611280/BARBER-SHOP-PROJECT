from fastapi import APIRouter,Depends,HTTPException,Header
from app.database import get_db
from sqlalchemy.orm import Session
from app.model import Chair, OpeningDate, QueueSlots,User,BookedStatus,TypeUser,UserRole,Barber
from datetime import date
from app.schemas import QueueResponse
from app.rolebase import require_roles,require_barber
from app.backtask import get_current_user
from datetime import datetime, timedelta

router = APIRouter(prefix="/queue_service",tags=["Queue_Service"])

allowed_transitions = {
    BookedStatus.AVAILABLE: [BookedStatus.BOOKED],
    BookedStatus.CANCELLED: [BookedStatus.BOOKED],  
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
    chairs = opening.chairs
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

@router.get("/barber/{barber_id}/queues", response_model=list[QueueResponse])
def viewWorkingTable(barber_id: int,dateshop:date = date.today(), db: Session = Depends(get_db)):
    opening = db.query(OpeningDate).filter(OpeningDate.date_open == dateshop).first()
    if not opening:
        raise HTTPException(status_code=400,detail="No schedule for this day")
    if not opening.is_open:
        raise HTTPException(status_code=400, detail="Shop closed")
    barber = db.query(Barber).filter(Barber.id == barber_id).first()
    if not barber:
        raise HTTPException(status_code=404, detail="Barber table working time not found")
    queues_slot = db.query(QueueSlots).filter( QueueSlots.barber_id == barber.id,QueueSlots.date_working == dateshop).all()
    return queues_slot



@router.post("/queues/{queue_id}/booked", response_model=QueueResponse)
def bookedQueuesByCustomer(
    chair_id: int,
    queue_id: int,
    user: User = Depends(require_roles([UserRole.CUSTOMER])),
    db: Session = Depends(get_db)
):
    queue = get_queue_or_404(db,queue_id)
    if queue.status == BookedStatus.NO_SHOW:
        raise HTTPException(400, "Slot expired and cannot be booked")
    validate_transition(queue.status, BookedStatus.BOOKED)
    chair = db.query(Chair).filter(Chair.id == chair_id).first()
    if not chair:
        raise HTTPException(status_code=404, detail="Chair not found")
    if queue.chair_id != chair.id:
        raise HTTPException(status_code=400, detail="Queue not in this chair")
    queue.customer_id = user.id
    queue.status = BookedStatus.BOOKED
    queue.status_user = TypeUser.ONLINE
    try:
      db.commit()
      db.refresh(queue)
    except:
      db.rollback()
      raise HTTPException(500, "Database error")
    return queue

@router.post("/barber/{barber_id}/queues/{queue_id}/booked", response_model=QueueResponse)
def bookedQueuesByBarber(
    barber_id:int,
    queue_id:int,
    user: User = Depends(require_barber()),
    db: Session = Depends(get_db)
):
    if user.barber.id != barber_id:
        raise HTTPException(status_code=403, detail="Not your barber profile")
    queue = get_queue_or_404(db,queue_id)
    if queue.status == BookedStatus.NO_SHOW:
        raise HTTPException(400, "Slot expired and cannot be booked")
    validate_transition(queue.status, BookedStatus.BOOKED)
    queue.customer_id = user.id
    queue.status = BookedStatus.BOOKED
    queue.status_user = TypeUser.WALK_IN
    try:
      db.commit()
      db.refresh(queue)
    except:
      db.rollback()
      raise HTTPException(500, "Database error")
    return queue


@router.post("/queues/{queue_id}/cancel", response_model=QueueResponse)
def cancelByCustomer(
    queue_id:int,
    user: User = Depends(require_roles([UserRole.CUSTOMER])),
    db: Session = Depends(get_db)
):
    queue = get_queue_or_404(db,queue_id)
    if queue.customer_id != user.id:
        raise HTTPException(status_code=403, detail="Not your queue")
    validate_transition(queue.status, BookedStatus.CANCELLED)
    queue.status = BookedStatus.CANCELLED
    queue.customer_id = None
    queue.status_user = TypeUser.NONE
    try:
      db.commit()
      db.refresh(queue)
    except:
      db.rollback()
      raise HTTPException(500, "Database error")
    return queue

@router.post("/barber/{barber_id}/queues/{queue_id}/cancel")
def cancelByBarber(
    barber_id:int,
    queue_id:int,
    user: User = Depends(require_barber()),
    db: Session = Depends(get_db)
):
    if user.barber.id != barber_id:
        raise HTTPException(status_code=403, detail="Not your barber profile")
    queue = get_queue_or_404(db,queue_id)
    validate_transition(queue.status, BookedStatus.CANCELLED)
    queue.status = BookedStatus.CANCELLED
    queue.customer_id = None
    queue.status_user = TypeUser.NONE
    try:
      db.commit()
      db.refresh(queue)
    except:
      db.rollback()
      raise HTTPException(500, "Database error")
    return {"message":"Queue cancelled"}

def auto_cancel_queue(queue_id: int, db: Session):
    queue = db.query(QueueSlots)\
        .filter(QueueSlots.id == queue_id)\
        .with_for_update()\
        .first()

    if not queue:
        return

    if queue.status != BookedStatus.BOOKED:
        return

    start_dt = datetime.combine(queue.date_working, queue.start_time)

    if datetime.now() < start_dt + timedelta(minutes=5):
        return

    validate_transition(queue.status, BookedStatus.NO_SHOW)

    queue.status = BookedStatus.NO_SHOW
    queue.customer_id = None
    queue.status_user = TypeUser.NONE

    try:
        db.commit()
    except:
        db.rollback()

@router.post("/barber/{barber_id}/queues/{queue_id}/checkin")
def checkin(
    barber_id:int,
    queue_id:int,
    user: User = Depends(require_barber()),
    db: Session = Depends(get_db)
):
    if user.barber.id != barber_id:
        raise HTTPException(status_code=403, detail="Not your barber profile")
    queue = get_queue_or_404(db,queue_id)
    if queue.barber_id != barber_id:
        raise HTTPException(status_code=403, detail="Not your queue")
    validate_transition(queue.status, BookedStatus.CHECKIN)
    queue.status = BookedStatus.CHECKIN
    try:
      db.commit()
      db.refresh(queue)
    except:
      db.rollback()
      raise HTTPException(500, "Database error")
    return {"message":"Customer checked in"}

@router.post("/barber/{barber_id}/queues/{queue_id}/complete")
def checkout(
    barber_id:int,
    queue_id:int,
    user: User = Depends(require_barber()),
    db: Session = Depends(get_db)
):
    if user.barber.id != barber_id:
        raise HTTPException(status_code=403, detail="Not your barber profile")
    queue = get_queue_or_404(db,queue_id)
    if queue.barber_id != barber_id:
        raise HTTPException(status_code=403, detail="Not your queue")
    validate_transition(queue.status, BookedStatus.COMPLETE)
    queue.status = BookedStatus.COMPLETE
    try:
      db.commit()
      db.refresh(queue)
    except:
      db.rollback()
      raise HTTPException(500, "Database error")
    return {"message":"Service completed"}

@router.post("/queues_generate")
def generate_queues(
    dateshop: date,
    interval_minutes: int = 60,
    user: User = Depends(require_roles([UserRole.OWNER])),
    db: Session = Depends(get_db),
):
    opening = db.query(OpeningDate).filter(
        OpeningDate.date_open == dateshop
    ).first()

    if not opening:
        raise HTTPException(404, "No opening date")

    if not opening.is_open:
        raise HTTPException(400, "Shop closed")

    chairs = opening.chairs
    if not chairs:
        raise HTTPException(400, "No chairs")

    created = 0

    for chair in chairs:
        current = datetime.combine(dateshop, opening.open_time)
        end = datetime.combine(dateshop, opening.close_time)

        while current < end:
            start_time = current.time()
            next_time = current + timedelta(minutes=interval_minutes)
            end_time = next_time.time()

            # 🔥 เช็คว่ามี slot แล้วไหม
            exists = db.query(QueueSlots).filter(
                QueueSlots.chair_id == chair.id,
                QueueSlots.date_working == dateshop,
                QueueSlots.start_time == start_time
            ).first()

            if not exists:
                slot = QueueSlots(
                    start_time=start_time,
                    end_time=end_time,
                    chair_id=chair.id,
                    barber_id=None,  # ❗ เดี๋ยวค่อย assign ทีหลัง
                    date_working=dateshop,
                    status=BookedStatus.AVAILABLE,
                    status_user=TypeUser.NONE
                )
                db.add(slot)
                created += 1

            current = next_time

    try:
        db.commit()
    except:
        db.rollback()
        raise HTTPException(500, "Database error")

    return {
        "message": "Queues generated",
        "created_slots": created
    }