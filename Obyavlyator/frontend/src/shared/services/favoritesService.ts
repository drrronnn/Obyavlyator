import { useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient';
import { Ad } from '@/shared/constants/ads';
import { FilterFormData } from '@/components/ui/FilterForm';
import { ListingFilters, transformFiltersToApi, transformListingToAd, PaginatedListingsResponse } from './listingService';

// API functions
export const favoritesApi = {
  getFavorites: async (page: number = 1, filters?: ListingFilters): Promise<PaginatedListingsResponse> => {
    const params = new URLSearchParams({ page: page.toString() });
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await apiClient.get<PaginatedListingsResponse>(`/favorites?${params}`);
    return response.data;
  },
};

// Query keys
export const favoritesQueryKeys = {
  all: ['favorites'] as const,
  lists: () => [...favoritesQueryKeys.all, 'list'] as const,
  filtered: (page: number, filters?: ListingFilters) => [...favoritesQueryKeys.lists(), page, filters] as const,
};

// Query hooks
export const useFavorites = (page: number = 1, filters?: ListingFilters) => {
  return useQuery<PaginatedListingsResponse & { ads: Ad[] }, Error>({
    queryKey: favoritesQueryKeys.filtered(page, filters),
    queryFn: async () => {
      const response = await favoritesApi.getFavorites(page, filters);
      return {
        ...response,
        ads: response.items.map((listing) => transformListingToAd(listing, false, true))
      };
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};

// Hook to check if listing is favorite
export const useIsFavorite = (listingId: string) => {
  const { data: favoritesData } = useFavorites(1, {});
  return favoritesData?.ads.some(ad => ad.id.toString() === listingId) || false;
};