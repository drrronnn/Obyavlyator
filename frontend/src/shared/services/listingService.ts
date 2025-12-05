import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./apiClient";
import { Ad } from "@/shared/constants/ads";
import { FilterFormData } from "@/components/ui/FilterForm";

// Define the Listing type based on the response structure
export interface Listing {
  id: string;
  created_at: string;
  deal_type: string;
  price: number;
  total_meters: number;
  floor: string;
  location: string;
  source: string;
  url: string;
  phone_number: string;
  rooms_count: number | null;
  is_favorite: boolean;
  responsible?: string | null;
  status?: string;
}

// Filter parameters interface
export interface ListingFilters {
  deal_type?: string;
  source?: string;
  rooms_count?: string;
  min_price?: number;
  max_price?: number;
  min_meters?: number;
  max_meters?: number;
  search?: string;
  status?: string;
  responsible?: string;
}

// API response interfaces
export interface ListingStats {
  max_price: number;
  max_meters: number;
}

export interface AppliedFilters {
  deal_type?: string;
  source?: string;
  rooms_count?: string[];
  min_price?: number;
  max_price?: number;
  min_meters?: number;
  max_meters?: number;
}

// Paginated response interface
export interface PaginatedListingsResponse {
  items: Listing[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  filters?: AppliedFilters;
  stats?: ListingStats;
}

// Helper function to build query string
const buildQueryString = (page: number, filters?: ListingFilters): string => {
  const params = new URLSearchParams({ page: page.toString() });

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value.toString());
      }
    });
  }

  return params.toString();
};

// Transform FilterFormData to API filters
export const transformFiltersToApi = (
  formFilters: FilterFormData
): ListingFilters => {
  const apiFilters: ListingFilters = {};

  if (formFilters.dealType) {
    apiFilters.deal_type = formFilters.dealType;
  }

  if (formFilters.source) {
    apiFilters.source = formFilters.source;
  }

  if (formFilters.rooms.length > 0) {
    const expandedRooms: string[] = [];
    formFilters.rooms.forEach((room) => {
      if (room === "4+") {
        expandedRooms.push("4", "5", "6");
      } else {
        expandedRooms.push(room);
      }
    });
    apiFilters.rooms_count = expandedRooms.join(",");
  }

  if (formFilters.priceRange[0] > 0) {
    apiFilters.min_price = formFilters.priceRange[0];
  }

  if (formFilters.priceRange[1]) {
    apiFilters.max_price = formFilters.priceRange[1];
  }

  if (formFilters.areaRange[0] > 0) {
    apiFilters.min_meters = formFilters.areaRange[0];
  }

  if (formFilters.areaRange[1]) {
    apiFilters.max_meters = formFilters.areaRange[1];
  }

  if (formFilters.search.trim()) {
    apiFilters.search = formFilters.search.trim();
  }

  if (formFilters.status) {
    apiFilters.status = formFilters.status;
  }

  if (formFilters.responsible) {
    apiFilters.responsible = formFilters.responsible;
  }

  return apiFilters;
};

// API functions
export const listingApi = {
  getListings: async (
    page: number = 1,
    filters?: ListingFilters
  ): Promise<PaginatedListingsResponse> => {
    const queryString = buildQueryString(page, filters);
    const response = await apiClient.get<PaginatedListingsResponse>(
      `/listings?${queryString}`
    );
    return response.data;
  },
  
  downloadPhotos: async (listingId: string): Promise<Blob> => {
    const response = await apiClient.get(`/listings/${listingId}/photos`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

// Transform Listing to Ad
export const transformListingToAd = (listing: Listing, isNew = false, isFavorite: boolean | undefined = undefined): Ad => {
  return {
    ...listing,
    id: listing.id,
    address: listing.location,
    price: listing.price,
    area: listing.total_meters,
    rooms: listing.rooms_count || 0,
    dealType: listing.deal_type as "sale" | "rent",
    source: listing.source as "cian" | "avito",
    status: (listing.status || "new") as "new" | "in_progress",
    responsible: listing.responsible || "",
    createdAt: listing.created_at,
    isFavorite: isFavorite !== undefined ? isFavorite : listing.is_favorite,
    phone_number: listing.phone_number,
    url: listing.url,
    isNew,
  };
};

// Query keys for react-query
export const listingQueryKeys = {
  all: ["listings"] as const,
  lists: () => [...listingQueryKeys.all, "list"] as const,
  filtered: (page: number, filters?: ListingFilters) =>
    [...listingQueryKeys.lists(), page, filters] as const,
};

// Query hooks
export const useListings = (page: number = 1, filters?: ListingFilters) => {
  return useQuery<PaginatedListingsResponse & { ads: Ad[] }, Error>({
    queryKey: listingQueryKeys.filtered(page, filters),
    queryFn: async () => {
      const response = await listingApi.getListings(page, filters);
      return {
        ...response,
        ads: response.items.map((listing) => transformListingToAd(listing)),
      };
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};
