import time
import os
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from .constants import CITIES, METRO_STATIONS, DEAL_TYPES, OBJECT_SUBURBAN_TYPES
from .url_builder import URLBuilder
from .proxy_pool import ProxyPool
from .flat.list import FlatListPageParser
from .suburban.list import SuburbanListPageParser
from .newobject.list import NewObjectListParser

from .flat.page import FlatPageParser


def list_locations():
    return CITIES


def list_metro_stations():
    return METRO_STATIONS


class CianParser:
    def __init__(self, location: str, proxies=None, headless=True):  # headless=True по умолчанию
        location_id = __validation_init__(location)

        self.__parser__ = None
        self.__proxy_pool__ = ProxyPool(proxies=proxies)
        self.__location_name__ = location
        self.__location_id__ = location_id
        self.__driver__ = None

        chrome_options = Options()
        if headless:
            chrome_options.add_argument("--headless=new")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        
        try:
            self.__driver__ = uc.Chrome(options=chrome_options)
        except Exception as e:
            print(f"Ошибка при создании браузера: {e}")
            raise

    def __del__(self):
        self.close_browser()
    
    def close_browser(self):
        """Принудительно закрывает браузер"""
        if self.__driver__:
            try:
                self.__driver__.quit()
            except Exception as e:
                print(f"Ошибка при закрытии браузера: {e}")
            finally:
                self.__driver__ = None

    def __set_proxy__(self, url_list):
        if self.__proxy_pool__.is_empty():
            return
        available_proxy = self.__proxy_pool__.get_available_proxy(url_list)
        if available_proxy is not None:
            # для undetected-chromedriver прокси можно установить через аргументы
            # но это нужно делать при старте драйвера, динамически не поменяешь
            # поэтому оставляем как есть — можно расширить через profile
            print(f"⚠️ Прокси {available_proxy} не установлен динамически (нужен рестарт драйвера)")

    def __load_list_page__(self, url_list_format, page_number, attempt_number_exception):
        url_list = url_list_format.format(page_number)
        self.__set_proxy__(url_list)

        if page_number == self.__parser__.start_page and attempt_number_exception == 0:
            print(f"The page from which the collection of information begins: \n {url_list}")

        self.__driver__.get(url_list)

        try:
            WebDriverWait(self.__driver__, 20).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, '[data-name="Offers"]'))
            )
        except:
            if "checkcaptcha" in self.__driver__.current_url or "not a robot" in self.__driver__.page_source.lower():
                print("⚠️ Попали на капчу. Смените IP/добавьте паузу.")
            else:
                print("⚠️ Таймаут загрузки страницы.")

        html = self.__driver__.page_source

        # debug_dir = "cianparser/debug"
        # os.makedirs(debug_dir, exist_ok=True)
        # debug_file = os.path.join(debug_dir, f"page_{page_number}.html")
        # with open(debug_file, "w", encoding="utf-8") as f:
        #     f.write(html)

        return html

    def __run__(self, url_list_format: str):
        print(f"\n{' ' * 30}Preparing to collect information from pages..")

        if self.__parser__.with_saving_csv:
            print(f"The absolute path to the file: \n{self.__parser__.file_path} \n")

        page_number = self.__parser__.start_page - 1
        end_all_parsing = False
        
        # Проверяем, указан ли end_page в additional_settings
        auto_detect_last_page = (
            self.__parser__.additional_settings is None or 
            "end_page" not in self.__parser__.additional_settings.keys()
        )
        
        if auto_detect_last_page:
            print("Автоопределение последней страницы включено")
        
        while page_number < self.__parser__.end_page and not end_all_parsing:
            page_parsed = False
            page_number += 1
            attempt_number_exception = 0

            try:
                (page_parsed, attempt_number, end_all_parsing) = self.__parser__.parse_list_offers_page(
                    html=self.__load_list_page__(url_list_format, page_number, attempt_number_exception),
                    page_number=page_number,
                    count_of_pages=self.__parser__.end_page + 1 - self.__parser__.start_page,
                    attempt_number=attempt_number_exception)
                    
                # Если включено автоопределение и обнаружена последняя страница
                if auto_detect_last_page and end_all_parsing:
                    print(f"\nОстановка: достигнута последняя страница пагинации на странице {page_number}")
                    break
                    
            except Exception as e:
                attempt_number_exception += 1
                if attempt_number_exception < 3:
                    continue
                print(f"\n\nException: {e}")
                print(f"The collection of information from the pages with ending parse on {page_number} page...\n")
                break

        print(f"\n\nThe collection of information from the pages with list of offers is completed")
        print(f"Total number of parsed offers: {self.__parser__.count_parsed_offers}. ", end="\n")

    def get_flats(self, deal_type: str, rooms, with_saving_csv=False, with_extra_data=False, additional_settings=None):
        __validation_get_flats__(deal_type, rooms)
        deal_type, rent_period_type = __define_deal_type__(deal_type)
        self.__parser__ = FlatListPageParser(
            accommodation_type="flat",
            driver=self.__driver__,
            deal_type=deal_type,
            rent_period_type=rent_period_type,
            location_name=self.__location_name__,
            with_saving_csv=with_saving_csv,
            with_extra_data=with_extra_data,
            additional_settings=additional_settings,
        )
        self.__run__(
            __build_url_list__(location_id=self.__location_id__, deal_type=deal_type, accommodation_type="flat",
                               rooms=rooms, rent_period_type=rent_period_type,
                               additional_settings=additional_settings))
        return self.__parser__.result

    def get_suburban(self, suburban_type: str, deal_type: str, with_saving_csv=False, with_extra_data=False, additional_settings=None):
        __validation_get_suburban__(suburban_type=suburban_type, deal_type=deal_type)
        deal_type, rent_period_type = __define_deal_type__(deal_type)
        self.__parser__ = SuburbanListPageParser(
            driver=self.__driver__,
            accommodation_type="suburban",
            deal_type=deal_type,
            rent_period_type=rent_period_type,
            location_name=self.__location_name__,
            with_saving_csv=with_saving_csv,
            with_extra_data=with_extra_data,
            additional_settings=additional_settings,
            object_type=suburban_type,
        )
        self.__run__(
            __build_url_list__(location_id=self.__location_id__, deal_type=deal_type, accommodation_type="suburban",
                               rooms=None, rent_period_type=rent_period_type, suburban_type=suburban_type,
                               additional_settings=additional_settings))
        return self.__parser__.result

    def get_newobjects(self, with_saving_csv=False):
        self.__parser__ = NewObjectListParser(
            driver=self.__driver__,
            location_name=self.__location_name__,
            with_saving_csv=with_saving_csv,
        )
        self.__run__(
            __build_url_list__(location_id=self.__location_id__, deal_type="sale", accommodation_type="newobject"))
        return self.__parser__.result
    
    def parse_extra_flat_page(self, url:str):
        print(f'with_extra_data {url}')
        
        flat_parser = FlatPageParser(driver=self.__driver__, url=url)
        page_data = flat_parser.parse_page()
        
        return page_data



