import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserProfile, updateUserProfile } from '../api/authApi';
import { UserProfilePayload, UpdateProfilePayload } from '../api/types';

export const USER_PROFILE_KEY = ['userProfile'];

export const useUserProfile = () => {
    return useQuery({
        queryKey: USER_PROFILE_KEY,
        queryFn: async () => {
            const response = await getUserProfile();

            if (!response.success || !response.data) {
                throw new Error(response.message || 'Failed to load profile');
            }

            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
};

export const useUpdateUserProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ data, hasFile }: { data: FormData | UpdateProfilePayload, hasFile?: boolean }) => {
            const response = await updateUserProfile(data, hasFile);
            if (!response.success) {
                throw new Error(response.message || 'Failed to update profile');
            }
            return response.data;
        },
        onSuccess: () => {
            // Invalidate and refetch user profile
            queryClient.invalidateQueries({ queryKey: USER_PROFILE_KEY });
        },
    });
};
