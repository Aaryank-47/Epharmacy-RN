/**
 * ADVANCED REFRESH CONTROL HOOK
 * Features:
 * - Manual pull-to-refresh
 * - Auto-refresh on intervals
 * - Background refresh
 * - Error handling with retry
 * - Request deduplication
 */

import { useEffect, useCallback, useRef, useState } from 'react';

interface AdvancedRefreshConfig {
  /** Array of async functions to refresh */
  onRefresh: (() => Promise<void>)[];

  /** Auto-refresh interval in ms (optional) */
  autoRefreshInterval?: number;

  /** Enable/disable auto-refresh */
  enableAutoRefresh?: boolean;

  /** Retry count on failure */
  retryCount?: number;

  /** Delay between retries in ms */
  retryDelay?: number;

  /** Minimum refresh time in ms */
  minRefreshTime?: number;

  /** Callback when refresh completes */
  onRefreshComplete?: (success: boolean) => void;

  /** Callback on error */
  onError?: (error: Error) => void;
}

interface AdvancedRefreshControlReturn {
  isRefreshing: boolean;
  lastRefreshedAt: Date | null;
  isError: boolean;
  errorMessage: string | null;
  handleRefresh: () => Promise<void>;
  forceRefresh: () => Promise<void>;
  clearError: () => void;
}


export const useAdvancedRefreshControl = ({
  onRefresh,
  autoRefreshInterval = 30000,
  enableAutoRefresh = false,
  retryCount = 2,
  retryDelay = 1000,
  minRefreshTime = 1000,
  onRefreshComplete,
  onError,
}: AdvancedRefreshConfig): AdvancedRefreshControlReturn => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshStartTime = useRef<number>(0);
  const autoRefreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRefreshingRef = useRef(false); // Duplicate requests prevent karne ke liye

  /**
   * Retry logic for failed API calls
   */
  const callWithRetry = useCallback(
    async (fn: () => Promise<void>, attempt = 1): Promise<void> => {
      try {
        await fn();
      } catch (error) {
        if (attempt < retryCount) {
          await new Promise<void>((resolve) => setTimeout(resolve, retryDelay));
          return callWithRetry(fn, attempt + 1);
        }
        throw error;
      }
    },
    [retryCount, retryDelay]
  );

  /**
   * Main refresh function
   */
  const handleRefresh = useCallback(async () => {
    // Agar pehle se refresh ho raha hai to duplicate request prevent karo
    if (isRefreshingRef.current) return;

    isRefreshingRef.current = true;
    setIsRefreshing(true);
    setIsError(false);
    setErrorMessage(null);
    refreshStartTime.current = Date.now();

    try {
      // Sab API calls ko retry logic ke saath run karo
      const promises = onRefresh.map(fn =>
        callWithRetry(fn).catch(err => {
          setErrorMessage(err.message || 'Refresh failed');
          setIsError(true);
          onError?.(err);
          return null;
        })
      );

      await Promise.all(promises);

      // Minimum refresh time wait karo
      const elapsedTime = Date.now() - refreshStartTime.current;
      if (elapsedTime < minRefreshTime) {
        await new Promise<void>((resolve) =>
          setTimeout(resolve, minRefreshTime - elapsedTime)
        );
      }

      setLastRefreshedAt(new Date());
      onRefreshComplete?.(true);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(errorMsg);
      setIsError(true);
      onError?.(error instanceof Error ? error : new Error(errorMsg));
      onRefreshComplete?.(false);
    } finally {
      setIsRefreshing(false);
      isRefreshingRef.current = false;
    }
  }, [callWithRetry, minRefreshTime, onError, onRefresh, onRefreshComplete]);

  /**
   * Force refresh (bypass duplicate check)
   */
  const forceRefresh = useCallback(async () => {
    isRefreshingRef.current = false; // Reset the lock
    return handleRefresh();
  }, [handleRefresh]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setIsError(false);
    setErrorMessage(null);
  }, []);

  /**
   * Auto-refresh setup
   */
  useEffect(() => {
    if (!enableAutoRefresh) return;

    // Initial refresh
    handleRefresh();

    // Set up interval
    autoRefreshTimer.current = setInterval(() => {
      handleRefresh();
    }, autoRefreshInterval);

    return () => {
      if (autoRefreshTimer.current) {
        clearInterval(autoRefreshTimer.current);
      }
    };
  }, [enableAutoRefresh, autoRefreshInterval, handleRefresh]);

  return {
    isRefreshing,
    lastRefreshedAt,
    isError,
    errorMessage,
    handleRefresh,
    forceRefresh,
    clearError,
  };
};

export type { AdvancedRefreshConfig, AdvancedRefreshControlReturn };
