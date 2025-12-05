from sqlalchemy.orm import Session
from sqlalchemy import or_
from rapidfuzz import fuzz
from app.parsers.models import Listing, ListingFilters, ListingStats
from app.favorites.models import Favorite
from typing import List, Tuple

def round_up_price(price: float) -> int:
    """Округлить цену вверх до 100,000"""
    if price <= 0:
        return 0
    return int((price // 100_000 + 1) * 100_000)

def round_up_meters(meters: float) -> int:
    """Округлить площадь вверх до 10"""
    if meters <= 0:
        return 0
    return int((meters // 10 + 1) * 10)

def apply_listing_filters(query, deal_type=None, source=None, rooms_count=None, 
                         min_price=None, max_price=None, min_meters=None, 
                         max_meters=None, search=None, status=None, responsible=None, 
                         company_id=None, db=None):
    """Универсальная функция для применения фильтров к запросу listings"""
    from app.listings.models import ListingMetadata
    
    if deal_type:
        query = query.filter(Listing.deal_type == deal_type)
    if source:
        query = query.filter(Listing.source == source)
    if min_price is not None:
        query = query.filter(Listing.price >= min_price)
    if max_price is not None:
        query = query.filter(Listing.price <= max_price)
    if min_meters is not None:
        query = query.filter(Listing.total_meters >= min_meters)
    if max_meters is not None:
        query = query.filter(Listing.total_meters <= max_meters)
    if rooms_count:
        rooms_parts = [r.strip() for r in rooms_count.split(',')]
        rooms_list = [int(r) for r in rooms_parts if r.isdigit() and int(r) <= 6]
        has_studio = 'studio' in rooms_parts
        
        if rooms_list or has_studio:
            conditions = []
            if rooms_list:
                conditions.append(Listing.rooms_count.in_(rooms_list))
            if has_studio:
                conditions.append(Listing.home_type == 'studio')
            query = query.filter(or_(*conditions))
    if search:
        all_listings = query.all()
        search_words = search.lower().split()
        
        filtered_ids = []
        for listing in all_listings:
            location_words = listing.location.lower().split()
            for search_word in search_words:
                for location_word in location_words:
                    if fuzz.partial_ratio(search_word, location_word) >= 80:
                        filtered_ids.append(listing.id)
                        break
                else:
                    continue
                break
        
        if filtered_ids:
            query = query.filter(Listing.id.in_(filtered_ids))
        else:
            query = query.filter(Listing.id == None)
    
    # Фильтры по метаданным (используем JOIN для производительности)
    if (status or responsible or company_id) and company_id and db:
        query = query.outerjoin(
            ListingMetadata,
            (Listing.id == ListingMetadata.listing_id) & 
            (ListingMetadata.company_id == company_id)
        )
        
        if status:
            query = query.filter(
                (ListingMetadata.status == status) | 
                ((ListingMetadata.status == None) & (status == 'new'))
            )
        
        if responsible:
            query = query.filter(ListingMetadata.responsible_user_id == responsible)
    
    return query

def get_paginated_listings(db: Session, page: int, per_page: int = 10, **filters) -> Tuple[List[Listing], int, int, ListingFilters, ListingStats]:
    """Получает пагинированные listings с фильтрами и статистикой"""
    skip = (page - 1) * per_page
    
    query = db.query(Listing)
    query = apply_listing_filters(query, db=db, **filters)
    
    total = query.count()
    listings = query.offset(skip).limit(per_page).all()
    total_pages = (total + per_page - 1) // per_page
    

    
    # Общая статистика по всем listings (без фильтров)
    max_price_listing = db.query(Listing).filter(Listing.price.isnot(None)).order_by(Listing.price.desc()).first()
    max_meters_listing = db.query(Listing).filter(Listing.total_meters.isnot(None)).order_by(Listing.total_meters.desc()).first()
    
    current_filters = ListingFilters(
        deal_type=filters.get('deal_type'),
        source=filters.get('source'),
        rooms_count=[r.strip() for r in filters.get('rooms_count', '').split(',') if r.strip().isdigit() or r.strip() == 'studio'] if filters.get('rooms_count') else None,
        min_price=filters.get('min_price'),
        max_price=filters.get('max_price'),
        min_meters=filters.get('min_meters'),
        max_meters=filters.get('max_meters'),
        search=filters.get('search')
    )
    
    max_price = max_price_listing.price if max_price_listing else None
    rounded_max_price = round_up_price(max_price) if max_price else None
    
    max_meters = max_meters_listing.total_meters if max_meters_listing else None
    rounded_max_meters = round_up_meters(max_meters) if max_meters else None
    
    stats = ListingStats(
        max_price=rounded_max_price,
        max_meters=rounded_max_meters
    )
    
    return listings, total, total_pages, current_filters, stats

def get_favorite_listings(db: Session, user_id: str, page: int, per_page: int = 10, **filters):
    """Получает пагинированные фавориты с фильтрами для конкретного пользователя"""
    skip = (page - 1) * per_page
    
    # Получаем ID избранных объявлений для конкретного пользователя
    favorite_ids = db.query(Favorite.listing_id).filter(Favorite.user_id == user_id).all()
    favorite_listing_ids = [fav.listing_id for fav in favorite_ids]
    
    if not favorite_listing_ids:
        return [], 0, 0, ListingFilters(**filters), ListingStats(max_price=None, max_meters=None)
    
    # Применяем фильтры к избранным объявлениям
    query = db.query(Listing).filter(Listing.id.in_(favorite_listing_ids))
    query = apply_listing_filters(query, db=db, **filters)
    
    total = query.count()
    listings = query.offset(skip).limit(per_page).all()
    total_pages = (total + per_page - 1) // per_page
    

    
    # Общая статистика по всем фаворитам (без дополнительных фильтров)
    max_price_listing = db.query(Listing).filter(Listing.id.in_(favorite_listing_ids), Listing.price.isnot(None)).order_by(Listing.price.desc()).first()
    max_meters_listing = db.query(Listing).filter(Listing.id.in_(favorite_listing_ids), Listing.total_meters.isnot(None)).order_by(Listing.total_meters.desc()).first()
    
    current_filters = ListingFilters(
        deal_type=filters.get('deal_type'),
        source=filters.get('source'),
        rooms_count=[r.strip() for r in filters.get('rooms_count', '').split(',') if r.strip().isdigit() or r.strip() == 'studio'] if filters.get('rooms_count') else None,
        min_price=filters.get('min_price'),
        max_price=filters.get('max_price'),
        min_meters=filters.get('min_meters'),
        max_meters=filters.get('max_meters'),
        search=filters.get('search')
    )
    
    max_price = max_price_listing.price if max_price_listing else None
    rounded_max_price = round_up_price(max_price) if max_price else None
    
    max_meters = max_meters_listing.total_meters if max_meters_listing else None
    rounded_max_meters = round_up_meters(max_meters) if max_meters else None
    
    stats = ListingStats(
        max_price=rounded_max_price,
        max_meters=rounded_max_meters
    )
    
    return listings, total, total_pages, current_filters, stats