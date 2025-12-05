import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

export const useRentListing = (listingId: string | null) => {
  return useQuery({
    queryKey: ['rent-listing', listingId],
    queryFn: async () => {
      if (!listingId) return null;
      const response = await apiClient.get(`/rent/${listingId}`);
      return response.data;
    },
    enabled: !!listingId,
  });
};
