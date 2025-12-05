import { useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient';

export interface RentListing {
  rent_id: string;
  listing_id: string;
  tenant_first_name: string;
  tenant_last_name: string;
  tenant_phone: string;
  rent_price: number;
  rent_start_date: string;
  rent_end_date: string;
  responsible_user_id: string | null;
  address: string;
  area: number;
  rooms: number;
  floor: number;
  price: number;
  source: string;
  url: string;
}

export interface RentListingsResponse {
  rent_listings: RentListing[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  stats?: {
    max_price: number | null;
    max_meters: number | null;
  };
  filters?: Record<string, any>;
}

export const useRentListings = (page: number = 1, filters?: Record<string, any>) => {
  return useQuery<RentListingsResponse>({
    queryKey: ['rent', page, filters],
    queryFn: async () => {
      const response = await apiClient.get('/rent', {
        params: { page, page_size: 20, ...filters }
      });
      return response.data;
    },
  });
};
