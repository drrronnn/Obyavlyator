import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@heroui/input";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { today, getLocalTimeZone } from "@internationalized/date";
import DashboardLayout from "../layouts/DashboardLayout";
import PageHeader from "../components/ui/PageHeader";
import EmployeeStatsCard from "../components/ui/EmployeeStatsCard";
import { FilterForm } from "../components/ui/FilterForm";
import { AdsTable } from "../components/ui/AdsTable";
import { ICONS } from "../config/constants";
import { useListings, transformFiltersToApi } from "@/shared/services/listingService";
import { useAdsFilter } from "@/store/adsFilterStore";
import { useDebouncedValue } from "@/shared/hooks/useDebounce";
import { useAuthStore } from "@/store/authStore";
import { useUserStats } from "@/shared/services/statsService";
import { useQueryClient } from "@tanstack/react-query";

const AdsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchValue, setSearchValue] = useState("");
  const adsFilter = useAdsFilter();
  const [debouncedSearch] = useDebouncedValue(searchValue, 1500);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const end = today(getLocalTimeZone());
  const start = end.subtract({ days: 30 });
  const formatDate = (date: any) => `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
  
  const { data: stats, isLoading: isLoadingStats } = useUserStats(
    user?.id,
    formatDate(start),
    formatDate(end)
  );
  
  const apiFilters = transformFiltersToApi({...adsFilter.appliedFilters, search: debouncedSearch});
  const { data: listingsData, isLoading, error } = useListings(page, apiFilters);

  useEffect(() => {
    console.log(`ищем: ${debouncedSearch}`);
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    if (listingsData?.stats) {
      adsFilter.updateMaxValues(listingsData.stats.max_price, listingsData.stats.max_meters);
    }
  }, [listingsData?.stats]);



  const ads = useMemo(() => {
    return listingsData?.ads || [];
  }, [listingsData?.ads]);

  console.log(ads , 'listingsData')

  return (
    <DashboardLayout>
      <div className="space-y-6 w-full">
        <PageHeader title="Объявления" subtitle="Новые объявления" />

        <EmployeeStatsCard stats={stats || { total_ads: 0, our_apartments: 0, conversion: 0 }} isLoading={isLoadingStats} />

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
              filters={adsFilter.filters}
              setFilters={adsFilter.setFilters}
              resetFilters={adsFilter.resetFilters}
              applyFilters={adsFilter.applyFilters}
              isLoading={isLoading}
              stats={listingsData?.stats}
            />
          </AccordionItem>
        </Accordion>

        <AdsTable 
          ads={ads} 
          isLoading={isLoading} 
          totalPages={listingsData?.total_pages || 1}
          currentPage={page}
          onPageChange={setPage}
          onResponsibleChange={() => {
            queryClient.invalidateQueries({ queryKey: ['user-stats'] });
          }}
        />
      </div>
    </DashboardLayout>
  );
};

export default AdsPage;
