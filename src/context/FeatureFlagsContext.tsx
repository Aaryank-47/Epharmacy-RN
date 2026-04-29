/**
 * ============================================================================
 * FEATURE FLAGS CONTEXT
 * ============================================================================
 * 
 * Global state management for feature flags
 * 
 * Usage:
 * 1. Wrap your app with <FeatureFlagsProvider>
 * 2. Use useFeature(flagKey) hook in components
 * 
 * IMPORTANT:
 * - Frontend only controls UI visibility
 * - Backend handles ALL security
 * - Do NOT protect routes/APIs here
 * 
 * ============================================================================
 */

import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { featureFlagsService, FeatureFlags } from '../services/featureFlagsService';
import { useAppSelector } from '../store/hooks';

// ============================================================================
// CONTEXT TYPE
// ============================================================================

interface FeatureFlagsContextValue {
  /** All feature flags as object { FLAG_NAME: true/false } */
  flags: FeatureFlags;
  
  /** Check if a feature is enabled */
  hasFeature: (flagKey: string) => boolean;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Force refresh flags from API */
  refresh: () => Promise<void>;
}

// ============================================================================
// CONTEXT
// ============================================================================

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | undefined>(
  undefined
);

// ============================================================================
// PROVIDER
// ============================================================================

interface FeatureFlagsProviderProps {
  children: ReactNode;
}

export const FeatureFlagsProvider: React.FC<FeatureFlagsProviderProps> = ({
  children,
}) => {
  const [flags, setFlags] = useState<FeatureFlags>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Watch auth state
  const { token, user } = useAppSelector(state => state.auth);
  const isAuthenticated = !!token && !!user;

  /**
   * Load feature flags
   */
  const loadFlags = useCallback(async () => {
    if (!isAuthenticated) {
      // User logged out - clear flags
      setFlags({});
      await featureFlagsService.clearCache();
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log('[FeatureFlags] Loading flags for user:', {
        userId: user?.id,
        role: user?.role,
        email: user?.email
      });
      
      const fetchedFlags = await featureFlagsService.getFlags();
      
      console.log('[FeatureFlags] Received flags:', fetchedFlags);
      console.log('[FeatureFlags] FEATURED_MEDICINES enabled:', fetchedFlags['FEATURED_MEDICINES']);
      
      setFlags(fetchedFlags);
    } catch (error) {
      console.error('[FeatureFlags] Load error:', error);
      setFlags({});
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  /**
   * Force refresh from API
   */
  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const fetchedFlags = await featureFlagsService.refresh();
      setFlags(fetchedFlags);
    } catch (error) {
      console.error('[FeatureFlags] Refresh error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Check if feature is enabled
   */
  const hasFeature = useCallback(
    (flagKey: string): boolean => {
      const normalizedKey = flagKey.toUpperCase().trim();
      return flags[normalizedKey] === true;
    },
    [flags]
  );

  // Load flags when auth state changes
  useEffect(() => {
    loadFlags();
  }, [loadFlags]);

  const value = useMemo(
    () => ({
      flags,
      hasFeature,
      isLoading,
      refresh,
    }),
    [flags, hasFeature, isLoading, refresh]
  );

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Access all feature flags
 * 
 * @example
 * const { hasFeature, flags, isLoading, refresh } = useFeatureFlags();
 */
export const useFeatureFlags = (): FeatureFlagsContextValue => {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within FeatureFlagsProvider');
  }
  return context;
};
