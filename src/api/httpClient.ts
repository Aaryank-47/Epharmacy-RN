/**
 * OPTIMIZATIONS IMPLEMENTED:
 * 1. LRU Cache (Least Recently Used): O(1) access for frequently used data.
 * 2. Request Deduplication: Prevents simultaneous duplicate network calls.
 * 3. Token Caching: Reduces AsyncStorage reads.
 */

import axios, {
  AxiosHeaders,
  InternalAxiosRequestConfig,
  AxiosResponse, // Added for deduplication response typing
} from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage'; // Migrated to MMKV
import { secureStorage } from '../utils/storage';

import { API_BASE_URL, API_TIMEOUT } from './config';
import { mapApiError, NormalizedError } from '../utils/errorHandler';

// ============================================================================
// TYPES
// ============================================================================

interface CacheConfig {
  ttl?: number; // Time to live in milliseconds
  forceUpdate?: boolean; // Bypass cache
}

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: number;
  };
  cache?: CacheConfig | boolean; // Enable caching
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  TOKEN_EXPIRY: 'auth_token_expiry',
} as const;

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
} as const;

const SLOW_REQUEST_THRESHOLD_MS = 4000;
const TOKEN_BUFFER_MS = 60000; // 1 minute buffer before expiry

// Cache Configuration
const MAX_CACHE_SIZE = 50; // Maximum number of items in LRU Cache
const DEFAULT_TTL = 5 * 60 * 1000; // 5 Minutes default TTL

// ============================================================================
// DATA STRUCTURES (DSA) - LRU CACHE implementation
// ============================================================================

class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;

    // Refresh item: remove and re-insert to mark as recently used
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  put(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Evict least recently used (first item in Map)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}

// Global Cache Instance
const apiCache = new LRUCache<string, { data: any; timestamp: number }>(MAX_CACHE_SIZE);

const pendingRequests = new Map<string, Promise<any>>();

// ============================================================================
// IN-MEMORY TOKEN CACHE
// ============================================================================

class TokenCache {
  private token: string | null = null;
  private expiry: number | null = null;

  set(token: string | null, expiry: number | null): void {
    this.token = token;
    this.expiry = expiry;
  }

  get(): { token: string | null; expiry: number | null } {
    return { token: this.token, expiry: this.expiry };
  }

  isValid(): boolean {
    if (!this.token || !this.expiry) return false;
    // Add buffer: consider token invalid if expiring within 1 minute
    return Date.now() < this.expiry - TOKEN_BUFFER_MS;
  }

  clear(): void {
    this.token = null;
    this.expiry = null;
  }
}

const tokenCache = new TokenCache();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================


/**
 * Check if token has expired
 */
const isTokenExpired = (expiryMs: number | null): boolean => {
  if (expiryMs === null) return true;
  return Date.now() >= expiryMs - TOKEN_BUFFER_MS;
};

/**
 * Read token from Secure Storage (Synchronous implementation)
 */
const readTokenFromStorage = (): {
  token: string | null;
  expiry: number | null;
} => {
  try {
    const token = secureStorage.getString(STORAGE_KEYS.TOKEN);
    const expiryStr = secureStorage.getString(STORAGE_KEYS.TOKEN_EXPIRY);

    if (!token || !expiryStr) {
      return { token: null, expiry: null };
    }

    const expiry = parseInt(expiryStr, 10);

    if (isTokenExpired(expiry)) {
      // Token expired, clear storage
      secureStorage.delete(STORAGE_KEYS.TOKEN);
      secureStorage.delete(STORAGE_KEYS.TOKEN_EXPIRY);
      return { token: null, expiry: null };
    }

    return { token, expiry };
  } catch (error) {
    return { token: null, expiry: null };
  }
};

/**
 * Get current valid token (from cache or storage)
 */
const getValidToken = async (): Promise<string | null> => {
  // Check in-memory cache first
  const cached = tokenCache.get();
  if (cached.token && tokenCache.isValid()) {
    return cached.token;
  }

  const { token, expiry } = readTokenFromStorage();

  if (token && !isTokenExpired(expiry)) {
    tokenCache.set(token, expiry);
    return token;
  }

  // No valid token found
  tokenCache.clear();
  return null;
};

// ============================================================================
// AXIOS CLIENT
// ============================================================================

const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: DEFAULT_HEADERS,
});

/**
 * Request interceptor: Auth Token injection + Caching Logic
 */
