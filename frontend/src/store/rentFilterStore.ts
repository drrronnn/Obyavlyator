import { create } from 'zustand';

export interface RentFilterData {
  priceRange: [number, number];
  areaRange: [number, number];
  rooms: string[];
  source: string;
  status: string;
  responsible: string;
  search: string;
}

interface RentFilterStore {
  filters: RentFilterData;
  appliedFilters: RentFilterData;
  setFilters: (filters: RentFilterData) => void;
  resetFilters: () => void;
  applyFilters: () => void;
  updateFilter: <K extends keyof RentFilterData>(key: K, value: RentFilterData[K]) => void;
  updateMaxValues: (maxPrice?: number, maxMeters?: number) => void;
  maxValues: { maxPrice: number; maxMeters: number };
}

const createDefaultFilters = (maxPrice?: number, maxMeters?: number): RentFilterData => ({
  priceRange: [0, maxPrice || 50_000_000],
  areaRange: [0, maxMeters || 1000],
  rooms: [],
  source: '',
  status: '',
  responsible: '',
  search: '',
});

export const useRentFilter = create<RentFilterStore>((set, get) => ({
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
