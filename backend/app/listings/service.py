from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.listings.models import ListingMetadata, ListingHistory
from app.users.models import User
from datetime import datetime
from typing import Optional, AsyncGenerator
import zipfile
import httpx
import json
import logging

logger = logging.getLogger(__name__)

def get_company_id(user: User) -> str:
    """Получить ID компании (админа группы)"""
    return str(user.created_by) if user.created_by else str(user.id)

def get_or_create_metadata(db: Session, listing_id: str, company_id: str) -> ListingMetadata:
    """Получить или создать метаданные для объявления"""
    metadata = db.query(ListingMetadata).filter(
        ListingMetadata.listing_id == listing_id,
        ListingMetadata.company_id == company_id
    ).first()
    
    if not metadata:
        metadata = ListingMetadata(
            listing_id=listing_id,
            company_id=company_id,
            status="new"
        )
        db.add(metadata)
        db.commit()
        db.refresh(metadata)
    
    return metadata

def update_metadata(
    db: Session, 
    listing_id: str, 
    company_id: str, 
    user_id: str, 
    responsible_user_id: Optional[str] = None,
    status: Optional[str] = None
) -> ListingMetadata:
    """Обновить метаданные объявления"""
    metadata = get_or_create_metadata(db, listing_id, company_id)
    
    # Сохраняем историю
    if responsible_user_id is not None and metadata.responsible_user_id != responsible_user_id:
        history = ListingHistory(
            listing_id=listing_id,
            company_id=company_id,
            user_id=user_id,
            action="assigned",
            old_value=metadata.responsible_user_id,
            new_value=responsible_user_id
        )
        db.add(history)
        metadata.responsible_user_id = responsible_user_id
    
    if status is not None and metadata.status != status:
        history = ListingHistory(
            listing_id=listing_id,
            company_id=company_id,
            user_id=user_id,
            action="status_changed",
            old_value=metadata.status,
            new_value=status
        )
        db.add(history)
        metadata.status = status
    
    metadata.updated_by = user_id
    metadata.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(metadata)
    
    return metadata

def get_metadata_for_listings(db: Session, listing_ids: list[str], company_id: str) -> dict:
    """Получить метаданные для списка объявлений"""
    metadatas = db.query(ListingMetadata).filter(
        ListingMetadata.listing_id.in_(listing_ids),
        ListingMetadata.company_id == company_id
    ).all()
    
    return {m.listing_id: m for m in metadatas}

async def generate_photos_zip(images: list[str], listing_id: str) -> AsyncGenerator[bytes, None]:
    """Генератор для потоковой отправки ZIP с фотографиями"""
    class ZipStream:
        def __init__(self):
            self.buffer = bytearray()
        
        def write(self, data):
            self.buffer.extend(data)
            return len(data)
        
        def flush(self):
            pass
    
    stream = ZipStream()
    
    with zipfile.ZipFile(stream, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        async with httpx.AsyncClient(timeout=30.0, limits=httpx.Limits(max_connections=5)) as client:
            for idx, image_url in enumerate(images[:20], 1):
                try:
                    response = await client.get(image_url)
                    if response.status_code == 200:
                        ext = image_url.split('.')[-1].split('?')[0][:4] or 'jpg'
                        zip_file.writestr(f"photo_{idx}.{ext}", response.content)
                        
                        if len(stream.buffer) >= 1024 * 1024:
                            yield bytes(stream.buffer)
                            stream.buffer.clear()
                except Exception as e:
                    logger.error(f"Failed to download image {idx}: {e}")
                    continue
    
    if stream.buffer:
        yield bytes(stream.buffer)

def get_listing_images(db: Session, listing_id: str) -> list[str]:
    """Получить список URL фотографий объявления"""
    from app.parsers.models import Listing
    
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing or not listing.images:
        return []
    
    try:
        return json.loads(listing.images) if isinstance(listing.images, str) else listing.images
    except:
        return []

def delete_listing_metadata(db: Session, listing_id: str, company_id: str, user_id: str) -> bool:
    """Удалить листинг полностью"""
    from app.parsers.models import Listing
    from app.rent.models import RentListing
    
    # Удаляем метаданные
    db.query(ListingMetadata).filter(
        ListingMetadata.listing_id == listing_id,
        ListingMetadata.company_id == company_id
    ).delete()
    
    # Удаляем историю
    db.query(ListingHistory).filter(
        ListingHistory.listing_id == listing_id,
        ListingHistory.company_id == company_id
    ).delete()
    
    # Удаляем из аренды
    db.query(RentListing).filter(
        RentListing.listing_id == listing_id,
        RentListing.company_id == company_id
    ).delete()
    
    # Удаляем само объявление
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if listing:
        db.delete(listing)
    
    db.commit()
    return True
