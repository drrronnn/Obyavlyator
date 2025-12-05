import json
import asyncio
import redis.asyncio as aioredis
from typing import List
from fastapi import WebSocket
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: dict[str, WebSocket] = {} # user_id -> websocket
        self.redis_listener_task = None
        
    async def start_redis_listener(self):
        """Подписка на Redis канал для событий парсера и статусов"""
        try:
            redis = await aioredis.from_url(settings.REDIS_URL)
            pubsub = redis.pubsub()
            await pubsub.subscribe("parser_events", "user_status_events")
            
            logger.info("✅ Redis listener запущен")
            
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data = message["data"].decode()
                    await self.broadcast(json.loads(data))
        except Exception as e:
            logger.error(f"Ошибка Redis listener: {e}")
    
    async def broadcast(self, message: dict):
        """Отправить сообщение всем подключенным клиентам"""
        if not self.active_connections:
            return
        
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Ошибка отправки WebSocket: {e}")
                disconnected.append(connection)
        
        for connection in disconnected:
            await self.disconnect(connection)

    async def connect(self, websocket: WebSocket, user_id: str = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        
        if user_id:
            self.user_connections[user_id] = websocket
            await self.set_user_online(user_id)
            
        logger.info(f"WebSocket подключен. Активных: {len(self.active_connections)}")
        
        # Запускаем Redis listener при первом подключении
        if len(self.active_connections) == 1 and not self.redis_listener_task:
            self.redis_listener_task = asyncio.create_task(self.start_redis_listener())

        # Отправить список всех онлайн пользователей новому подключению
        try:
            redis = await aioredis.from_url(settings.REDIS_URL)
            keys = await redis.keys("user:online:*")
            online_users = [key.decode().split(":")[-1] for key in keys]
            
            if online_users:
                await websocket.send_json({
                    "type": "online_users_list",
                    "user_ids": online_users
                })
        except Exception as e:
            logger.error(f"Error sending online users list: {e}")

    async def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            
        # Найти user_id по websocket
        user_id_to_remove = None
        for uid, ws in self.user_connections.items():
            if ws == websocket:
                user_id_to_remove = uid
                break
        
        if user_id_to_remove:
            del self.user_connections[user_id_to_remove]
            await self.set_user_offline(user_id_to_remove)
            
        logger.info(f"WebSocket отключен. Активных: {len(self.active_connections)}")

    async def set_user_online(self, user_id: str):
        """Установить статус онлайн в Redis и оповестить всех"""
        try:
            redis = await aioredis.from_url(settings.REDIS_URL)
            # Устанавливаем ключ с TTL 60 секунд
            await redis.set(f"user:online:{user_id}", "online", ex=60)
            
            # Оповещаем всех
            await self.broadcast({
                "type": "user_status",
                "user_id": user_id,
                "status": "online"
            })
        except Exception as e:
            logger.error(f"Error setting user online: {e}")

    async def set_user_offline(self, user_id: str):
        """Установить статус оффлайн и обновить last_seen в БД"""
        try:
            redis = await aioredis.from_url(settings.REDIS_URL)
            await redis.delete(f"user:online:{user_id}")
            
            # Обновить last_seen в БД
            from app.db import SessionLocal
            from app.users.models import User
            from datetime import datetime
            from uuid import UUID
            
            db = SessionLocal()
            try:
                db.query(User).filter(User.id == UUID(user_id)).update({"last_seen": datetime.utcnow()})
                db.commit()
            finally:
                db.close()

            # Оповещаем всех
            await self.broadcast({
                "type": "user_status",
                "user_id": user_id,
                "status": "offline",
                "last_seen": datetime.utcnow().isoformat()
            })
        except Exception as e:
            logger.error(f"Error setting user offline: {e}")

    async def handle_ping(self, user_id: str):
        """Обновить TTL для пользователя"""
        try:
            redis = await aioredis.from_url(settings.REDIS_URL)
            await redis.expire(f"user:online:{user_id}", 60)
        except Exception as e:
            logger.error(f"Error handling ping: {e}")

    async def send_new_listings(self, listings):
        message = {
            "type": "new_listings",
            "data": [
                {
                    "id": str(listing.id),
                    "created_at": listing.created_at.isoformat(),
                    "deal_type": listing.deal_type,
                    "price": listing.price,
                    "total_meters": listing.total_meters,
                    "floor": listing.floor,
                    "location": listing.location,
                    "source": listing.source,
                    "url": listing.url,
                    "phone_number": listing.phone_number,
                    "rooms_count": listing.rooms_count,
                    "images": json.loads(listing.images) if listing.images else []
                }
                for listing in listings
            ]
        }
        await self.broadcast(message)

websocket_manager = WebSocketManager()
