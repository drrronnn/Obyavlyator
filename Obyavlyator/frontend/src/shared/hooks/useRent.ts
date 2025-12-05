import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { addToast } from '@heroui/toast';

interface RentData {
  listing_id: string;
  tenant_first_name: string;
  tenant_last_name: string;
  tenant_phone: string;
  rent_price: number;
  rent_start_date: string;
  rent_end_date: string;
  responsible_user_id?: string;
}

export const useAddToRent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RentData) => {
      const response = await apiClient.post('/rent', data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rent'] });
      
      // Обновить is_in_rent в кеше listings
      queryClient.setQueriesData({ queryKey: ['listings'] }, (oldData: any) => {
        if (!oldData?.ads) return oldData;
        return {
          ...oldData,
          ads: oldData.ads.map((ad: any) => 
            ad.id === variables.listing_id ? { ...ad, is_in_rent: true } : ad
          )
        };
      });
      
      addToast({
        title: 'Успешно',
        description: 'Листинг добавлен в аренду',
        variant: 'flat',
        color: 'success',
      });
    },
    onError: () => {
      addToast({
        title: 'Ошибка',
        description: 'Не удалось добавить в аренду',
        variant: 'flat',
        color: 'danger',
      });
    },
  });
};

export const useUpdateRent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listingId, data }: { listingId: string; data: Partial<RentData> }) => {
      const response = await apiClient.patch(`/rent/${listingId}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rent'] });
      queryClient.invalidateQueries({ queryKey: ['rent-listing', variables.listingId] });
      addToast({
        title: 'Успешно',
        description: 'Данные аренды обновлены',
        variant: 'flat',
        color: 'success',
      });
    },
    onError: () => {
      addToast({
        title: 'Ошибка',
        description: 'Не удалось обновить данные',
        variant: 'flat',
        color: 'danger',
      });
    },
  });
};

export const useRemoveFromRent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listingId: string) => {
      const response = await apiClient.delete(`/rent/${listingId}`);
      return response.data;
    },
    onSuccess: (_, listingId) => {
      queryClient.invalidateQueries({ queryKey: ['rent'] });
      
      // Обновить is_in_rent в кеше listings
      queryClient.setQueriesData({ queryKey: ['listings'] }, (oldData: any) => {
        if (!oldData?.ads) return oldData;
        return {
          ...oldData,
          ads: oldData.ads.map((ad: any) => 
            ad.id === listingId ? { ...ad, is_in_rent: false } : ad
          )
        };
      });
      
      // Обновить is_in_rent в кеше favorites
      queryClient.setQueriesData({ queryKey: ['favorites'] }, (oldData: any) => {
        if (!oldData?.ads) return oldData;
        return {
          ...oldData,
          ads: oldData.ads.map((ad: any) => 
            ad.id === listingId ? { ...ad, is_in_rent: false } : ad
          )
        };
      });
      
      addToast({
        title: 'Успешно',
        description: 'Листинг удален из аренды',
        variant: 'flat',
        color: 'success',
      });
    },
    onError: () => {
      addToast({
        title: 'Ошибка',
        description: 'Не удалось удалить из аренды',
        variant: 'flat',
        color: 'danger',
      });
    },
  });
};
