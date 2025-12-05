import { useQuery } from '@tanstack/react-query';
import { getRunningAdvertisements } from '../api/medicinesApi';

export const useRunningAdvertisements = () => {
  return useQuery({
    queryKey: ['runningAdvertisements'],
    queryFn: async () => {
      const response = await getRunningAdvertisements();
      
      const data = response.data;
      
      if (data && Array.isArray(data)) {
          return data;
      }
      
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
      if (!query.state.data || (Array.isArray(query.state.data) && query.state.data.length === 0)) {
        return 3000;
      }
      return false;
    },
  });
};
