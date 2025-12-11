import { useQuery } from '@tanstack/react-query';
import { getTrendingMedicines } from '../api/medicinesApi';

export const useTrendingProducts = () => {
  return useQuery({
    queryKey: ['trendingProducts'],
    queryFn: async () => {
      const response = await getTrendingMedicines();
      
      // Robust data extraction
      const data = response.data;
      
      if (data && Array.isArray(data)) {
        return data;
      }
      
      // Handle nested data structure
      if (data && typeof data === 'object' && 'data' in data) {
        const innerData = (data as any).data;
        if (Array.isArray(innerData)) return innerData;
      }

      return [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes for AI data
    gcTime: 1000 * 60 * 30, // 30 minutes cache
    retry: 2,
    retryDelay: 2000,
    refetchInterval: (query) => {
      // Poll if no data found yet
      if (!query.state.data || (Array.isArray(query.state.data) && query.state.data.length === 0)) {
        return 3000;
      }
      return false;
    },
  });
};
