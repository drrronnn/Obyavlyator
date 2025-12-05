import uuid
from sqlalchemy import Column, String, DateTime, Float, Boolean, Text
from datetime import datetime
from app.db import Base
from pydantic import BaseModel, field_validator
from typing import Optional, List as PyList
import json

class Listing(Base):
    __tablename__ = "listings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    deal_type = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    total_meters = Column(Float, nullable=False)
    floor = Column(String, nullable=True)
    location = Column(String, nullable=False)
    source = Column(String, nullable=False)
    url = Column(String, nullable=False)
    phone_number = Column(String, nullable=True)
    rooms_count = Column(Float, nullable=True)
    home_type = Column(String, nullable=True)
    is_favorite = Column(Boolean, default=False, nullable=False)
    images = Column(Text, nullable=True)  # JSON строка с массивом URL картинок
    
    # # Дополнительные поля из детальной страницы
    # year_of_construction = Column(Integer, nullable=True)
    # floor_number = Column(Integer, nullable=True)
    # floors_count = Column(Integer, nullable=True)
    # living_meters = Column(Float, nullable=True)
    # kitchen_meters = Column(Float, nullable=True)

class ListingResponse(BaseModel):
    id: str
    created_at: datetime
    deal_type: str
    price: float
    total_meters: float
    floor: Optional[str]
    location: str
    source: str
    url: str
    phone_number: Optional[str]
    rooms_count: Optional[float]
    home_type: Optional[str]
    is_favorite: bool = False
    images: Optional[PyList[str]] = None
    responsible: Optional[str] = None
    status: str = "new"
    is_in_rent: bool = False
    
    @field_validator('images', mode='before')
    @classmethod
    def parse_images(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except:
                return []
        return v or []
    
    class Config:
        from_attributes = True

class ListingFilters(BaseModel):
    deal_type: Optional[str] = None
    source: Optional[str] = None
    rooms_count: Optional[PyList[str]] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_meters: Optional[float] = None
    max_meters: Optional[float] = None
    search: Optional[str] = None

class ListingStats(BaseModel):
    max_price: Optional[float]
    max_meters: Optional[float]

class PaginatedListingsResponse(BaseModel):
    items: list[ListingResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
    filters: ListingFilters
    stats: ListingStats