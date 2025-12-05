from typing import List, Dict

class BaseParser:
    """Базовый интерфейс для всех парсеров"""

    def fetch_listings(self) -> List[Dict]:
        """
        Должен вернуть список объявлений:
        [
          {"deal_type": "rent_long", "price": 50000, "total_meters": 45, "floor": "3/5", "location": "Москва, ул. Ленина", "source": "cian"}
        ]
        """
        raise NotImplementedError
