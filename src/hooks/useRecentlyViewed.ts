import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRecentlyViewedItems, getRecentlyViewedCategories, addItemToRecentlyViewed, addCategoryToRecentlyViewed } from '../api/medicinesApi';

export const RECENTLY_VIEWED_ITEMS_KEY = ['recentlyViewedItems'];
export const RECENTLY_VIEWED_CATEGORIES_KEY = ['recentlyViewedCategories'];

export const useRecentlyViewedItems = () => {
    return useQuery({
        queryKey: RECENTLY_VIEWED_ITEMS_KEY,
        queryFn: async () => {
            const response = await getRecentlyViewedItems();
            return response.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useRecentlyViewedCategories = () => {
    return useQuery({
        queryKey: RECENTLY_VIEWED_CATEGORIES_KEY,
        queryFn: async () => {
            const response = await getRecentlyViewedCategories();
            return response.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useAddToRecentlyViewedItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (itemId: string) => {
            return await addItemToRecentlyViewed(itemId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: RECENTLY_VIEWED_ITEMS_KEY });
        },
    });
};

export const useAddToRecentlyViewedCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (categoryId: string) => {
            return await addCategoryToRecentlyViewed(categoryId);
        },
        onSuccess: () => {
            // Invalidate and immediately refetch for real-time UI update
            queryClient.invalidateQueries({ queryKey: RECENTLY_VIEWED_CATEGORIES_KEY });
            queryClient.refetchQueries({ queryKey: RECENTLY_VIEWED_CATEGORIES_KEY });
        },
    });
};
