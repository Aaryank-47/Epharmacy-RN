/**
 * GLOBAL REFRESH CONTROL HOOK
 * Manage refresh state, API calls, and data reloading
 */

import { useState, useCallback, useRef } from 'react';

interface RefreshConfig {
  /**
   * Array of async functions (API calls) to refresh
   * Iska matlab: jis jis API ko call karna hai, us sab ko pass kro
   */
  onRefresh: (() => Promise<void>)[];
  
  /**
   * Minimum time refreshing dikhana hai (ms)
   * Default: 1000ms (1 second)
   */
  minRefreshTime?: number;
}

interface UseRefreshControlReturn {
  /** Is refreshing? */
  isRefreshing: boolean;
  
  /** Refresh function to trigger */
  handleRefresh: () => Promise<void>;
  
  /** Manual way to set loading */
  setIsRefreshing: (value: boolean) => void;
}

export const useRefreshControl = ({
  onRefresh,
  minRefreshTime = 1000,
}: RefreshConfig): UseRefreshControlReturn => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshStartTime = useRef<number>(0);

  const handleRefresh = useCallback(async () => {
    // Agar pehle se refresh ho raha hai to return kar do
    if (isRefreshing) return;

    setIsRefreshing(true);
    refreshStartTime.current = Date.now();

    try {
      // Sab API calls ko parallel mein run karo (Promise.all)
      // Iska matlab: sab ek saath execute hoge, faster hoga
      if (onRefresh && onRefresh.length > 0) {
        await Promise.all(onRefresh.map(fn => fn().catch(err => {
          // Individual API fail ho to baki sab chale
          return null;
        })));
      }

      // Minimum refresh time wait karo
      // Iska matlab: agar 100ms mein complete ho gaya to 900ms aur wait karega
      // Smooth animation dikhega
      const elapsedTime = Date.now() - refreshStartTime.current;
      if (elapsedTime < minRefreshTime) {
        await new Promise<void>((resolve) => 
          setTimeout(resolve, minRefreshTime - elapsedTime)
        );
      }
    } catch (error) {
      } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, minRefreshTime, onRefresh]);

  return {
    isRefreshing,
    handleRefresh,
    setIsRefreshing,
  };
};

export type { RefreshConfig, UseRefreshControlReturn };
