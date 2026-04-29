/**
 * ============================================================================
 * FEATURE FLAGS SERVICE
 * ============================================================================
 * 
 * Handles fetching and caching feature flags from backend
 * 
 * Backend Contract:
 * GET /api/v1/features → { success: true, data: { FLAG_NAME: boolean } }
 * 
 * ============================================================================
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../api/config';
import httpClient from '../api/httpClient';

// ============================================================================
// TYPES
// ============================================================================

export type FeatureFlags = Record<string, boolean>;

interface FeatureFlagResponse {
  success: boolean;
  data: FeatureFlags;
}

interface CachedFlags {
  data: FeatureFlags;
  timestamp: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = '@feature_flags_cache';
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

// ============================================================================
// SERVICE
// ============================================================================

class FeatureFlagsService {
  /**
   * Fetch feature flags from API
   */
  async fetchFromAPI(): Promise<FeatureFlags> {
    try {
      const response = await httpClient.get<FeatureFlagResponse>(
        `${API_BASE_URL}/api/v1/features`
      );
      return response.data?.data || {};
    } catch (error) {
      console.error('[FeatureFlags] API fetch failed:', error);
      return {}; // Graceful fallback
    }
  }

  /**
   * Load flags from AsyncStorage cache
   */
  async loadFromCache(): Promise<FeatureFlags | null> {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (!cached) return null;

      const parsed: CachedFlags = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is still valid
      if (now - parsed.timestamp < CACHE_DURATION) {
        return parsed.data;
      }

      return null; // Cache expired
    } catch (error) {
      console.error('[FeatureFlags] Cache read failed:', error);
      return null;
    }
  }

  /**
   * Save flags to AsyncStorage cache
   */
  async saveToCache(flags: FeatureFlags): Promise<void> {
    try {
      const cached: CachedFlags = {
        data: flags,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
    } catch (error) {
      console.error('[FeatureFlags] Cache write failed:', error);
    }
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('[FeatureFlags] Cache clear failed:', error);
    }
  }

  /**
   * Get flags (cache-first strategy)
   */
  async getFlags(): Promise<FeatureFlags> {
    // Try cache first
    const cached = await this.loadFromCache();
    if (cached) {
      console.log('[FeatureFlags] Loaded from cache');
      return cached;
    }

    // Fetch from API
    console.log('[FeatureFlags] Fetching from API');
    const flags = await this.fetchFromAPI();
    await this.saveToCache(flags);
    return flags;
  }

  /**
   * Force refresh from API (bypass cache)
   */
  async refresh(): Promise<FeatureFlags> {
    const flags = await this.fetchFromAPI();
    await this.saveToCache(flags);
    return flags;
  }
}

// Export singleton instance
export const featureFlagsService = new FeatureFlagsService();
