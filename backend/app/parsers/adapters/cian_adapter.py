from typing import List, Dict
import os
import json
import app.vendors.cianparser as cianparser
from app.parsers.base import BaseParser
from app.core.config import settings

class CianAdapter(BaseParser):
    def __init__(self, location: str = "Москва"):
        self.parser = cianparser.CianParser(
            location=location, 
            headless=settings.PARSER_HEADLESS
        )
    
    def close_browser(self):
        """Принудительно закрывает браузер"""
        if hasattr(self.parser, '__driver__') and self.parser.__driver__:
            try:
                self.parser.__driver__.quit()
            except Exception as e:
                print(f"Ошибка при закрытии браузера: {e}")
            finally:
                self.parser.__driver__ = None
        
    def parse_extra_data_for_listings(self, listings: List[Dict]) -> List[Dict]:
        """
        Получает дополнительные данные для новых найденных объявлений
        перед сохранением в БД
        """
        enhanced_listings = []
        
        for listing in listings:
            # Получаем URL из исходных данных парсера
            url = listing.get('url')
            if not url:
                # Если URL отсутствует, добавляем как есть
                enhanced_listings.append(listing)
                continue
                
            try:
                # Получаем дополнительные данные со страницы объявления
                extra_data = self.parser.parse_extra_flat_page(url)
                
                # Обновляем listing дополнительными данными
                enhanced_listing = listing.copy()
                
                # Добавляем телефон
                phone = extra_data.get('phone', '')
                enhanced_listing['phone_number'] = None if phone == '' else phone
                
                # Добавляем картинки
                images = extra_data.get('images', [])
                enhanced_listing['images'] = json.dumps(images) if images else None
                
                
                # Добавляем другие полезные данные
                # year_of_construction = extra_data.get('year_of_construction', -1)
                # enhanced_listing['year_of_construction'] = None if year_of_construction == -1 else year_of_construction
                
                # floor = extra_data.get('floor', -1)
                # enhanced_listing['floor_number'] = None if floor == -1 else floor
                
                # floors_count = extra_data.get('floors_count', -1)
                # enhanced_listing['floors_count'] = None if floors_count == -1 else floors_count
                
                # living_meters = extra_data.get('living_meters', -1)
                # enhanced_listing['living_meters'] = None if living_meters == -1 else living_meters
                
                # kitchen_meters = extra_data.get('kitchen_meters', -1)
                # enhanced_listing['kitchen_meters'] = None if kitchen_meters == -1 else kitchen_meters
                
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
        """
        all_listings = []
        
        # Парсим продажу
        sale_data = self.parser.get_flats(
            deal_type="sale", 
            rooms=[1,2,3,4,5,6,"studio"],
            additional_settings = {
                "start_page": 1,
                "end_page": settings.PARSER_MAX_PAGES,
                "is_by_homeowner": True,
                "published_ago": "hour"
            }
        )
        print(f"Найдено объявлений продажи: {len(sale_data)}")
        
        # Парсим аренду
        rent_data = self.parser.get_flats(
            deal_type="rent_long", 
            rooms=[1,2,3,4,5,6,"studio"],
            additional_settings = {
                "start_page": 1,
                "end_page": settings.PARSER_MAX_PAGES,
                "is_by_homeowner": True,
                "published_ago": "hour"
            }
        )
        print(f"Найдено объявлений аренды: {len(rent_data)}")

        # Обрабатываем продажу
        for item in sale_data:
            all_listings.append({
                "deal_type": "sale",
                "price": item.get("price"),
                "total_meters": item.get("total_meters"),
                "floor": f"{item.get('floor')}/{item.get('floors_count')}",
                "location": f"{item.get('location')}, р-н {item.get('district')}, ул. {item.get('street') or 'неизвестно'}",
                "source": "cian",
                "url": item.get("url"),
                "rooms_count": item.get("rooms_count") if item.get("rooms_count", -1) != -1 else None,
                "home_type": item.get("home_type")
            })
            
        # Обрабатываем аренду
        for item in rent_data:
            all_listings.append({
                "deal_type": "rent",
                "price": item.get("price_per_month", item.get("price")),
                "total_meters": item.get("total_meters"),
                "floor": f"{item.get('floor')}/{item.get('floors_count')}",
                "location": f"{item.get('location')}, р-н {item.get('district')}, ул. {item.get('street') or 'неизвестно'}",
                "source": "cian",
                "url": item.get("url"),
                "rooms_count": item.get("rooms_count") if item.get("rooms_count", -1) != -1 else None,
                "home_type": item.get("home_type")
            })
            
        print(f"Создано {len(all_listings)} объявлений для проверки новизны")
        return all_listings

    def fetch_listings(self) -> List[Dict]:
        """
        УСТАРЕВШИЙ МЕТОД: Получает все объявления с дополнительными данными
        Используйте fetch_basic_listings() + parse_extra_data_for_listings() для оптимизации
        """
        # Получаем базовые данные
        listings = self.fetch_basic_listings()
        
        # Получаем дополнительные данные для всех объявлений
        enhanced_listings = self.parse_extra_data_for_listings(listings)
        
        print(f"Обработано {len(enhanced_listings)} объявлений с дополнительными данными")
        
        return enhanced_listings
