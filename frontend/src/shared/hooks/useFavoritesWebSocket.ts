import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { favoritesQueryKeys } from '@/shared/services/favoritesService';
import { listingQueryKeys } from '@/shared/services/listingService';
import { useNewFavoritesStore } from '@/store/newFavoritesStore';
import { useAuthStore } from '@/store/authStore';

export const useFavoritesWebSocket = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const { setCount } = useNewFavoritesStore();
  const { token } = useAuthStore();

  useEffect(() => {
    if (!token) return;

    const connectWebSocket = () => {
      if (wsRef.current) wsRef.current.close();
      
      wsRef.current = new WebSocket(`ws://localhost:8001/ws/favorites?token=${token}`);
      
      wsRef.current.onopen = () => {
        console.log('Favorites WebSocket connected');
        // Запрашиваем список избранных сразу после подключения
        wsRef.current?.send(JSON.stringify({ action: 'list' }));
        wsRef.current?.send(JSON.stringify({ action: 'count_new' }));
      };
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Favorites WebSocket message:', data);
        
        switch (data.status) {
          case 'list':
            // Обновляем isFavorite для всех объявлений на основе списка избранных
            queryClient.setQueriesData(
              { queryKey: listingQueryKeys.all },
              (oldData: any) => {
                if (!oldData?.ads) return oldData;
                const favoriteIds = new Set(data.favorites);
                return {
                  ...oldData,
                  ads: oldData.ads.map((ad: any) => ({
                    ...ad,
                    isFavorite: favoriteIds.has(ad.id.toString())
                  }))
                };
              }
            );
            break;
          case 'added':
            // Update isFavorite in all listings caches
            queryClient.setQueriesData(
              { queryKey: listingQueryKeys.all },
              (oldData: any) => {
                if (!oldData?.ads) return oldData;
                return {
                  ...oldData,
                  ads: oldData.ads.map((ad: any) => 
                    ad.id.toString() === data.listing_id 
                      ? { ...ad, isFavorite: true }
                      : ad
                  )
                };
              }
            );
            queryClient.invalidateQueries({ queryKey: favoritesQueryKeys.all });
            break;
          case 'removed':
            // Update isFavorite in all listings caches
            queryClient.setQueriesData(
              { queryKey: listingQueryKeys.all },
              (oldData: any) => {
                if (!oldData?.ads) return oldData;
                return {
                  ...oldData,
                  ads: oldData.ads.map((ad: any) => 
                    ad.id.toString() === data.listing_id 
                      ? { ...ad, isFavorite: false }
                      : ad
                  )
                };
              }
            );
            queryClient.invalidateQueries({ queryKey: favoritesQueryKeys.all });
            break;
          case 'count_new':
            setCount(data.count);
            break;
          case 'marked_viewed':
            // setCount(0);
            break;
          case 'already_exists':
            break;
          case 'not_found':
            console.warn('Favorites action failed:', data.status);
            break;
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('Favorites WebSocket disconnected');
      };
      
      wsRef.current.onerror = (error) => {
        console.error('Favorites WebSocket error:', error);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [queryClient, setCount, token]);

  const toggleFavorite = (listingId: string, isFavorite: boolean) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    const action = isFavorite ? 'remove' : 'add';
    wsRef.current.send(JSON.stringify({ action, listing_id: listingId }));
    
    // Check count after action
    setTimeout(() => getNewCount(), 100);
  };

  const getNewCount = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'count_new' }));
    }
  };

  const markViewed = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'mark_viewed' }));
    }
  };

  return { toggleFavorite, getNewCount, markViewed };
};