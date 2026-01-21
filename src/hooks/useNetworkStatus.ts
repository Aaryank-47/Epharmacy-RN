/**
 * useNetworkStatus Hook
 * Monitors internet connectivity status
 */

import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const useNetworkStatus = () => {
    const [isConnected, setIsConnected] = useState<boolean | null>(true);
    const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);

    useEffect(() => {
        // Subscribe to network state updates
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsConnected(state.isConnected);
            setIsInternetReachable(state.isInternetReachable);
        });

        // Cleanup subscription
        return () => unsubscribe();
    }, []);

    const checkConnection = async (): Promise<boolean> => {
        const state = await NetInfo.fetch();
        setIsConnected(state.isConnected);
        setIsInternetReachable(state.isInternetReachable);
        return state.isConnected === true && state.isInternetReachable !== false;
    };

    // Consider offline if either isConnected is false OR isInternetReachable is explicitly false
    const isOffline = isConnected === false || isInternetReachable === false;

    return {
        isConnected,
        isInternetReachable,
        isOffline,
        checkConnection,
    };
};

export default useNetworkStatus;
