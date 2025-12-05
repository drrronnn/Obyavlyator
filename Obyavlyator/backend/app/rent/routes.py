from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.auth.utils import get_current_user
from app.listings.service import get_company_id
from app.users.models import User
from app.rent.models import RentListingCreate, RentListingUpdate, RentListingResponse
from app.rent.service import (
    create_rent_listing,
    get_rent_listing,
    update_rent_listing,
    delete_rent_listing,
    get_all_rent_listings
)

router = APIRouter(prefix="/rent", tags=["rent"])

@router.post("", response_model=RentListingResponse)
def add_to_rent(
    data: RentListingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Добавить листинг в аренду"""
    company_id = get_company_id(current_user)
    rent_listing = create_rent_listing(db, data, company_id)
    return rent_listing

@router.get("/{listing_id}", response_model=RentListingResponse)
def get_rent_info(
    listing_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить информацию об аренде"""
    company_id = get_company_id(current_user)
    rent_listing = get_rent_listing(db, listing_id, company_id)
    if not rent_listing:
        raise HTTPException(status_code=404, detail="Rent listing not found")
    return rent_listing

@router.patch("/{listing_id}", response_model=RentListingResponse)
def update_rent_info(
    listing_id: str,
    data: RentListingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить информацию об аренде"""
    company_id = get_company_id(current_user)
    rent_listing = update_rent_listing(db, listing_id, company_id, data)
    if not rent_listing:
        raise HTTPException(status_code=404, detail="Rent listing not found")
    return rent_listing

@router.delete("/{listing_id}")
def remove_from_rent(
    listing_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удалить листинг из аренды"""
    company_id = get_company_id(current_user)
    success = delete_rent_listing(db, listing_id, company_id)
    if not success:
        raise HTTPException(status_code=404, detail="Rent listing not found")
    return {"message": "Rent listing deleted successfully"}

@router.get("")
def list_rent_listings(
    page: int = 1,
    page_size: int = 20,
    search: str = None,
    deal_type: str = None,
    source: str = None,
    rooms_count: str = None,
    min_price: float = None,
    max_price: float = None,
    min_meters: float = None,
    max_meters: float = None,
    status: str = None,
    responsible: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить список всех арендованных листингов с фильтрацией"""
    company_id = get_company_id(current_user)
    filters = {
        "search": search,
        "deal_type": deal_type,
        "source": source,
        "rooms_count": rooms_count,
        "min_price": min_price,
        "max_price": max_price,
        "min_meters": min_meters,
        "max_meters": max_meters,
        "status": status,
        "responsible": responsible
    }
    return get_all_rent_listings(db, company_id, page, page_size, filters)
