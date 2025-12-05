from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date
from app.db import get_db
from app.users.models import User
from app.auth.utils import get_current_user
from app.users.stats_service import get_user_stats
from pydantic import BaseModel

router = APIRouter(prefix="/stats", tags=["Stats"])

class UserStatsResponse(BaseModel):
    total_ads: int
    our_apartments: int
    conversion: float

@router.get("/{user_id}", response_model=UserStatsResponse)
async def get_stats(
    user_id: str,
    start_date: date = Query(...),
    end_date: date = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить статистику пользователя за период"""
    stats = get_user_stats(db, user_id, start_date, end_date)
    return stats
