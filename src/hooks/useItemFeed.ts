import { useQuery } from '@tanstack/react-query';
import { getItemFeed } from '../api/medicinesApi';

export const useItemFeed = () => {
    return useQuery({
        queryKey: ['itemFeed'],
        queryFn: async () => {
            const response = await getItemFeed();

            // Robust data extraction
            const data = response.data;

            if (data && Array.isArray(data.data)) {
                return data.data;
            }

            // Handle nested data structure backup
            if (Array.isArray(data)) {
                return data;
            }

            return [];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes for feed data
        gcTime: 1000 * 60 * 10, // 10 minutes cache
        retry: 2,
        retryDelay: 2000,
        refetchOnWindowFocus: false,
    });
};
