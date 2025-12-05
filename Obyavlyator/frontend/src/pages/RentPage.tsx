import React, { useState, useEffect, useMemo } from "react";
import { Input } from "@heroui/input";
import { Accordion, AccordionItem } from "@heroui/accordion";
import DashboardLayout from "../layouts/DashboardLayout";
import PageHeader from "../components/ui/PageHeader";
import { RentTable } from "../components/ui/RentTable";
import { FilterForm } from "../components/ui/FilterForm";
import { useRentListings } from "@/shared/services/rentService";
import { ICONS } from "../config/constants";
import { useRentFilter } from "@/store/rentFilterStore";
import { useDebouncedValue } from "@/shared/hooks/useDebounce";
import { transformFiltersToApi } from "@/shared/services/listingService";


const RentPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchValue, setSearchValue] = useState("");
  const rentFilter = useRentFilter();
  const [debouncedSearch] = useDebouncedValue(searchValue, 1500);
  
  const apiFilters = transformFiltersToApi({...rentFilter.appliedFilters, search: debouncedSearch, dealType: ''});
  const { data, isLoading, isError, error } = useRentListings(page, apiFilters);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    if (data?.stats) {
      rentFilter.updateMaxValues(data.stats.max_price, data.stats.max_meters);
    }
  }, [data?.stats]);

  const rentListings = useMemo(() => {
    return data?.rent_listings || [];
  }, [data?.rent_listings]);


  if (isError) {
    return (
      <DashboardLayout>
        <div className="space-y-6 w-full">
          <PageHeader
            title="Сдается"
            subtitle="Ошибка загрузки объявлений"
          />
          <div className="text-red-500">
            {error instanceof Error ? error.message : 'Произошла неизвестная ошибка'}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 w-full">
        <PageHeader
          title="Сдается"
          subtitle={`Сданные объявления (${data?.total || 0})`}
        />

        <Input
          isClearable
          placeholder="Поиск по адрессу"
          startContent={<ICONS.search />}
          value={searchValue}
          onClear={() => setSearchValue('')}
          onValueChange={setSearchValue}
          fullWidth
        />

        <Accordion
          variant="splitted"
          className="px-0"
        >
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
              filters={rentFilter.filters}
              setFilters={rentFilter.setFilters}
              resetFilters={rentFilter.resetFilters}
              applyFilters={rentFilter.applyFilters}
              isLoading={isLoading}
              stats={data?.stats}
              hideFilters={['dealType']}
              priceStep={10_000}
            />
          </AccordionItem>
        </Accordion>

        <RentTable 
          rentListings={rentListings} 
          isLoading={isLoading}
          totalPages={data?.total_pages || 1}
          currentPage={page}
          onPageChange={setPage}
        />
      </div>
    </DashboardLayout>
  );
};

export default RentPage;