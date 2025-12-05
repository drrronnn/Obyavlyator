from fastapi import APIRouter, Depends
from app.auth.utils import get_current_user
from app.users.models import User

router = APIRouter(prefix="/protected", tags=["protected"])


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Получить информацию о текущем пользователе"""
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "is_verified": current_user.is_verified
    }
