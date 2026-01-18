import { useQuery } from '@tanstack/react-query';
import { getDealsOfTheDay, DealsOfTheDayResponse } from '../api/medicinesApi';

export const useDealsOfTheDay = () => {
  return useQuery<DealsOfTheDayResponse>({
    queryKey: ['dealsOfTheDay'],
    queryFn: async () => {
      const response = await getDealsOfTheDay();
      const data = response.data;

      if (Array.isArray(data)) {
        return {
          deals: data,
          totalDeals: data.length,
          displayedDeals: data.length,
        };
      }

      if (data && typeof data === 'object' && 'deals' in data) {
        return {
          deals: data.deals || [],
          totalDeals: data.totalDeals || 0,
          displayedDeals: data.displayedDeals || 0,
        };
      }

      return { deals: [], totalDeals: 0, displayedDeals: 0 };
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    retry: true,
    retryDelay: 3000,
    refetchInterval: (query) => {
      // Poll if no data found yet
      if (!query.state.data || query.state.data.totalDeals === 0) {
        return 3000;
      }
      return false;
    },
  });
};
