"""
Пример использования AvitoParser

Этот файл демонстрирует базовое использование парсера Avito
"""

from app.vendors.avitoparser import AvitoParser, get_locations, get_categories


def example_basic():
    """Базовый пример парсинга"""
    print("=== Базовый пример ===\n")
    
    # Создание парсера
    parser = AvitoParser(
        location="moskva",
        category="kvartiry"
    )
    
    # Парсинг объявлений
    results = parser.get_realty(
        deal_type="sale",
        with_saving_csv=False,
        with_extra_data=False,
        additional_settings={
            "start_page": 1,
            "end_page": 2  # Только 2 страницы для примера
        }
    )
    
    # Вывод результатов
    print(f"Найдено объявлений: {len(results)}\n")
    
    for i, item in enumerate(results[:5], 1):  # Первые 5
        print(f"{i}. {item.title}")
        if item.priceDetailed:
            print(f"   Цена: {item.priceDetailed.value:,} ₽")
        if item.location:
            print(f"   Локация: {item.location.name}")
        print()
    
    # Закрытие парсера
    parser.close()


def example_with_filters():
    """Пример с фильтрами"""
    print("=== Пример с фильтрами ===\n")
    
    parser = AvitoParser(
        location="moskva",
        category="kvartiry"
    )
    
    # Парсинг с фильтрами
    results = parser.get_realty(
        deal_type="sale",
        additional_settings={
            "min_price": 3000000,
            "max_price": 7000000,
            "start_page": 1,
            "end_page": 1
        }
    )
    
    print(f"Найдено объявлений в диапазоне 3-7 млн: {len(results)}\n")
    
    parser.close()


def example_with_csv():
    """Пример с сохранением в CSV"""
    print("=== Пример с сохранением в CSV ===\n")
    
    parser = AvitoParser(
        location="sankt-peterburg",
        category="kvartiry"
    )
    
    # Парсинг с сохранением
    results = parser.get_realty(
        deal_type="rent",
        with_saving_csv=True,
        additional_settings={
            "start_page": 1,
            "end_page": 1
        }
    )
    
    print(f"Найдено объявлений: {len(results)}")
    print("Результаты сохранены в CSV файл\n")
    
    parser.close()


def example_locations_and_categories():
    """Пример получения доступных локаций и категорий"""
    print("=== Доступные локации и категории ===\n")
    
    # Получение локаций
    locations = get_locations()
    print("Доступные локации:")
    for loc in locations:
        print(f"  - {loc}")
    
    print()
    
    # Получение категорий
    categories = get_categories()
    print("Доступные категории:")
    for cat in categories:
        print(f"  - {cat}")
    
    print()


if __name__ == "__main__":
    # Раскомментируйте нужный пример:
    
    # example_basic()
    # example_with_filters()
    # example_with_csv()
    example_locations_and_categories()
