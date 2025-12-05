import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Text
from datetime import datetime
from app.db import Base
from pydantic import BaseModel

class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    listing_id = Column(String, ForeignKey("listings.id"), nullable=False)
    user_id = Column(String, nullable=True)
    is_new = Column(Boolean, default=True, nullable=False)
    listing_snapshot = Column(Text, nullable=True)  # JSON снимок данных листинга

class FavoriteRequest(BaseModel):
    listing_id: str

class FavoriteResponse(BaseModel):
    id: str
    created_at: datetime
    listing_id: str
    
    class Config:
        from_attributes = True