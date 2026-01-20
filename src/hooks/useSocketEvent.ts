/**
 * useSocketEvent Hook
 * Subscribe to specific socket events with auto-cleanup
 */

import { useEffect, useRef, useCallback } from 'react';
import socketService from '../services/socketService';


export function useSocketEvent<T = unknown>(
    event: string,
    callback: (data: T) => void,
    enabled: boolean = true
): void {
    // Use ref to store latest callback without triggering re-subscription
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    // Stable callback that always calls latest ref
    const stableCallback = useCallback((data: T) => {
        callbackRef.current(data);
    }, []);

    useEffect(() => {
        if (!enabled) return;

        socketService.on(event, stableCallback);

        return () => {
            socketService.off(event, stableCallback);
        };
    }, [event, stableCallback, enabled]);
}

export default useSocketEvent;
