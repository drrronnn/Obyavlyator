import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Index
from datetime import datetime
from app.db import Base
from pydantic import BaseModel
from typing import Optional

class ListingMetadata(Base):
    """Метаданные объявления для команды (ответственный, статус)"""
    __tablename__ = "listing_metadata"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    listing_id = Column(String, ForeignKey("listings.id"), nullable=False, index=True)
    company_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    responsible_user_id = Column(String, ForeignKey("users.id"), nullable=True)
    status = Column(String, default="new", nullable=False)
    updated_by = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index('idx_listing_company', 'listing_id', 'company_id'),
    )

class ListingHistory(Base):
    """История изменений объявления"""
    __tablename__ = "listing_history"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    listing_id = Column(String, ForeignKey("listings.id"), nullable=False, index=True)
    company_id = Column(String, ForeignKey("users.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)  # assigned, status_changed, etc
    old_value = Column(String, nullable=True)
    new_value = Column(String, nullable=True)
    comment = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

class ListingMetadataUpdate(BaseModel):
    responsible_user_id: Optional[str] = None
    status: Optional[str] = None

class ListingMetadataResponse(BaseModel):
    id: str
    listing_id: str
    company_id: str
    responsible_user_id: Optional[str]
    status: str
    updated_by: Optional[str]
    updated_at: datetime
    
    class Config:
        from_attributes = True
