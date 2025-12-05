import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { addToast } from '@heroui/toast';

interface UpdateMetadataRequest {
  listingId: string;
  data: {
    responsible_user_id?: string;
    status?: string;
  };
}

const updateListingMetadata = async ({ listingId, data }: UpdateMetadataRequest) => {
  const response = await apiClient.patch(`/listings/${listingId}/metadata`, data);
  return response.data;
};

export const useUpdateListingMetadata = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateListingMetadata,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      
      addToast({
        title: 'Успешно',
        description: 'Метаданные обновлены',
        variant: 'flat',
        color: 'success',
      });
    },
    onError: (error: any) => {
      addToast({
        title: 'Ошибка',
        description: error.response?.data?.error?.message || 'Не удалось обновить метаданные',
        variant: 'flat',
        color: 'danger',
      });
    },
  });
};
