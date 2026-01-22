/**
 * Socket Service - Singleton Pattern
 * Manages WebSocket connection with Socket.IO
 */

import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../api/config';
import { SOCKET_EVENTS, ConnectionStatus } from './socketEvents.types';

type EventCallback = (...args: any[]) => void;

class SocketService {
    private static instance: SocketService;
    private socket: Socket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private listeners: Map<string, Set<EventCallback>> = new Map();
    private connectionStatus: ConnectionStatus = 'disconnected';
    private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
    private currentUserId: string | null = null;
    private currentCategoryId: string | null = null;

    private constructor() { }

    static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    /**
     * Connect to WebSocket server
     */
    connect(): void {
        if (this.socket?.connected) {
            console.log('[Socket] Already connected');
            return;
        }

        this.setStatus('connecting');

        this.socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 3000,        // 3 seconds initial delay
            reconnectionDelayMax: 4000,     // Max 4 seconds between retries
            reconnectionAttempts: Infinity, // Infinite retry attempts
            timeout: 20000,
            autoConnect: true,
        });

        this.setupConnectionListeners();
    }

    /**
     * Setup connection event listeners
     */
    private setupConnectionListeners(): void {
        if (!this.socket) return;

        this.socket.on(SOCKET_EVENTS.CONNECT, () => {
            console.log('[Socket] Connected successfully');
            this.reconnectAttempts = 0;
            this.setStatus('connected');

            // Rejoin rooms if user was connected
            if (this.currentUserId) {
                this.joinUserRoom(this.currentUserId);
            }
            if (this.currentCategoryId) {
                this.joinCategoryRoom(this.currentCategoryId);
            }
        });

        this.socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
            console.log('[Socket] Disconnected:', reason);
            this.setStatus('disconnected');
        });

        this.socket.on(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
            console.error('[Socket] Connection error:', error.message);
            this.reconnectAttempts++;
            console.log(`[Socket] Reconnect attempt #${this.reconnectAttempts} - Retrying in 3-4s...`);
            this.setStatus('connecting');
        });

        // Forward all events to registered listeners
        this.socket.onAny((event, ...args) => {
            const callbacks = this.listeners.get(event);
            if (callbacks) {
                callbacks.forEach(cb => {
                    try {
                        cb(...args);
                    } catch (error) {
                        console.error(`[Socket] Error in callback for ${event}:`, error);
                    }
                });
            }
        });
    }

    /**
     * Disconnect from server
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.setStatus('disconnected');
            this.currentUserId = null;
            this.currentCategoryId = null;
            console.log('[Socket] Disconnected manually');
        }
    }

    /**
     * Emit event to server
     */
    emit(event: string, data?: any): void {
        if (!this.socket?.connected) {
            console.warn('[Socket] Cannot emit - not connected');
            return;
        }
        this.socket.emit(event, data);
    }

    /**
     * Subscribe to event
     */
    on(event: string, callback: EventCallback): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);
    }

    /**
     * Unsubscribe from event
     */
    off(event: string, callback?: EventCallback): void {
        if (!callback) {
            this.listeners.delete(event);
            return;
        }
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.delete(callback);
            if (callbacks.size === 0) {
                this.listeners.delete(event);
            }
        }
    }

    /**
     * Join user-specific room
     */
    joinUserRoom(userId: string): void {
        this.currentUserId = userId;
        this.emit(SOCKET_EVENTS.JOIN_USER, userId);
        console.log('[Socket] Joined user room:', userId);
    }

    /**
     * Leave user room
     */
    leaveUserRoom(userId: string): void {
        this.emit(SOCKET_EVENTS.LEAVE_USER, userId);
        this.currentUserId = null;
        console.log('[Socket] Left user room:', userId);
    }

    /**
     * Join category room
     */
    joinCategoryRoom(categoryId: string): void {
        this.currentCategoryId = categoryId;
        this.emit(SOCKET_EVENTS.JOIN_CATEGORY, categoryId);
        console.log('[Socket] Joined category room:', categoryId);
    }

    /**
     * Leave category room
     */
    leaveCategoryRoom(categoryId: string): void {
        this.emit(SOCKET_EVENTS.LEAVE_CATEGORY, categoryId);
        this.currentCategoryId = null;
        console.log('[Socket] Left category room:', categoryId);
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.socket?.connected ?? false;
    }

    /**
     * Get connection status
     */
    getStatus(): ConnectionStatus {
        return this.connectionStatus;
    }

    /**
     * Subscribe to status changes
     */
    onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
        this.statusListeners.add(callback);
        // Immediately call with current status
        callback(this.connectionStatus);

        return () => {
            this.statusListeners.delete(callback);
        };
    }

    /**
     * Set status and notify listeners
     */
    private setStatus(status: ConnectionStatus): void {
        this.connectionStatus = status;
        this.statusListeners.forEach(cb => cb(status));
    }
}

// Export singleton instance
export const socketService = SocketService.getInstance();
export default socketService;