def __validation_init__(location):
    location_id = None
    for location_info in list_locations():
        if location_info[0] == location:
            location_id = location_info[1]

    if location_id is None:
        ValueError(f'You entered {location}, which is not exists in base.'
                   f' See all available values of location in cianparser.list_locations()')

    return location_id


def __validation_get_flats__(deal_type, rooms):
    if deal_type not in DEAL_TYPES:
        raise ValueError(f'You entered deal_type={deal_type}, which is not valid value. '
                         f'Try entering one of these values: "rent_long", "sale".')

    if type(rooms) is tuple or type(rooms) is list:
        for count_of_room in rooms:
            if type(count_of_room) is int:
                if count_of_room < 1 or count_of_room > 6:
                    raise ValueError(f'You entered {count_of_room} in {rooms}, which is not valid value. '
                                     f'Try entering one of these values: 1, 2, 3, 4, 5, "studio", "all".')
            elif type(count_of_room) is str:
                if count_of_room != "studio":
                    raise ValueError(f'You entered {count_of_room} in {rooms}, which is not valid value. '
                                     f'Try entering one of these values: 1, 2, 3, 4, 5, "studio", "all".')
            else:
                raise ValueError(f'In tuple "rooms" not valid type of element. '
                                 f'It is correct int and str types. Example (1,3,5, "studio").')
    elif type(rooms) is int:
        if rooms < 1 or rooms > 5:
            raise ValueError(f'You entered rooms={rooms}, which is not valid value. '
                             f'Try entering one of these values: 1, 2, 3, 4, 5, "studio", "all".')
    elif type(rooms) is str:
        if rooms != "studio" and rooms != "all":
            raise ValueError(f'You entered rooms={rooms}, which is not valid value. '
                             f'Try entering one of these values: 1, 2, 3, 4, 5, "studio", "all".')
    else:
        raise ValueError(f'In argument "rooms" not valid type of element. '
                         f'It is correct int, str and tuple types. Example 1, (1,3, "studio"), "studio, "all".')


def __validation_get_suburban__(suburban_type, deal_type):
    if suburban_type not in OBJECT_SUBURBAN_TYPES.keys():
        raise ValueError(f'You entered suburban_type={suburban_type}, which is not valid value. '
                         f'Try entering one of these values: "house", "house-part", "land-plot", "townhouse".')

    if deal_type not in DEAL_TYPES:
        raise ValueError(f'You entered deal_type={deal_type}, which is not valid value. '
                         f'Try entering one of these values: "rent_long", "sale".')


def __build_url_list__(location_id, deal_type, accommodation_type, rooms=None, rent_period_type=None,
                       suburban_type=None, additional_settings=None):
    url_builder = URLBuilder(accommodation_type == "newobject")
    url_builder.add_location(location_id)
    url_builder.add_deal_type(deal_type)
    url_builder.add_accommodation_type(accommodation_type)

    if rooms is not None:
        url_builder.add_room(rooms)

    if rent_period_type is not None:
        url_builder.add_rent_period_type(rent_period_type)

    if suburban_type is not None:
        url_builder.add_object_suburban_type(suburban_type)

    if additional_settings is not None:
        url_builder.add_additional_settings(additional_settings)

    return url_builder.get_url()


def __define_deal_type__(deal_type):
    rent_period_type = None
    if deal_type == "rent_long":
        deal_type, rent_period_type = "rent", 4
    elif deal_type == "rent_short":
        deal_type, rent_period_type = "rent", 2
    return deal_type, rent_period_type
