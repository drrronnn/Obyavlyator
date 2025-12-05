from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .models import Listing
from app.parsers.adapters.cian_adapter import CianAdapter
from app.parsers.adapters.avito_adapter import AvitoAdapter
from app.websocket_manager import websocket_manager
from app.services.redis_service import acquire_parser_lock, release_parser_lock, is_parser_locked
import logging
import asyncio

logger = logging.getLogger(__name__)

def run_parsers(db: Session, main_loop=None):
    """Запускает все парсеры и сохраняет новые объявления в БД
    
    Процесс:
    1. Циан парсер => базовые данные
    2. Циан extra data parsing => первые 10 новых объявлений (для теста)
    3. Авито парсер => базовые данные
    4. Авито extra data parsing => все новые объявления
    5. Парсинг завершен
    """
    
    # Проверяем, не запущен ли уже парсер
    if is_parser_locked():
        logger.warning("⚠️ Парсер уже запущен. Пропускаем выполнение.")
        return []
    
    # Захватываем lock (TTL 2 часа)
    if not acquire_parser_lock():
        logger.warning("⚠️ Не удалось захватить lock парсера. Пропускаем выполнение.")
        return []
    
    logger.info("🔒 Parser lock захвачен")
    
    new_listings = []
    cian_parser = None
    avito_parser = None
    
    try:
        # ==================== ЦИАН ПАРСИНГ ====================
        logger.info("=" * 80)
        logger.info("🚀 НАЧАЛО ПАРСИНГА - ЦИАН")
        logger.info("=" * 80)
        
        # Создаем парсер Циан
        logger.info("Создание нового экземпляра CianAdapter")
        cian_parser = CianAdapter()
        
        # Получаем базовые данные БЕЗ дополнительной информации
        logger.info("📥 Получение базовых данных объявлений Циан")
        cian_listings = cian_parser.fetch_basic_listings()
        logger.info(f"✅ Получено {len(cian_listings)} объявлений Циан")
        
        # Фильтруем только новые объявления Циан
        cian_new_listings = []
        for item in cian_listings:
            exists = db.query(Listing).filter(
                Listing.deal_type == item["deal_type"],
                Listing.price == item["price"],
                Listing.total_meters == item["total_meters"],
                Listing.location == item["location"],
                Listing.source == item["source"]
            ).first()
            if not exists:
                cian_new_listings.append(item)
        
        logger.info(f"🆕 Найдено {len(cian_new_listings)} новых объявлений Циан из {len(cian_listings)} общих")
        
        # Получаем дополнительные данные ТОЛЬКО для первых 10 новых объявлений (для теста)
        if cian_new_listings:
            # Ограничиваем до 10 для теста
            cian_to_enhance = cian_new_listings[:10]
            logger.info(f"📞 Получение дополнительных данных для {len(cian_to_enhance)} новых объявлений Циан (первые 10 для теста)")
            cian_enhanced = cian_parser.parse_extra_data_for_listings(cian_to_enhance)
            
            # Сохраняем обогащенные объявления в БД
            for item in cian_enhanced:
                listing = Listing(**item)
                db.add(listing)
                new_listings.append(listing)
            
            logger.info(f"💾 Сохранено {len(cian_enhanced)} объявлений Циан с дополнительными данными")
            
            # Сохраняем остальные новые объявления (если их больше 10) БЕЗ extra data
            if len(cian_new_listings) > 10:
                cian_remaining = cian_new_listings[10:]
                logger.info(f"💾 Сохранение {len(cian_remaining)} остальных объявлений Циан без extra data")
                for item in cian_remaining:
                    # Добавляем пустые поля для консистентности
                    item['phone_number'] = None
                    item['images'] = None
                    listing = Listing(**item)
                    db.add(listing)
                    new_listings.append(listing)
                logger.info(f"✅ Сохранено {len(cian_remaining)} объявлений Циан без extra data")
        else:
            logger.info("ℹ️ Новых объявлений Циан не найдено")
        
        # ==================== АВИТО ПАРСИНГ ====================
        logger.info("=" * 80)
        logger.info("🚀 НАЧАЛО ПАРСИНГА - АВИТО")
        logger.info("=" * 80)
        
        # Создаем парсер Авито
        logger.info("Создание нового экземпляра AvitoAdapter")
        avito_parser = AvitoAdapter(location="moskva")
        
        # Получаем базовые данные БЕЗ дополнительной информации
        logger.info("📥 Получение базовых данных объявлений Авито")
        avito_listings = avito_parser.fetch_basic_listings()
        logger.info(f"✅ Получено {len(avito_listings)} объявлений Авито")
        
        # Фильтруем только новые объявления Авито
        avito_new_listings = []
        for item in avito_listings:
            exists = db.query(Listing).filter(
                Listing.deal_type == item["deal_type"],
                Listing.price == item["price"],
                Listing.total_meters == item["total_meters"],
                Listing.location == item["location"],
                Listing.source == item["source"]
            ).first()
            if not exists:
                avito_new_listings.append(item)
        
        logger.info(f"🆕 Найдено {len(avito_new_listings)} новых объявлений Авито из {len(avito_listings)} общих")
        
        # Получаем дополнительные данные (телефоны) для ВСЕХ новых объявлений Авито
        if avito_new_listings:
            logger.info(f"📞 Получение телефонов для {len(avito_new_listings)} новых объявлений Авито")
            avito_enhanced = avito_parser.parse_extra_data_for_listings(avito_new_listings)
            
            # Сохраняем обогащенные объявления в БД
            for item in avito_enhanced:
                listing = Listing(**item)
                db.add(listing)
                new_listings.append(listing)
            
            logger.info(f"💾 Сохранено {len(avito_enhanced)} объявлений Авито с телефонами")
        else:
            logger.info("ℹ️ Новых объявлений Авито не найдено")
        
        
        # ==================== ЗАВЕРШЕНИЕ ПАРСИНГА ====================
        logger.info("=" * 80)
        logger.info("✅ ПАРСИНГ ЗАВЕРШЕН УСПЕШНО")
        logger.info("=" * 80)
        logger.info(f"📊 Итого новых объявлений: {len(new_listings)}")
        logger.info(f"   - Циан: {len(cian_new_listings)}")
        logger.info(f"   - Авито: {len(avito_new_listings)}")
        
    except Exception as e:
        logger.error(f"❌ Ошибка при работе парсера: {e}", exc_info=True)
        db.rollback()
        raise
    finally:
        # КРИТИЧЕСКИ ВАЖНО: закрываем браузеры после каждого использования
        if cian_parser:
            try:
                logger.info("Закрытие браузера Циан")
                cian_parser.close_browser()
            except Exception as e:
                logger.error(f"Ошибка при закрытии браузера Циан: {e}")
        
        if avito_parser:
            try:
                logger.info("Закрытие браузера Авито")
                avito_parser.close_browser()
            except Exception as e:
                logger.error(f"Ошибка при закрытии браузера Авито: {e}")
        
        # Освобождаем lock
        logger.info("🔓 Освобождение parser lock")
        release_parser_lock()
    
    try:
        db.commit()
        logger.info("💾 Изменения сохранены в БД")
        
        # Отправляем новые объявления через WebSocket
        if new_listings:
            try:
                # Используем run_coroutine_threadsafe для безопасного вызова из другого потока
                if main_loop and not main_loop.is_closed():
                    asyncio.run_coroutine_threadsafe(
                        websocket_manager.send_new_listings(new_listings), 
                        main_loop
                    )
                    logger.info(f"📡 Отправлено {len(new_listings)} новых объявлений через WebSocket")
            except Exception as e:
                logger.error(f"❌ Ошибка отправки WebSocket: {e}")
                
    except Exception as e:
        logger.error(f"❌ Ошибка при сохранении в БД: {e}")
        db.rollback()
        raise

    # Удаляем старые (старше 3 дней), но не те, что в работе, в аренде или в избранном
    try:
        from app.listings.models import ListingMetadata
        from app.rent.models import RentListing
        from app.favorites.models import Favorite
        
        expire_date = datetime.utcnow() - timedelta(days=3)
        
        # Получаем ID листингов, которые НЕ должны быть удалены:
        # 1. Листинги со статусом "in_progress" (в работе)
        protected_by_status_ids = [
            row[0] for row in db.query(ListingMetadata.listing_id).filter(
                ListingMetadata.status == "in_progress"
            ).all()
        ]
        
        # 2. Листинги с назначенным ответственным (НОВОЕ)
        protected_by_responsible_ids = [
            row[0] for row in db.query(ListingMetadata.listing_id).filter(
                ListingMetadata.responsible_user_id.isnot(None)
            ).all()
        ]
        
        # 3. Листинги, которые находятся в аренде (сдается)
        protected_by_rent_ids = [
            row[0] for row in db.query(RentListing.listing_id).all()
        ]
        
        # 4. Листинги, которые находятся в избранном (favorites)
        protected_by_favorites_ids = [
            row[0] for row in db.query(Favorite.listing_id).all()
        ]
        
        # Объединяем все защищенные ID
        protected_ids = set(
            protected_by_status_ids + 
            protected_by_responsible_ids +  # НОВОЕ
            protected_by_rent_ids + 
            protected_by_favorites_ids
        )
        
        # Удаляем только те листинги, которые:
        # - старше 3 дней
        # - НЕ имеют статус "in_progress"
        # - НЕ находятся в аренде
        # - НЕ находятся в избранном
        query = db.query(Listing).filter(Listing.created_at < expire_date)
        
        if protected_ids:
            query = query.filter(~Listing.id.in_(list(protected_ids)))
        
        deleted_count = query.delete(synchronize_session=False)
        
        db.commit()
        if deleted_count > 0:
            logger.info(f"🗑️ Удалено {deleted_count} старых объявлений (старше 3 дней, не в работе, без ответственного, не в аренде, не в избранном)")
    except Exception as e:
        logger.error(f"❌ Ошибка при удалении старых объявлений: {e}")
        db.rollback()

    return new_listings
