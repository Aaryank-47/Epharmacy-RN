/**
 * useSocket Hook
 * Provides socket connection status and control
 */

import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import socketService from '../services/socketService';
import { ConnectionStatus } from '../services/socketEvents.types';

interface UseSocketReturn {
    isConnected: boolean;
    connectionStatus: ConnectionStatus;
    connect: () => void;
    disconnect: () => void;
}

export function useSocket(): UseSocketReturn {
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
        socketService.getStatus()
    );

    useEffect(() => {
        // Subscribe to status changes
        const unsubscribe = socketService.onStatusChange(setConnectionStatus);

        // Connect if not already connected
        if (!socketService.isConnected()) {
            socketService.connect();
        }

        // Handle app state changes - reconnect when returning from background
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                // Reconnect if disconnected when app comes to foreground
                if (!socketService.isConnected()) {
                    console.log('[useSocket] App active - reconnecting socket');
                    socketService.connect();
                }
            }
        });

        return () => {
            unsubscribe();
            subscription.remove();
        };
    }, []);

    const connect = useCallback(() => {
        socketService.connect();
    }, []);

    const disconnect = useCallback(() => {
        socketService.disconnect();
    }, []);

    return {
        isConnected: connectionStatus === 'connected',
        connectionStatus,
        connect,
        disconnect,
    };
}

export default useSocket;
