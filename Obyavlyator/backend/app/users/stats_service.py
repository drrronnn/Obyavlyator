from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from datetime import date
from app.parsers.models import Listing
from app.rent.models import RentListing
from app.listings.models import ListingMetadata, ListingHistory

def get_user_stats(db: Session, user_id: str, start_date: date, end_date: date) -> dict:
    """Получить статистику пользователя за период"""
    
    # Всего объявлений - листинги, где пользователь был назначен ответственным в указанный период
    # Используем ListingHistory для определения момента назначения
    assignment_history_ids = db.query(ListingHistory.listing_id).filter(
        and_(
            ListingHistory.action == "assigned",
            ListingHistory.new_value == user_id,
            ListingHistory.created_at >= start_date,
            ListingHistory.created_at <= end_date
        )
    ).distinct().all()
    
    total_ads = len(assignment_history_ids) if assignment_history_ids else 0
    assignment_listing_ids = [h.listing_id for h in assignment_history_ids]
    
    # Наших квартир - из назначенных листингов, сколько было перемещено в аренду
    # Считаем ВСЕ листинги из назначенных, которые попали в RentListing
    # независимо от того, кто указан как responsible_user_id в RentListing
    our_apartments = 0
    if assignment_listing_ids:
        our_apartments = db.query(func.count(RentListing.id)).filter(
            RentListing.listing_id.in_(assignment_listing_ids)
        ).scalar() or 0
    
    # Конверсия - процент успешно переведенных в аренду листингов
    conversion = round((our_apartments / total_ads * 100), 2) if total_ads > 0 else 0.0
    
    return {
        "total_ads": total_ads,
        "our_apartments": our_apartments,
        "conversion": conversion
    }
