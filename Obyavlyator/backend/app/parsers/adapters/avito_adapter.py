from typing import List, Dict
import json
from datetime import datetime, timedelta
import app.vendors.avitoparser as avitoparser
from app.parsers.base import BaseParser
from app.core.config import settings


class AvitoAdapter(BaseParser):
    """Адаптер для парсера Avito"""
    
    def __init__(self, location: str = "moskva"):
        """
        Инициализация адаптера
        
        Args:
            location: Локация для парсинга (по умолчанию Москва)
        """
        # Получаем настройки прокси из .env
        proxies = getattr(settings, 'AVITO_PROXY', None)
        proxy_change_url = getattr(settings, 'AVITO_PROXY_CHANGE_URL', None)
        
        self.parser = avitoparser.AvitoParser(
            location=location,
            category="kvartiry",
            proxies=proxies,
            proxy_change_url=proxy_change_url,
            headless=settings.PARSER_HEADLESS if hasattr(settings, 'PARSER_HEADLESS') else True
        )
    
    def close_browser(self):
        """Закрывает сессию парсера"""
        if hasattr(self.parser, 'close'):
            try:
                self.parser.close()
            except Exception as e:
                print(f"Ошибка при закрытии парсера: {e}")
    
    def parse_extra_data_for_listings(self, listings: List[Dict]) -> List[Dict]:
        """
        Получает дополнительные данные для новых найденных объявлений
        перед сохранением в БД
        
        Args:
            listings: Список объявлений с базовыми данными
            
        Returns:
            Список объявлений с дополнительными данными
        """
        enhanced_listings = []
        
        for listing in listings:
            # Получаем URL из исходных данных
            url = listing.get('url')
            if not url:
                enhanced_listings.append(listing)
                continue
            
            try:
                # Создаем парсер страницы
                from app.vendors.avitoparser.realty.page import RealtyPageParser
                
                page_parser = RealtyPageParser(
                    driver=self.parser,
                    url=url
                )
                
                # Получаем дополнительные данные
                extra_data = page_parser.parse_page()
                
                # Обновляем listing
                enhanced_listing = listing.copy()
                
                # Добавляем телефон
                phone = extra_data.get('seller_name', '')
                enhanced_listing['phone_number'] = None if not phone else phone
                
                # Добавляем картинки
                images = extra_data.get('images', [])
                enhanced_listing['images'] = json.dumps(images) if images else None
                
                enhanced_listings.append(enhanced_listing)
                
            except Exception as e:
                print(f"Ошибка при получении дополнительных данных для {url}: {e}")
                # В случае ошибки добавляем исходное объявление
                enhanced_listings.append(listing)
        
        return enhanced_listings
    
    def fetch_basic_listings(self) -> List[Dict]:
        """
        Получает базовые данные объявлений БЕЗ дополнительной информации со страниц
        Парсит как продажу, так и аренду
        Фильтрует только новые объявления (младше 24 часов)
        
        Returns:
            Список объявлений с базовыми данными
        """
        all_listings = []
        
        # Настройки парсинга
        max_pages = getattr(settings, 'PARSER_MAX_PAGES', 3)
        
        # Парсим продажу
        print("Парсинг объявлений о продаже...")
        sale_data = self.parser.get_realty(
            deal_type="sale",
            with_saving_csv=False,
            with_extra_data=False,
            additional_settings={
                "start_page": 1,
                "end_page": max_pages
            }
        )
        print(f"Найдено объявлений продажи: {len(sale_data)}")
        
        # Парсим аренду
        print("Парсинг объявлений об аренде...")
        rent_data = self.parser.get_realty(
            deal_type="rent",
            with_saving_csv=False,
            with_extra_data=False,
            additional_settings={
                "start_page": 1,
                "end_page": max_pages
            }
        )
        print(f"Найдено объявлений аренды: {len(rent_data)}")
        
        # Фильтруем по времени (только за последние 24 часа)
        cutoff_time = datetime.now().timestamp() * 1000 - (24 * 3600 * 1000)
        
        # Обрабатываем продажу
        for item in sale_data:
            # Проверяем время публикации (только за последние 24 часа)
            if item.sortTimeStamp and item.sortTimeStamp < cutoff_time:
                continue
            
            # Парсим характеристики из title и description
            from app.vendors.avitoparser.helpers import parse_characteristics_from_text
            
            title = item.title or ""
            description = item.description or ""
            characteristics = parse_characteristics_from_text(title, description)
            
            # Пропускаем если нет площади (обязательное поле)
            if not characteristics['total_meters']:
                print(f"Пропущено объявление без площади: {title}")
                continue
            
            # Формируем адрес - используем только formattedAddress
            location_str = "Москва"  # Default
            if item.geo and item.geo.formattedAddress:
                location_str = item.geo.formattedAddress
            
            # Извлекаем изображения (берем самое большое разрешение)
            images = []
            if item.images:
                for img in item.images:
                    # Image это RootModel, нужно использовать .root для доступа к dict
                    img_dict = img.root if hasattr(img, 'root') else img
                    # Приоритет: 864x864 > 636x636 > 472x472
                    img_url = img_dict.get("864x864") or img_dict.get("636x636") or img_dict.get("472x472")
                    if img_url:
                        images.append(str(img_url))
            
            # Определение типа сделки по постфиксу цены
            deal_type = "sale"
            if item.priceDetailed and item.priceDetailed.postfix == "в месяц":
                deal_type = "rent"

            all_listings.append({
                "deal_type": deal_type,
                "price": item.priceDetailed.value if item.priceDetailed else 0,
                "total_meters": characteristics['total_meters'],
                "floor": characteristics['floor'],
                "location": location_str,
                "source": "avito",
                "url": f"https://www.avito.ru{item.urlPath}" if item.urlPath else "",
                "rooms_count": characteristics['rooms_count'],
                "home_type": characteristics['home_type'],
                "images": json.dumps(images) if images else None
            })
        
        # Обрабатываем аренду
        for item in rent_data:
            # Проверяем время публикации (только за последние 24 часа)
            if item.sortTimeStamp and item.sortTimeStamp < cutoff_time:
                continue
            
            # Парсим характеристики
            from app.vendors.avitoparser.helpers import parse_characteristics_from_text
            
            title = item.title or ""
            description = item.description or ""
            characteristics = parse_characteristics_from_text(title, description)
            
            # Пропускаем если нет площади
            if not characteristics['total_meters']:
                print(f"Пропущено объявление без площади: {title}")
                continue
            
            # Формируем адрес - используем только formattedAddress
            location_str = "Москва"  # Default
            if item.geo and item.geo.formattedAddress:
                location_str = item.geo.formattedAddress
            
            # Извлекаем изображения (берем самое большое разрешение)
            images = []
            if item.images:
                for img in item.images:
                    # Image это RootModel, нужно использовать .root для доступа к dict
                    img_dict = img.root if hasattr(img, 'root') else img
                    # Приоритет: 864x864 > 636x636 > 472x472
                    img_url = img_dict.get("864x864") or img_dict.get("636x636") or img_dict.get("472x472")
                    if img_url:
                        images.append(str(img_url))
            
            # Определение типа сделки по постфиксу цены
            deal_type = "sale"
            if item.priceDetailed and item.priceDetailed.postfix == "в месяц":
                deal_type = "rent"

            all_listings.append({
                "deal_type": deal_type,
                "price": item.priceDetailed.value if item.priceDetailed else 0,
                "total_meters": characteristics['total_meters'],
                "floor": characteristics['floor'],
                "location": location_str,
                "source": "avito",
                "url": f"https://www.avito.ru{item.urlPath}" if item.urlPath else "",
                "rooms_count": characteristics['rooms_count'],
                "home_type": characteristics['home_type'],
                "images": json.dumps(images) if images else None
            })
        
        print(f"Создано {len(all_listings)} объявлений для проверки новизны")
        return all_listings
    
    def fetch_listings(self) -> List[Dict]:
        """
        УСТАРЕВШИЙ МЕТОД: Получает все объявления с дополнительными данными
        Используйте fetch_basic_listings() + parse_extra_data_for_listings() для оптимизации
        
        Returns:
            Список объявлений с дополнительными данными
        """
        # Получаем базовые данные
        listings = self.fetch_basic_listings()
        
        # Получаем дополнительные данные для всех объявлений
        enhanced_listings = self.parse_extra_data_for_listings(listings)
        
        print(f"Обработано {len(enhanced_listings)} объявлений с дополнительными данными")
        
        return enhanced_listings
