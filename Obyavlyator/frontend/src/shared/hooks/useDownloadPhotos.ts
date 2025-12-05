import { useMutation } from '@tanstack/react-query';
import { listingApi } from '../services/listingService';
import { addToast } from '@heroui/toast';

export const useDownloadPhotos = () => {
  return useMutation({
    mutationFn: async (listingId: string) => {
      const blob = await listingApi.downloadPhotos(listingId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `listing_${listingId}_photos.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      addToast({
        title: 'Успешно',
        description: 'Фотографии скачаны',
        variant: 'flat',
        color: 'success',
      });
    },
    onError: () => {
      addToast({
        title: 'Ошибка',
        description: 'Не удалось скачать фотографии',
        variant: 'flat',
        color: 'danger',
      });
    },
  });
};
