import React, { useEffect, useState } from "react";
import { Input } from "@heroui/input";
import { Accordion, AccordionItem } from "@heroui/accordion";
import DashboardLayout from "../layouts/DashboardLayout";
import PageHeader from "../components/ui/PageHeader";
import { FilterForm } from "../components/ui/FilterForm";
import { AdsTable } from "../components/ui/AdsTable";
import { ICONS } from "../config/constants";
import { useFavoritesFilter } from "@/store/favoritesFilterStore";
import { useFavorites } from "@/shared/services/favoritesService";
import { transformFiltersToApi } from "@/shared/services/listingService";
import { useDebouncedValue } from "@/shared/hooks/useDebounce";
import { useFavoritesWebSocket } from "@/shared/hooks/useFavoritesWebSocket";

const FavoritesPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchValue, setSearchValue] = useState("");
  const favoritesFilter = useFavoritesFilter();
  const [debouncedSearch] = useDebouncedValue(searchValue, 1500);
  
  const apiFilters = transformFiltersToApi({...favoritesFilter.appliedFilters, search: debouncedSearch});
  const { data, isLoading } = useFavorites(page, apiFilters);
  const { markViewed } = useFavoritesWebSocket();

  useEffect(() => {
    console.log(`Поиск в избранном: ${debouncedSearch}`);
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    if (data?.stats) {
      favoritesFilter.updateMaxValues(data.stats.max_price, data.stats.max_meters);
    }
  }, [data?.stats]);

  useEffect(() => {
    markViewed();
  }, [markViewed]);

  const ads = data?.ads || [];

  return (
    <DashboardLayout>
      <div className="space-y-6 w-full">
        <PageHeader
          title="Избранное"
          subtitle={`Избранные объявления (${data?.total || 0})`}
        />

        <Input
          isClearable
          placeholder="Поиск по адресу"
          startContent={<ICONS.search />}
          value={searchValue}
          onClear={() => setSearchValue("")}
          onValueChange={setSearchValue}
          fullWidth
        />

        <Accordion variant="splitted">
          <AccordionItem
            key="filters"
            aria-label="Фильтр объявлений"
            title="Фильтр объявлений"
            classNames={{
              trigger: "cursor-pointer text-black",
              base: "border-1 border-black",
              indicator: "text-black text-2xl",
            }}
          >
            <FilterForm 
              filters={favoritesFilter.filters}
              setFilters={favoritesFilter.setFilters}
              resetFilters={favoritesFilter.resetFilters}
              applyFilters={favoritesFilter.applyFilters}
              isLoading={isLoading}
              stats={data?.stats}
            />
          </AccordionItem>
        </Accordion>

        <AdsTable 
          ads={ads} 
          isLoading={isLoading}
          totalPages={data?.total_pages || 1}
          currentPage={page}
          onPageChange={setPage}
        />
      </div>
    </DashboardLayout>
  );
};

export default FavoritesPage;
