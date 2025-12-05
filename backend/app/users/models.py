from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    is_verified = Column(Boolean, default=False)
    pending_email = Column(String, nullable=True)
    pending_email_token = Column(String, nullable=True)
    
    # Employee fields
    role = Column(String, default="admin", nullable=False)  # "admin" or "employee"
    position = Column(String, nullable=True)
    created_by = Column(UUID(as_uuid=True), nullable=True)  # Кто создал этого пользователя
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_seen = Column(DateTime, nullable=True)
