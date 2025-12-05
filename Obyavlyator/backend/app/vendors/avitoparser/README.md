# Avito Parser

Парсер объявлений с Avito.ru с нормализованной архитектурой, аналогичной CianParser.

## Структура проекта

```
avitoparser/
├── __init__.py                 # Экспорт главного класса
├── avitoparser.py              # Главный класс AvitoParser
├── base_list.py                # Базовый класс для парсинга списков
├── constants.py                # Константы
├── config.py                   # Конфигурация (dataclasses)
├── helpers.py                  # Вспомогательные функции
├── url_builder.py              # Построение и парсинг URL
├── proxy_pool.py               # Управление прокси
├── cookies_manager.py          # Управление cookies
├── models.py                   # Pydantic модели
├── db_service.py               # Работа с БД
├── parser_cls.py               # Оригинальный парсер (legacy)
└── realty/                     # Парсинг недвижимости
    ├── __init__.py
    ├── list.py                 # Парсинг списков объявлений
    └── page.py                 # Парсинг отдельных страниц
```

## Использование

### Базовый пример

```python
from app.vendors.avitoparser import AvitoParser

# Создание парсера
parser = AvitoParser(
    location="moskva",
    category="kvartiry",
    proxies=None,
    headless=True
)

# Получение объявлений о продаже
results = parser.get_realty(
    deal_type="sale",
    with_saving_csv=False,
    with_extra_data=False
)

# Обработка результатов
for item in results:
    print(f"{item.title} - {item.priceDetailed.value} ₽")

# Закрытие парсера
parser.close()
```

### С дополнительными настройками

```python
from app.vendors.avitoparser import AvitoParser

parser = AvitoParser(
    location="moskva",
    category="kvartiry",
    proxies="login:password@proxy.site:port",
    proxy_change_url="https://changeip.proxy.site/?key=xxx"
)

# Дополнительные настройки
additional_settings = {
    "min_price": 1000000,
    "max_price": 5000000,
    "start_page": 1,
    "end_page": 10
}

results = parser.get_realty(
    deal_type="sale",
    with_saving_csv=True,
    with_extra_data=True,
    additional_settings=additional_settings
)
```

### Получение списка локаций и категорий

```python
from app.vendors.avitoparser import get_locations, get_categories

# Доступные локации
locations = get_locations()
print(locations)
# ['moskva', 'sankt-peterburg', 'novosibirsk', ...]

# Доступные категории
categories = get_categories()
print(categories)
# ['kvartiry', 'komnaty', 'doma_dachi_kottedzhi', ...]
```

## Архитектура

### Основные компоненты

1. **AvitoParser** - Главный класс парсера
   - Управляет сессией и запросами
   - Координирует работу подпарсеров
   - Обрабатывает прокси и cookies

2. **RealtyListPageParser** - Парсер списков объявлений
   - Извлекает JSON данные со страницы
   - Парсит объявления
   - Управляет пагинацией

3. **RealtyPageParser** - Парсер отдельных страниц
   - Извлекает дополнительные данные
   - Парсит просмотры, продавца, изображения

4. **ProxyPool** - Управление прокси
   - Ротация IP
   - Обработка ошибок прокси

5. **CookiesManager** - Управление cookies
   - Сохранение/загрузка cookies
   - Обновление сессии

6. **URLBuilder** - Построение URL
   - Парсинг URL
   - Добавление параметров
   - Пагинация

## Отличия от CianParser

1. **Модели данных**: Использует Pydantic модели вместо словарей
2. **HTTP клиент**: Использует curl_cffi вместо Selenium
3. **JSON парсинг**: Извлекает данные из JSON на странице
4. **Структура**: Один модуль `realty` вместо `flat`, `suburban`, `newobject`

## Миграция с parser_cls.py

Старый код:
```python
from parser_cls import AvitoParse
from dto import AvitoConfig

config = AvitoConfig(
    urls=["https://www.avito.ru/moskva/kvartiry/prodam"],
    max_price=5000000
)

parser = AvitoParse(config)
parser.parse()
```

Новый код:
```python
from app.vendors.avitoparser import AvitoParser

parser = AvitoParser(
    location="moskva",
    category="kvartiry"
)

results = parser.get_realty(
    deal_type="sale",
    additional_settings={"max_price": 5000000}
)
```

## Зависимости

- `pydantic` - Валидация данных
- `curl_cffi` - HTTP запросы
- `loguru` - Логирование
- `beautifulsoup4` - Парсинг HTML

## Лицензия

MIT
