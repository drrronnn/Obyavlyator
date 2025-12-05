from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.rent.models import RentListing, RentListingCreate, RentListingUpdate
from app.listings.models import ListingMetadata
from typing import Optional

def create_rent_listing(db: Session, data: RentListingCreate, company_id: str) -> RentListing:
    """Создать запись аренды"""
    rent_listing = RentListing(
        listing_id=data.listing_id,
        company_id=company_id,
        tenant_first_name=data.tenant_first_name,
        tenant_last_name=data.tenant_last_name,
        tenant_phone=data.tenant_phone,
        rent_price=data.rent_price,
        rent_start_date=data.rent_start_date,
        rent_end_date=data.rent_end_date,
        responsible_user_id=data.responsible_user_id
    )
    db.add(rent_listing)
    
    # Обновить ответственного в метаданных листинга если указан
    if data.responsible_user_id:
        metadata = db.query(ListingMetadata).filter(
            and_(
                ListingMetadata.listing_id == data.listing_id,
                ListingMetadata.company_id == company_id
            )
        ).first()
        
        if metadata:
            metadata.responsible_user_id = data.responsible_user_id
    
    db.commit()
    db.refresh(rent_listing)
    return rent_listing

def get_rent_listing(db: Session, listing_id: str, company_id: str) -> Optional[RentListing]:
    """Получить запись аренды по listing_id"""
    return db.query(RentListing).filter(
        and_(
            RentListing.listing_id == listing_id,
            RentListing.company_id == company_id
        )
    ).first()

def update_rent_listing(db: Session, listing_id: str, company_id: str, data: RentListingUpdate) -> Optional[RentListing]:
    """Обновить запись аренды"""
    rent_listing = get_rent_listing(db, listing_id, company_id)
    if not rent_listing:
        return None
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(rent_listing, key, value)
    
    # Обновить ответственного в метаданных если изменен
    if data.responsible_user_id is not None:
        metadata = db.query(ListingMetadata).filter(
            and_(
                ListingMetadata.listing_id == listing_id,
                ListingMetadata.company_id == company_id
            )
        ).first()
        
        if metadata:
            metadata.responsible_user_id = data.responsible_user_id
    
    db.commit()
    db.refresh(rent_listing)
    return rent_listing

def delete_rent_listing(db: Session, listing_id: str, company_id: str) -> bool:
    """Удалить запись аренды"""
    rent_listing = get_rent_listing(db, listing_id, company_id)
    if not rent_listing:
        return False
    
    db.delete(rent_listing)
    db.commit()
    return True

def round_up_price(price: float) -> int:
    """Округлить цену аренды вверх до 10,000"""
    if price <= 0:
        return 0
    return int((price // 10_000 + 1) * 10_000)

def round_up_meters(meters: float) -> int:
    """Округлить площадь вверх до 10"""
    if meters <= 0:
        return 0
    return int((meters // 10 + 1) * 10)

def get_all_rent_listings(db: Session, company_id: str, page: int = 1, page_size: int = 20, filters: dict = None):
    """Получить все записи аренды для компании с данными листинга и фильтрацией"""
    from app.parsers.models import Listing
    from app.favorites.service import apply_listing_filters
    
    offset = (page - 1) * page_size
    filters = filters or {}
    
    # Получить ID арендованных листингов
    rent_listing_ids = db.query(RentListing.listing_id).filter(
        RentListing.company_id == company_id
    ).all()
    listing_ids = [rl.listing_id for rl in rent_listing_ids]
    
    if not listing_ids:
        return {
            "rent_listings": [],
            "total": 0,
            "page": page,
            "page_size": page_size,
            "total_pages": 0,
            "stats": {"max_price": None, "max_meters": None},
            "filters": filters
        }
    
    # Применить фильтры к арендованным листингам (без фильтров по цене)
    filters_without_price = {k: v for k, v in filters.items() if k not in ['min_price', 'max_price']}
    query = db.query(Listing).filter(Listing.id.in_(listing_ids))
    query = apply_listing_filters(query, db=db, company_id=company_id, **filters_without_price)
    
    # Получить все отфильтрованные листинги
    all_filtered_listings = query.all()
    filtered_listing_ids = [l.id for l in all_filtered_listings]
    
    # Получить данные аренды и применить фильтр по rent_price
    rent_query = db.query(RentListing).filter(
        RentListing.listing_id.in_(filtered_listing_ids),
        RentListing.company_id == company_id
    )
    
    if filters.get('min_price') is not None:
        rent_query = rent_query.filter(RentListing.rent_price >= filters['min_price'])
    
    if filters.get('max_price') is not None:
        rent_query = rent_query.filter(RentListing.rent_price <= filters['max_price'])
    
    total = rent_query.count()
    rent_data = rent_query.offset(offset).limit(page_size).all()
    
    # Получить листинги для отображения
    final_listing_ids = [r.listing_id for r in rent_data]
    listings = db.query(Listing).filter(Listing.id.in_(final_listing_ids)).all()
    listings_map = {l.id: l for l in listings}
    rent_map = {r.listing_id: r for r in rent_data}

    
    # Объединить данные
    result = []
    for listing in listings:
        rent_listing = rent_map.get(listing.id)
        if rent_listing:
            result.append({
                "rent_id": rent_listing.id,
                "listing_id": listing.id,
                "tenant_first_name": rent_listing.tenant_first_name,
                "tenant_last_name": rent_listing.tenant_last_name,
                "tenant_phone": rent_listing.tenant_phone,
                "rent_price": rent_listing.rent_price,
                "rent_start_date": rent_listing.rent_start_date,
                "rent_end_date": rent_listing.rent_end_date,
                "responsible_user_id": rent_listing.responsible_user_id,
                "address": listing.location,
                "area": listing.total_meters,
                "rooms": listing.rooms_count,
                "floor": listing.floor,
                "price": listing.price,
                "source": listing.source,
                "url": listing.url,
            })
    
    total_pages = (total + page_size - 1) // page_size
    
    # Статистика по всем арендованным листингам (без фильтров)
    max_price_rent = db.query(RentListing).filter(
        RentListing.company_id == company_id,
        RentListing.rent_price.isnot(None)
    ).order_by(RentListing.rent_price.desc()).first()
    
    max_meters_listing = db.query(Listing).filter(
        Listing.id.in_(listing_ids),
        Listing.total_meters.isnot(None)
    ).order_by(Listing.total_meters.desc()).first()
    
    # Округлить максимальные значения
    max_price = max_price_rent.rent_price if max_price_rent else None
    rounded_max_price = round_up_price(max_price) if max_price else None
    
    max_meters = max_meters_listing.total_meters if max_meters_listing else None
    rounded_max_meters = round_up_meters(max_meters) if max_meters else None
    
    stats = {
        "max_price": rounded_max_price,
        "max_meters": rounded_max_meters
    }
    
    return {
        "rent_listings": result,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "stats": stats,
        "filters": filters
    }
