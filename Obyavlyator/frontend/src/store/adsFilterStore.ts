import { create } from 'zustand';

export interface AdsFilterData {
  priceRange: [number, number];
  areaRange: [number, number];
  rooms: string[];
  dealType: string;
  source: string;
  status: string;
  responsible: string;
  search: string;
}


interface AdsFilterStore {
  filters: AdsFilterData;
  appliedFilters: AdsFilterData;
  setFilters: (filters: AdsFilterData) => void;
  resetFilters: () => void;
  applyFilters: () => void;
  updateFilter: <K extends keyof AdsFilterData>(key: K, value: AdsFilterData[K]) => void;
}

const createDefaultFilters = (maxPrice?: number, maxMeters?: number): AdsFilterData => ({
  priceRange: [0, maxPrice || 50_000_000],
  areaRange: [0, maxMeters || 1000],
  rooms: [],
  dealType: '',
  source: '',
  status: '',
  responsible: '',
  search: '',
});

interface AdsFilterStoreExtended extends AdsFilterStore {
  updateMaxValues: (maxPrice?: number, maxMeters?: number) => void;
  maxValues: { maxPrice: number; maxMeters: number };
}

export const useAdsFilter = create<AdsFilterStoreExtended>((set, get) => ({
  filters: createDefaultFilters(),
  appliedFilters: createDefaultFilters(),
  maxValues: { maxPrice: 50_000_000, maxMeters: 1000 },
  setFilters: (filters) => set({ filters }),
  resetFilters: () => {
    const { maxValues } = get();
    const defaults = createDefaultFilters(maxValues.maxPrice, maxValues.maxMeters);
    set({ filters: defaults, appliedFilters: defaults });
  },
  applyFilters: () => {
    const { filters } = get();
    set({ appliedFilters: { ...filters } });
  },
  updateFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
      },
    })),
  updateMaxValues: (maxPrice, maxMeters) => {
    set((state) => {
      const newPriceMax = maxPrice || 50_000_000;
      const newAreaMax = maxMeters || 1000;
      
      const isPriceDefault = state.filters.priceRange[1] === 50_000_000 || state.filters.priceRange[1] === 1000;
      const isAreaDefault = state.filters.areaRange[1] === 1000 || state.filters.areaRange[1] === 50_000_000;
      
      return {
        maxValues: { maxPrice: newPriceMax, maxMeters: newAreaMax },
        filters: {
          ...state.filters,
          priceRange: [state.filters.priceRange[0], isPriceDefault ? newPriceMax : state.filters.priceRange[1]] as [number, number],
          areaRange: [state.filters.areaRange[0], isAreaDefault ? newAreaMax : state.filters.areaRange[1]] as [number, number],
        },
        appliedFilters: {
          ...state.appliedFilters,
          priceRange: [state.appliedFilters.priceRange[0], isPriceDefault ? newPriceMax : state.appliedFilters.priceRange[1]] as [number, number],
          areaRange: [state.appliedFilters.areaRange[0], isAreaDefault ? newAreaMax : state.appliedFilters.areaRange[1]] as [number, number],
        },
      };
    });
  },
}));