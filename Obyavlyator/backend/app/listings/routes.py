from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db import get_db
from app.users.models import User
from app.auth.utils import get_current_user
from app.listings.models import ListingMetadataUpdate, ListingMetadataResponse
from app.listings.service import (
    get_company_id,
    update_metadata,
    generate_photos_zip,
    get_listing_images,
    delete_listing_metadata,
)
from app.core.responses import success_response, error_response, ErrorCode
import logging

router = APIRouter(prefix="/listings", tags=["Listings"])
logger = logging.getLogger(__name__)


@router.patch("/{listing_id}/metadata", response_model=ListingMetadataResponse)
async def update_listing_metadata(
    listing_id: str,
    data: ListingMetadataUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Обновить метаданные объявления (ответственный, статус)"""
    company_id = get_company_id(current_user)

    metadata = update_metadata(
        db,
        listing_id,
        company_id,
        str(current_user.id),
        responsible_user_id=data.responsible_user_id,
        status=data.status,
    )

    logger.info(
        f"Metadata updated for listing {listing_id} by user {current_user.email}"
    )

    # TODO: Broadcast через WebSocket

    return metadata


@router.get("/{listing_id}/photos")
async def download_listing_photos(
    listing_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Скачать фотографии объявления в ZIP архиве (макс 20 фото)"""
    images = get_listing_images(db, listing_id)

    if not images:
        raise HTTPException(status_code=404, detail="No photos found")

    return StreamingResponse(
        generate_photos_zip(images, listing_id),
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename=listing_{listing_id}_photos.zip"
        },
    )


@router.delete("/{listing_id}/metadata")
async def delete_listing(
    listing_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Удалить объявление полностью"""
    if current_user.role != "admin":
        return error_response(403, ErrorCode.ACCESS_DENIED)

    company_id = get_company_id(current_user)
    delete_listing_metadata(db, listing_id, company_id, str(current_user.id))

    logger.info(f"Listing {listing_id} deleted by user {current_user.id}")
    return success_response({"message": "Listing deleted successfully"})
