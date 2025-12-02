/**
 * REFRESH CONTROL UTILITIES
 * Helper functions for refresh control
 */

interface RefreshOptions {
  minTime?: number;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Create a batched API call that runs multiple requests in parallel
 */
export const createBatchedRefresh = (
  apiCalls: (() => Promise<any>)[],
  options: RefreshOptions = {}
) => {
  const { minTime = 1000, maxRetries = 1, retryDelay = 500 } = options;

  return async () => {
    const startTime = Date.now();

    try {
      await Promise.allSettled(
        apiCalls.map(async (call) => {
          let attempts = 0;
          while (attempts < maxRetries) {
            try {
              return await call();
            } catch (error) {
              attempts++;
              if (attempts < maxRetries) {
                await new Promise<void>((resolve) => setTimeout(resolve, retryDelay));
              } else {
                throw error;
              }
            }
          }
        })
      );

      const elapsed = Date.now() - startTime;
      if (elapsed < minTime) {
        await new Promise<void>((resolve) => setTimeout(resolve, minTime - elapsed));
      }
    } catch (error) {
      console.error('[RefreshControl] Batch refresh failed:', error);
      throw error;
    }
  };
};

/**
 * Create a debounced refresh function
 */
export const createDebouncedRefresh = (
  refreshFn: () => Promise<void>,
  debounceMs: number = 1000
) => {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let isRefreshing = false;

  return async () => {
    if (timeout) clearTimeout(timeout);

    if (isRefreshing) return;

    timeout = setTimeout(async () => {
      isRefreshing = true;
      try {
        await refreshFn();
      } finally {
        isRefreshing = false;
      }
    }, debounceMs);
  };
};

/**
 * Create a throttled refresh function
 */
export const createThrottledRefresh = (
  refreshFn: () => Promise<void>,
  throttleMs: number = 5000
) => {
  let lastRefreshTime = 0;
  let isRefreshing = false;

  return async () => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime;

    if (timeSinceLastRefresh < throttleMs || isRefreshing) {
      return;
    }

    isRefreshing = true;
    lastRefreshTime = now;

    try {
      await refreshFn();
    } finally {
      isRefreshing = false;
    }
  };
};

/**
 * Retry a function with exponential backoff
 */
export const retryWithBackoff = async <T,>(
  fn: () => Promise<T>,
  {
    maxAttempts = 3,
    initialDelay = 500,
    maxDelay = 5000,
  }: {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
  } = {}
): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts - 1) {
        const delay = Math.min(
          initialDelay * Math.pow(2, attempt),
          maxDelay
        );
        await new Promise<void>((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Retry failed');
};

/**
 * Create a sequential refresh function
 */
export const createSequentialRefresh = (
  apiCalls: (() => Promise<any>)[],
  options: RefreshOptions = {}
) => {
  const { minTime = 1000 } = options;

  return async () => {
    const startTime = Date.now();

    try {
      for (const call of apiCalls) {
        try {
          await call();
        } catch (error) {
          console.error('[RefreshControl] Sequential call failed:', error);
        }
      }

      const elapsed = Date.now() - startTime;
      if (elapsed < minTime) {
        await new Promise<void>((resolve) => setTimeout(resolve, minTime - elapsed));
      }
    } catch (error) {
      console.error('[RefreshControl] Sequential refresh failed:', error);
      throw error;
    }
  };
};

/**
 * Calculate time since last refresh
 */
export const getTimeSinceRefresh = (date: Date | null): string => {
  if (!date) return 'Never';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 30) return 'Just now';
  if (diffMins < 1) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

/**
 * Check if enough time has passed to allow refresh
 */
export const canRefresh = (
  lastRefreshTime: Date | null,
  cooldownMs: number = 5000
): boolean => {
  if (!lastRefreshTime) return true;

  const now = new Date();
  const timeSinceLastRefresh = now.getTime() - lastRefreshTime.getTime();

  return timeSinceLastRefresh >= cooldownMs;
};
