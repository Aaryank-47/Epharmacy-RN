import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../api/medicinesApi';

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await getCategories();
      
      const data = response.data;
      
      if (data && Array.isArray(data)) {
          return data;
      }
      
      if (data && typeof data === 'object' && 'categories' in data && Array.isArray((data as any).categories)) {
          return (data as any).categories;
      }
      
       if (data && typeof data === 'object' && 'data' in data) {
           const innerData = (data as any).data;
           if (Array.isArray(innerData)) return innerData;
           if (typeof innerData === 'object' && 'categories' in innerData && Array.isArray(innerData.categories)) {
               return innerData.categories;
           }
       }

      return [];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: true, // Retry indefinitely on error
    retryDelay: 3000, // Retry every 3 seconds
    refetchInterval: (query) => {
      // If no data or empty array, poll every 3 seconds
      if (!query.state.data || (Array.isArray(query.state.data) && query.state.data.length === 0)) {
        return 3000;
      }
      return false; // Stop polling once data is found
    },
  });
};
