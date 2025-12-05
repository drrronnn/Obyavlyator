# Avito Parser Constants

# Base URL
BASE_URL = "https://www.avito.ru"

# API endpoints
API_SEARCH_ENDPOINT = "/web/1/main/items"

# Default settings
DEFAULT_MAX_RETRIES = 5
DEFAULT_BACKOFF_FACTOR = 1
DEFAULT_TIMEOUT = 30

# Blocking detection
BAD_IP_TITLE = "проблема с ip"
MAX_RETRIES = 3
RETRY_DELAY = 10
RETRY_DELAY_WITHOUT_PROXY = 300

# File name formats
FILE_NAME_FORMAT = "avito_{category}_{deal_type}_{location}_{start_page}_{end_page}_{timestamp}.csv"

# Headers
DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
}

# Deal types
DEAL_TYPE_SALE = "sale"
DEAL_TYPE_RENT = "rent"

# Category types
CATEGORY_FLAT = "kvartiry"
CATEGORY_ROOM = "komnaty"
CATEGORY_HOUSE = "doma_dachi_kottedzhi"
CATEGORY_LAND = "zemelnye_uchastki"

# Seller types
SELLER_TYPE_OWNER = "owner"
SELLER_TYPE_AGENT = "agent"
SELLER_TYPE_COMPANY = "company"

# Time constants (in seconds)
HOUR = 3600
DAY = 24 * HOUR
WEEK = 7 * DAY

# Price range
MIN_PRICE = 0
MAX_PRICE = 999_999_999

# Pagination
DEFAULT_ITEMS_PER_PAGE = 50
MAX_PAGES = 100

# Cookies file
COOKIES_FILE = "avito_cookies.json"

# Log settings
LOG_FILE = "logs/avito_parser.log"
LOG_ROTATION = "5 MB"
LOG_RETENTION = "5 days"
