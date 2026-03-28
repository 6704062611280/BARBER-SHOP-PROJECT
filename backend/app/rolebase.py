from fastapi import Depends
from app.model import UserRole
from app.auth import get_current_user
from fastapi import APIRouter,Depends,HTTPException

def require_role(role: UserRole):
    def role_checker(user = Depends(get_current_user)):
        if user.rolestatus != role:
            raise HTTPException(status_code=403, detail="Unauthorized")
        return user
    return role_checker