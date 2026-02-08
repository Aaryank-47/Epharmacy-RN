import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useUserProfile, USER_PROFILE_KEY } from './useUserProfile';
import { RECENTLY_VIEWED_ITEMS_KEY, RECENTLY_VIEWED_CATEGORIES_KEY } from './useRecentlyViewed';
import { notificationService } from '../services/notificationService';
import { useThemePalette } from './useThemePalette';
import { UserProfilePayload } from '../api/types';

export const useProfilePageUI = () => {
    const { logout } = useAuth();
    const { isDark, statusBarStyle } = useThemePalette();
    const queryClient = useQueryClient();

    // UI State
    const [personalDetailsExpanded, setPersonalDetailsExpanded] = useState<boolean>(true);
    const [privacyTermsExpanded, setPrivacyTermsExpanded] = useState<boolean>(false);
    const [isManualRefreshing, setIsManualRefreshing] = useState<boolean>(false);
    const [refreshKey, setRefreshKey] = useState<number>(0);

    // Data Fetching
    const { data: apiData, isLoading, isError, error, refetch, isRefetching } = useUserProfile();

    const userData: UserProfilePayload = useMemo(() => {
        if (!apiData) return {
            id: '',
            name: '',
            email: '',
            phone: '',
            age: null,
            dob: null,
            role: '',
            address: {},
            profileImage: [],
            wishlistCount: 0,
            viewedItemsCount: 0,
            itemsPurchasedCount: 0,
            lastLogin: null,
            fcmToken: null,
        };

        return {
            id: apiData.id || '',
            name: apiData.name,
            email: apiData.email,
            phone: apiData.phone,
            age: apiData.age,
            dob: apiData.dob,
            role: apiData.role,
            address: apiData.address,
            profileImage: apiData.profileImage,
            wishlistCount: apiData.wishlistCount,
            viewedItemsCount: apiData.viewedItemsCount,
            itemsPurchasedCount: apiData.itemsPurchasedCount,
            lastLogin: apiData.lastLogin,
            fcmToken: apiData.fcmToken,
        };
    }, [apiData]);

    // Helpers
    const formatAge = useCallback((age: number | null, dob: string | null): string => {
        if (age) return `${age} Years`;
        if (dob) {
            const birthDate = new Date(dob);
            const today = new Date();
            const calculatedAge = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
            return `${calculatedAge} Years`;
        }
        return 'Not specified';
    }, []);

    const formatAddress = useCallback((address: Record<string, any>): string => {
        if (!address || Object.keys(address).length === 0) return 'Not specified';
        const parts: string[] = [];
        if (address.street) parts.push(address.street);
        if (address.city) parts.push(address.city);
        if (address.state) parts.push(address.state);
        if (address.country) parts.push(address.country);
        return parts.join(', ') || 'Not specified';
    }, []);

    // Handlers
    const handleRefresh = useCallback(async (): Promise<void> => {
        setIsManualRefreshing(true);
        try {
            // Invalidate all related queries to force hard refresh of ALL components
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: USER_PROFILE_KEY }),
                queryClient.invalidateQueries({ queryKey: RECENTLY_VIEWED_ITEMS_KEY }),
                queryClient.invalidateQueries({ queryKey: RECENTLY_VIEWED_CATEGORIES_KEY }),
                // Artificial minimum delay for consistent UX (skeletons visibility)
                new Promise<void>((resolve) => setTimeout(() => resolve(), 2000))
            ]);
            setRefreshKey(prev => prev + 1);
        } finally {
            setIsManualRefreshing(false);
        }
    }, [queryClient]);


    const handleLogout = useCallback((): void => {
        Alert.alert(
            ' Secure Logout',
            'You are about to sign out of your MEDICARE+ account. Your session will be terminated securely.\n\nAre you sure you want to continue?',
            [
                { text: 'Stay Logged In', style: 'cancel' },
                {
                    text: 'Logout Safely',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // 1. Delete Link Token
                            await notificationService.deleteToken();

                            // 2. Clear React Query Cache (CRITICAL for removing old user data)
                            queryClient.removeQueries({ queryKey: USER_PROFILE_KEY });
                            queryClient.removeQueries({ queryKey: RECENTLY_VIEWED_ITEMS_KEY });
                            queryClient.removeQueries({ queryKey: RECENTLY_VIEWED_CATEGORIES_KEY });

                            // 3. Clear Session
                            await logout();
                        } catch (error) {
                            console.error('Logout failed', error);
                            // Ensure logout happens even if other cleanups fail
                            logout();
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    }, [logout, queryClient]);

    const togglePersonalDetails = useCallback(() => {
        setPersonalDetailsExpanded(prev => !prev);
    }, []);

    const togglePrivacyTerms = useCallback(() => {
        setPrivacyTermsExpanded(prev => !prev);
    }, []);

    const contactItems = useMemo(() => [
        { icon: 'email-outline', text: userData.email || 'Not specified' },
        { icon: 'phone-outline', text: userData.phone || 'Not specified' },
        { icon: 'map-marker-outline', text: formatAddress(userData.address) },
        { icon: 'cake-variant', text: formatAge(userData.age, userData.dob) },
        { icon: 'crown-outline', text: `Role: ${userData.role || 'User'}` },
    ], [userData, formatAddress, formatAge]);

    return {
        // State
        userData,
        isDark,
        statusBarStyle,
        personalDetailsExpanded,
        privacyTermsExpanded,
        isManualRefreshing,
        refreshKey,
        isLoading: isLoading || isManualRefreshing,
        isRefetching,
        isError,
        error,

        // Handlers
        refetch,
        handleRefresh,
        handleLogout,
        togglePersonalDetails,
        togglePrivacyTerms,
        contactItems,
    };
};
