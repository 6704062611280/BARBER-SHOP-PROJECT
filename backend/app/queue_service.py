from fastapi import APIRouter,Depends,HTTPException
from app.database import get_db
from sqlalchemy.orm import Session
from app.model import Chair, OpeningDate, QueueSlots
from datetime import date
from app.schemas import QueueResponse

router = APIRouter(prefix="/queue_service",tags=["Queue_Service"])

@router.get("/view_chair")
def viewChairs(dateshop:date = date.today(),db:Session = Depends(get_db)):
    opening = db.query(OpeningDate).filter(OpeningDate.date_open == dateshop).first()
    if not opening:
        raise HTTPException(status_code=400,detail="No schedule for this day")
    if not opening.is_open:
        raise HTTPException(status_code=400, detail="Shop closed")
    chairs = db.query(Chair).all()
    return {
        "date": dateshop,
        "open_time": opening.open_time,
        "close_time": opening.close_time,
        "chairs": chairs
    }

@router.get("/view_chair/{id}/schedule", response_model=list[QueueResponse])
def viewChair(id: int,dateshop:date = date.today(), db: Session = Depends(get_db)):
    opening = db.query(OpeningDate).filter(OpeningDate.date_open == dateshop).first()
    if not opening:
        raise HTTPException(status_code=400,detail="No schedule for this day")
    if not opening.is_open:
        raise HTTPException(status_code=400, detail="Shop closed")
    chair = db.query(Chair).filter(Chair.id == id).first()
    if not chair:
        raise HTTPException(status_code=404, detail="Chair not found")
    queues_slot = db.query(QueueSlots).filter( QueueSlots.chair_id == id,QueueSlots.date_working == dateshop).all()
    return queues_slot
