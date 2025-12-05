import { useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient';

export interface UserStats {
  total_ads: number;
  our_apartments: number;
  conversion: number;
}

export const statsService = {
  getUserStats: async (userId: string, startDate: string, endDate: string): Promise<UserStats> => {
    const response = await apiClient.get(`/stats/${userId}`, {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  }
};

export const useUserStats = (userId: string | undefined, startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['user-stats', userId, startDate, endDate],
    queryFn: () => statsService.getUserStats(userId!, startDate, endDate),
    enabled: !!userId,
  });
};
