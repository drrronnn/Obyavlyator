import logging
from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.db import Base, engine, get_db
from app.core.config import settings
from app.parsers.models import Listing, ListingResponse, PaginatedListingsResponse
from app.favorites.models import Favorite
from app.favorites.service import get_paginated_listings, get_favorite_listings
from app.websocket_manager import websocket_manager
from app.auth.routes import router as auth_router
from app.api.test_protected import router as protected_router
from app.users.employee_routes import router as employee_router
from app.auth.verify_employee import router as verify_employee_router
from app.listings.routes import router as listings_router
from app.rent.routes import router as rent_router
from app.users.stats_routes import router as stats_router
from app.auth.utils import get_current_user
from app.users.models import User

# === Инициализация ===
Base.metadata.create_all(bind=engine)
app = FastAPI()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:8001",
        "http://localhost:5173",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS","PATCH"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
)

app.include_router(auth_router)
app.include_router(protected_router)
app.include_router(employee_router)
app.include_router(verify_employee_router)
app.include_router(listings_router)
app.include_router(rent_router)
app.include_router(stats_router)

@app.on_event("shutdown")
async def on_shutdown():
    logger.info("⏹ Завершение работы приложения")


# === Эндпоинты ===
@app.get("/listings", response_model=PaginatedListingsResponse)
def get_listings(
    page: int = 1,
    deal_type: str = None,
    source: str = None,
    rooms_count: str = None,
    min_price: float = None,
    max_price: float = None,
    min_meters: float = None,
    max_meters: float = None,
    search: str = None,
    status: str = None,
    responsible: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.listings.service import get_company_id, get_metadata_for_listings
    from app.rent.models import RentListing
    
    company_id = get_company_id(current_user)
    filters = {
        'deal_type': deal_type, 'source': source, 'rooms_count': rooms_count,
        'min_price': min_price, 'max_price': max_price,
        'min_meters': min_meters, 'max_meters': max_meters,
        'search': search, 'status': status, 'responsible': responsible,
        'company_id': company_id
    }
    listings, total, total_pages, current_filters, stats = get_paginated_listings(db, page, **filters)
    
    listing_ids = [l.id for l in listings]
    metadata_map = get_metadata_for_listings(db, listing_ids, company_id)
    
    # Проверить какие листинги в аренде
    rent_listings = db.query(RentListing.listing_id).filter(
        RentListing.listing_id.in_(listing_ids),
        RentListing.company_id == company_id
    ).all()
    rent_listing_ids = {rl.listing_id for rl in rent_listings}
    
    # Добавить метаданные к объявлениям
    for listing in listings:
        metadata = metadata_map.get(listing.id)
        listing.responsible = metadata.responsible_user_id if metadata else None
        listing.status = metadata.status if metadata else "new"
        listing.is_in_rent = listing.id in rent_listing_ids
    
    return PaginatedListingsResponse(
        items=listings,
        total=total,
        page=page,
        per_page=10,
        total_pages=total_pages,
        filters=current_filters,
        stats=stats
    )


@app.get("/listings/{listing_id}", response_model=ListingResponse)
def get_listing_by_id(listing_id: str, db: Session = Depends(get_db)):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing


@app.get("/listings/count")
def get_listings_count(db: Session = Depends(get_db)):
    return {"count": db.query(Listing).count()}


@app.get("/parser/status")
def get_parser_status():
    """Получить текущий статус парсера из Redis"""
    import redis
    from app.core.config import settings
    
    try:
        redis_client = redis.from_url(settings.REDIS_URL)
        # Проверяем есть ли ключ с текущим статусом
        status = redis_client.get("parser_status")
        if status:
            status_str = status.decode('utf-8') if isinstance(status, bytes) else status
            return {"status": status_str}
        return {"status": "idle"}
    except Exception as e:
        logger.error(f"Ошибка получения статуса парсера: {e}")
        return {"status": "idle"}


@app.get("/favorites", response_model=PaginatedListingsResponse)
def get_favorites(
    page: int = 1,
    deal_type: str = None,
    source: str = None,
    rooms_count: str = None,
    min_price: float = None,
    max_price: float = None,
    min_meters: float = None,
    max_meters: float = None,
    search: str = None,
    status: str = None,
    responsible: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.listings.service import get_company_id, get_metadata_for_listings
    from app.rent.models import RentListing
    
    company_id = get_company_id(current_user)
    filters = {
        'deal_type': deal_type, 'source': source, 'rooms_count': rooms_count,
        'min_price': min_price, 'max_price': max_price,
        'min_meters': min_meters, 'max_meters': max_meters,
        'search': search, 'status': status, 'responsible': responsible,
        'company_id': company_id
    }
    listings, total, total_pages, current_filters, stats = get_favorite_listings(db, str(current_user.id), page, **filters)
    
    listing_ids = [l.id for l in listings]
    metadata_map = get_metadata_for_listings(db, listing_ids, company_id)
    
    # Проверить какие листинги в аренде
    rent_listings = db.query(RentListing.listing_id).filter(
        RentListing.listing_id.in_(listing_ids),
        RentListing.company_id == company_id
    ).all()
    rent_listing_ids = {rl.listing_id for rl in rent_listings}
    
    # Добавить метаданные к объявлениям
    for listing in listings:
        metadata = metadata_map.get(listing.id)
        listing.responsible = metadata.responsible_user_id if metadata else None
        listing.status = metadata.status if metadata else "new"
        listing.is_in_rent = listing.id in rent_listing_ids
    
    db.query(Favorite).filter(Favorite.user_id == str(current_user.id), Favorite.is_new == True).update({"is_new": False})
    db.commit()
    return PaginatedListingsResponse(
        items=listings,
        total=total,
        page=page,
        per_page=10,
        total_pages=total_pages,
        filters=current_filters,
        stats=stats
    )


# === WebSocket ===
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(None)):
    # Если токен передан, пробуем аутентифицировать
    user_id = None
    if token:
        try:
            from app.auth.utils import verify_token
            from app.users.models import User
            
            payload = verify_token(token)
            email = payload.get("sub")
            
            # Получаем user_id из БД
            # Используем отдельную сессию или существующую dependency
            # Здесь создадим новую для проверки
            db = next(get_db())
            user = db.query(User).filter(User.email == email).first()
            if user:
                user_id = str(user.id)
        except Exception as e:
            logger.error(f"WebSocket auth error: {e}")
            # Не разрываем соединение, просто считаем анонимным, 
            # или можно разорвать если строгая политика. 
            # Пока оставим анонимным если ошибка.
            pass

    await websocket_manager.connect(websocket, user_id)
    logger.info(f"🔌 WebSocket подключен (User: {user_id})")

    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                if user_id:
                    await websocket_manager.handle_ping(user_id)
            else:
                logger.info(f"Получено сообщение: {data}")
    except WebSocketDisconnect:
        logger.info("❎ WebSocket отключен клиентом")
        await websocket_manager.disconnect(websocket)
    finally:
        # Если соединение еще активно (например ошибка внутри loop), отключаем
        if websocket.client_state.value == 1: # CONNECTED
             await websocket_manager.disconnect(websocket)


@app.websocket("/ws/favorites")
async def favorites_websocket(websocket: WebSocket, token: str = Query(...), db: Session = Depends(get_db)):
    await websocket.accept()
    
    # Аутентификация пользователя
    try:
        from app.auth.utils import verify_token
        payload = verify_token(token)
        email = payload.get("sub")
        from app.users.models import User
        user = db.query(User).filter(User.email == email).first()
        if not user:
            await websocket.close(code=1008)
            return
        user_id = str(user.id)
    except Exception as e:
        logger.error(f"Ошибка аутентификации WebSocket: {e}")
        await websocket.close(code=1008)
        return
    
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get('action')
            listing_id = data.get('listing_id')

            if action == 'add':
                existing = db.query(Favorite).filter(
                    Favorite.listing_id == listing_id,
                    Favorite.user_id == user_id
                ).first()
                if not existing:
                    # Получить полные данные листинга для создания snapshot
                    listing = db.query(Listing).filter(Listing.id == listing_id).first()
                    
                    # Создать JSON снимок всех данных листинга
                    snapshot = None
                    if listing:
                        import json
                        snapshot = json.dumps({
                            "deal_type": listing.deal_type,
                            "price": listing.price,
                            "total_meters": listing.total_meters,
                            "floor": listing.floor,
                            "location": listing.location,
                            "source": listing.source,
                            "url": listing.url,
                            "phone_number": listing.phone_number,
                            "rooms_count": listing.rooms_count,
                            "home_type": listing.home_type,
                            "images": listing.images,
                            "created_at": listing.created_at.isoformat() if listing.created_at else None
                        }, ensure_ascii=False)
                    
                    new_favorite = Favorite(
                        listing_id=listing_id, 
                        user_id=user_id,
                        listing_snapshot=snapshot
                    )
                    db.add(new_favorite)
                    db.commit()
                    new_count = db.query(Favorite).filter(
                        Favorite.user_id == user_id,
                        Favorite.is_new == True
                    ).count()
                    await websocket.send_json({"status": "added", "listing_id": listing_id, "new_count": new_count})
                else:
                    await websocket.send_json({"status": "already_exists", "listing_id": listing_id})

            elif action == 'remove':
                favorite = db.query(Favorite).filter(
                    Favorite.listing_id == listing_id,
                    Favorite.user_id == user_id
                ).first()
                if favorite:
                    db.delete(favorite)
                    db.commit()
                    new_count = db.query(Favorite).filter(
                        Favorite.user_id == user_id,
                        Favorite.is_new == True
                    ).count()
                    await websocket.send_json({"status": "removed", "listing_id": listing_id, "new_count": new_count})
                else:
                    await websocket.send_json({"status": "not_found", "listing_id": listing_id})

            elif action == 'list':
                favorites = db.query(Favorite).filter(Favorite.user_id == user_id).all()
                favorite_ids = [f.listing_id for f in favorites]
                await websocket.send_json({"status": "list", "favorites": favorite_ids})

            elif action == 'count_new':
                new_count = db.query(Favorite).filter(
                    Favorite.user_id == user_id,
                    Favorite.is_new == True
                ).count()
                await websocket.send_json({"status": "count_new", "count": new_count})

            elif action == 'mark_viewed':
                db.query(Favorite).filter(
                    Favorite.user_id == user_id,
                    Favorite.is_new == True
                ).update({"is_new": False})
                db.commit()
                await websocket.send_json({"status": "marked_viewed", "new_count": 0})

    except WebSocketDisconnect:
        pass
