/**
 * Socket Context
 * Provides socket connection state globally
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import socketService from '../services/socketService';
import { useSocket } from '../hooks/useSocket';
import { useSocketRoom } from '../hooks/useSocketRoom';
import { ConnectionStatus } from '../services/socketEvents.types';
import { useAuth } from './AuthContext';

interface SocketContextValue {
    isConnected: boolean;
    connectionStatus: ConnectionStatus;
    connect: () => void;
    disconnect: () => void;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

interface SocketProviderProps {
    children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps): React.ReactElement {
    const { isConnected, connectionStatus, connect, disconnect } = useSocket();
    const { user, isAuthenticated } = useAuth();

    // Auto-join user room when authenticated
    useSocketRoom('user', isAuthenticated && user?.id ? user.id : null);

    // Disconnect on app unmount
    useEffect(() => {
        return () => {
            socketService.disconnect();
        };
    }, []);

    const value: SocketContextValue = {
        isConnected,
        connectionStatus,
        connect,
        disconnect,
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocketContext(): SocketContextValue {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocketContext must be used within a SocketProvider');
    }
    return context;
}

export default SocketContext;
