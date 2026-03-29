from fastapi import APIRouter,Depends,HTTPException,Header
from app.database import get_db
from sqlalchemy.orm import Session
from app.model import Chair, OpeningDate, QueueSlots,User,BookedStatus,TypeUser,UserRole,Barber
from app.rolebase import require_roles,require_barber

router = APIRouter(prefix="/barber_manage",tags=["Barber_Manage"])

@router.get("/barber_view")
def getBarber(db:Session = Depends(get_db),user: User = Depends(require_roles([UserRole.OWNER]))):
    barber_table = db.query(Barber).all()
    if not barber_table:
        raise HTTPException(404,"ไม่พบพนักงาน")
    return barber_table

@router.post("/assign_chair")
def assign_chair(
    chair_id: int,
    barber_id: int,
    user: User = Depends(require_roles([UserRole.OWNER])),
    db: Session = Depends(get_db),
):
    chair = db.query(Chair).filter(Chair.id == chair_id).first()
    if not chair:
        raise HTTPException(404, "Chair not found")

    barber = db.query(Barber).filter(Barber.id == barber_id).first()
    if not barber:
        raise HTTPException(404, "Barber not found")

    # ❗ กัน barber มีหลายเก้าอี้ (optional rule)
    existing = db.query(Chair).filter(
        Chair.barber_id == barber_id
    ).first()

    if existing:
        raise HTTPException(400, "Barber already has a chair")

    chair.barber_id = barber_id

    try:
        db.commit()
        db.refresh(chair)
    except:
        db.rollback()
        raise HTTPException(500, "Database error")

    return {
        "message": "Chair assigned",
        "chair_id": chair.id,
        "barber_id": barber_id
    }