import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Date, Index
from datetime import datetime, date
from app.db import Base
from pydantic import BaseModel
from typing import Optional

class RentListing(Base):
    """Данные аренды для листинга"""
    __tablename__ = "rent_listings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    listing_id = Column(String, ForeignKey("listings.id"), nullable=False, index=True)
    company_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    
    # Данные съемщика
    tenant_first_name = Column(String, nullable=False)
    tenant_last_name = Column(String, nullable=False)
    tenant_phone = Column(String, nullable=False)
    
    # Данные аренды
    rent_price = Column(Integer, nullable=False)
    rent_start_date = Column(Date, nullable=False)
    rent_end_date = Column(Date, nullable=False)
    responsible_user_id = Column(String, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index('idx_rent_listing_company', 'listing_id', 'company_id'),
    )

class RentListingCreate(BaseModel):
    listing_id: str
    tenant_first_name: str
    tenant_last_name: str
    tenant_phone: str
    rent_price: int
    rent_start_date: date
    rent_end_date: date
    responsible_user_id: Optional[str] = None

class RentListingUpdate(BaseModel):
    tenant_first_name: Optional[str] = None
    tenant_last_name: Optional[str] = None
    tenant_phone: Optional[str] = None
    rent_price: Optional[int] = None
    rent_start_date: Optional[date] = None
    rent_end_date: Optional[date] = None
    responsible_user_id: Optional[str] = None

class RentListingResponse(BaseModel):
    id: str
    listing_id: str
    company_id: str
    tenant_first_name: str
    tenant_last_name: str
    tenant_phone: str
    rent_price: int
    rent_start_date: date
    rent_end_date: date
    responsible_user_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
