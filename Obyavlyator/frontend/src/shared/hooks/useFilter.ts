import { useAdsFilter } from '@/store/adsFilterStore';

export const useFilter = () => {
  const { filters, appliedFilters, setFilters, resetFilters, updateFilter, applyFilters } = useAdsFilter();

  const updatePriceRange = (range: [number, number]) => {
    updateFilter('priceRange', range);
  };

  const updateAreaRange = (range: [number, number]) => {
    updateFilter('areaRange', range);
  };

  const updateRooms = (rooms: string[]) => {
    updateFilter('rooms', rooms);
  };

  const updateDealType = (dealType: string) => {
    updateFilter('dealType', dealType);
  };

  const updateSource = (source: string) => {
    updateFilter('source', source);
  };

  const updateStatus = (status: string) => {
    updateFilter('status', status);
  };

  const updateResponsible = (responsible: string) => {
    updateFilter('responsible', responsible);
  };

  const updateSearch = (search: string) => {
    updateFilter('search', search);
  }

  return {
    filters,
    appliedFilters,
    setFilters,
    resetFilters,
    applyFilters,
    updatePriceRange,
    updateAreaRange,
    updateRooms,
    updateDealType,
    updateSource,
    updateStatus,
    updateResponsible,
    updateSearch
  };
};