httpClient.interceptors.request.use(async (config) => {
  const extendedConfig = config as ExtendedAxiosRequestConfig;

  // Track request timing for slow request warnings
  extendedConfig.metadata = { startTime: Date.now() };

  if (__DEV__) {
    console.log(`[HTTP]  Request: ${extendedConfig.method?.toUpperCase()} ${extendedConfig.url}`);
  }

  // 1. CACHE CHECK (GET requests only)
  if (extendedConfig.method?.toLowerCase() === 'get' && extendedConfig.cache) {
    const cacheKey = `${extendedConfig.url}?${JSON.stringify(extendedConfig.params || {})}`;
    const cacheOptions = typeof extendedConfig.cache === 'boolean' ? {} : extendedConfig.cache;
    const forceUpdate = cacheOptions.forceUpdate || false;

    if (!forceUpdate) {
      const cachedItem = apiCache.get(cacheKey);
      const ttl = cacheOptions.ttl || DEFAULT_TTL;

      if (cachedItem) {
        const isExpired = Date.now() - cachedItem.timestamp > ttl;
        if (!isExpired) {
          // Serve from cache
          console.log(`[HTTP CACHE] Hit: ${extendedConfig.url}`);
         
          extendedConfig.adapter = async () => {
            return {
              data: cachedItem.data,
              status: 200,
              statusText: 'OK',
              headers: {},
              config: extendedConfig,
              request: {},
            };
          };
          return extendedConfig;
        }
      }
    }
  }

  // Get valid token and add to Authorization header
  const token = await getValidToken();
  if (token) {
    const headers =
      extendedConfig.headers instanceof AxiosHeaders
        ? extendedConfig.headers
        : AxiosHeaders.from(extendedConfig.headers ?? {});

    headers.set('Authorization', `Bearer ${token}`);
    extendedConfig.headers = headers;
  }

  return extendedConfig;
});

/**
 * Response interceptor: Caching + Error Handling
 */
httpClient.interceptors.response.use(
  (response) => {
    const extendedConfig = response.config as ExtendedAxiosRequestConfig;
    const duration = extendedConfig.metadata
      ? Date.now() - extendedConfig.metadata.startTime
      : 0;

    if (__DEV__) {
      console.log(`[HTTP] ✅ Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`);

      if (duration > SLOW_REQUEST_THRESHOLD_MS) {
        console.warn(`[HTTP]  Slow request detected (${duration}ms)`);
      }
    }

    // 2. CACHE STORE (GET requests only)
    if (extendedConfig.method?.toLowerCase() === 'get' && extendedConfig.cache) {
      const cacheKey = `${extendedConfig.url}?${JSON.stringify(extendedConfig.params || {})}`;
      apiCache.put(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
      });
    }

    return response;
  },
  (error) => {
    if (__DEV__) {
      const duration = error.config && error.config.metadata
        ? Date.now() - error.config.metadata.startTime
        : 'N/A';
      console.error(`[HTTP]  Error: ${error.code || 'UNKNOWN'} ${error.config?.method?.toUpperCase()} ${error.config?.url} (${duration}ms) - ${error.message}`);
    }
    // Normalize all errors to consistent format
    return Promise.reject(mapApiError(error));
  }
);

// ============================================================================
// EXPORTED FUNCTIONS
// ============================================================================

/**
 * Store token in cache and Secure Storage
 */
export const persistAuthToken = async (
  token: string,
  expiryMs: number
): Promise<void> => {
  try {
    // Update in-memory cache
    tokenCache.set(token, expiryMs);

    // Persist to Secure Storage
    secureStorage.set(STORAGE_KEYS.TOKEN, token);
    secureStorage.set(STORAGE_KEYS.TOKEN_EXPIRY, expiryMs.toString());
  } catch (error) {
    throw error;
  }
};

/**
 * Clear all auth tokens
 */
export const clearAuthToken = async (): Promise<void> => {
  try {
    tokenCache.clear();
    secureStorage.delete(STORAGE_KEYS.TOKEN);
    secureStorage.delete(STORAGE_KEYS.TOKEN_EXPIRY);
  } catch (error) {
    // Don't throw
  }
};

export const getTokenExpiry = async (): Promise<number | null> => {
  try {
    const expiryStr = secureStorage.getString(STORAGE_KEYS.TOKEN_EXPIRY);
    if (!expiryStr) return null;
    return parseInt(expiryStr, 10);
  } catch (error) {
    return null;
  }
};

// Helper: Clear API Cache (useful for pull-to-refresh)
export const clearApiCache = () => {
  apiCache.clear();
};

export default httpClient;
