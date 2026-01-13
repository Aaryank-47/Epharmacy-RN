import { useQuery } from '@tanstack/react-query';
import { getFeaturedMedicines } from '../api/medicinesApi';

export const useFeaturedMedicines = () => {
    return useQuery({
        queryKey: ['featuredMedicines'],
        queryFn: async () => {
            const response = await getFeaturedMedicines();

            const data = response.data;

            // Handle various response structures
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
        gcTime: 1000 * 60 * 60, // 1 hour
        retry: 2,
        retryDelay: 1000,
    });
};
