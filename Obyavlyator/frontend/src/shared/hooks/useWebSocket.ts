import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketService } from '../services/socketService';
import { listingQueryKeys, transformListingToAd, Listing, PaginatedListingsResponse } from '../services/listingService';
import { Ad } from '../constants/ads';
import { useFavoritesWebSocket } from './useFavoritesWebSocket';

export const useWebSocket = () => {
  const queryClient = useQueryClient();
  const { getNewCount } = useFavoritesWebSocket();

  useEffect(() => {
    socketService.connect();
    
    const handleNewListings = (newListings: Listing[]) => {
      console.log('Получены новые объявления:', newListings.length);
      // getNewCount();
      
      queryClient.setQueryData(
        [...listingQueryKeys.lists(), 1],
        (oldData: (PaginatedListingsResponse & { ads: Ad[] }) | undefined) => {
          if (!oldData) return oldData;
          
          // Проверяем дубликаты по ID
          const existingIds = new Set(oldData.items.map(item => item.id));
          const uniqueNewListings = newListings.filter(listing => !existingIds.has(listing.id));
          
          if (uniqueNewListings.length === 0) return oldData;
          
          const newAds = uniqueNewListings.map(listing => transformListingToAd(listing, true));
          const remainingItems = oldData.items.slice(0, 10 - uniqueNewListings.length);
          const remainingAds = oldData.ads.slice(0, 10 - uniqueNewListings.length);
          
          return {
            ...oldData,
            total: oldData.total + uniqueNewListings.length,
            items: [...uniqueNewListings, ...remainingItems],
            ads: [...newAds, ...remainingAds]
          };
        }
      );
    };
    
    socketService.onNewListings(handleNewListings);

    // Initialize favorites count after connection
    // const timer = setTimeout(() => {
    // }, 1000);

    return () => {
      // clearTimeout(timer);
      socketService.offNewListings(handleNewListings);
      socketService.disconnect();
    };
  }, [queryClient]);
};