import { useQuery } from '@tanstack/react-query';
import { getDealsOfTheDay } from '../api/medicinesApi';

export const useDealsOfTheDay = () => {
  return useQuery({
    queryKey: ['dealsOfTheDay'],
    queryFn: async () => {
      const response = await getDealsOfTheDay();
      
      // Robust data extraction
      const data = response.data;
      
      if (data && Array.isArray(data)) {
          return data;
      }
      
      // Handle nested data structure if present (common in this API)
      if (data && typeof data === 'object' && 'data' in data) {
           const innerData = (data as any).data;
           if (Array.isArray(innerData)) return innerData;
      }

      return [];
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
    retry: true,
    retryDelay: 3000,
    refetchInterval: (query) => {
      // Poll if no data found yet
      if (!query.state.data || (Array.isArray(query.state.data) && query.state.data.length === 0)) {
        return 3000;
      }
      return false;
    },
  });
};
