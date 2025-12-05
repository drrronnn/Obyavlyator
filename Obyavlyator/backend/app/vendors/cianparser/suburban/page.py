import time
import bs4
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException

class SuburbanPageParser:
    def __init__(self, driver, url):
        self.driver = driver
        self.url = url
        self.offer_page_html = ""
        self.offer_page_soup = None

    def __load_page__(self):
        try:
            self.driver.get(self.url)
            time.sleep(2)  # даём странице прогрузиться, можно заменить на WebDriverWait
            self.offer_page_html = self.driver.page_source
            self.offer_page_soup = bs4.BeautifulSoup(self.offer_page_html, 'html.parser')
        except TimeoutException:
            print(f"Timeout при загрузке страницы: {self.url}")
            self.offer_page_html = ""
            self.offer_page_soup = bs4.BeautifulSoup("", "html.parser")

    def parse_page(self):
        self.__load_page__()

        page_data = {
            "year_of_construction": -1,
            "house_material_type": -1,
            "land_plot": -1,
            "land_plot_status": -1,
            "heating_type": -1,
            "gas_type": -1,
            "water_supply_type": -1,
            "sewage_system": -1,
            "bathroom": -1,
            "living_meters": -1,
            "floors_count": -1,
            "phone": "",
        }

        spans = self.offer_page_soup.select("span")
        for index, span in enumerate(spans):
            if "Материал дома" == span.text:
                page_data["house_material_type"] = spans[index + 1].text

            if "Участок" == span.text:
                page_data["land_plot"] = spans[index + 1].text

            if "Статус участка" == span.text:
                page_data["land_plot_status"] = spans[index + 1].text

            if "Отопление" == span.text:
                page_data["heating_type"] = spans[index + 1].text

            if "Газ" == span.text:
                page_data["gas_type"] = spans[index + 1].text

            if "Водоснабжение" == span.text:
                page_data["water_supply_type"] = spans[index + 1].text

            if "Канализация" == span.text:
                page_data["sewage_system"] = spans[index + 1].text

            if "Санузел" == span.text:
                page_data["bathroom"] = spans[index + 1].text

            if "Площадь кухни" == span.text:
                page_data["kitchen_meters"] = spans[index + 1].text

            if "Общая площадь" == span.text:
                page_data["living_meters"] = spans[index + 1].text

            if "Год постройки" in span.text:
                page_data["year_of_construction"] = spans[index + 1].text

            if "Год сдачи" in span.text:
                page_data["year_of_construction"] = spans[index + 1].text

            if "Этажей в доме" == span.text:
                page_data["floors_count"] = spans[index + 1].text

        if "+7" in self.offer_page_html:
            page_data["phone"] = self.offer_page_html[self.offer_page_html.find("+7"): self.offer_page_html.find("+7") + 16].split('"')[0]. \
                replace(" ", ""). \
                replace("-", "")

        return page_data
