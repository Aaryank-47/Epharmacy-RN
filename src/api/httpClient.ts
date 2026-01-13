/**
 * HTTP CLIENT WITH JWT INTERCEPTORS
 * Handles token injection, expiry validation, and error normalization
 */

import axios, {
  AxiosHeaders,
  InternalAxiosRequestConfig,
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_BASE_URL, API_TIMEOUT } from './config';
import { mapApiError, NormalizedError } from '../utils/errorHandler';

// ============================================================================
// TYPES
// ============================================================================

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: number;
  };
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
 * Read token from AsyncStorage with expiry validation
 */
const readTokenFromStorage = async (): Promise<{
  token: string | null;
  expiry: number | null;
}> => {
  try {
    const [token, expiryStr] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
      AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY),
    ]);

    if (!token || !expiryStr) {
      return { token: null, expiry: null };
    }

    const expiry = parseInt(expiryStr, 10);

    if (isTokenExpired(expiry)) {
      // Token expired, clear storage
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.TOKEN,
        STORAGE_KEYS.TOKEN_EXPIRY,
      ]);
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

  // Fall back to storage
  const { token, expiry } = await readTokenFromStorage();

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
 * Request interceptor: Add auth token to headers
 */
httpClient.interceptors.request.use(async (config) => {
  const extendedConfig = config as ExtendedAxiosRequestConfig;

  // Track request timing for slow request warnings
  extendedConfig.metadata = { startTime: Date.now() };

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
 * Response interceptor: Log slow requests and normalize errors
 */
httpClient.interceptors.response.use(
  (response) => {
    const extendedConfig = response.config as ExtendedAxiosRequestConfig;
    const duration = extendedConfig.metadata
      ? Date.now() - extendedConfig.metadata.startTime
      : 0;

    if (__DEV__ && duration > SLOW_REQUEST_THRESHOLD_MS) {
      console.warn(`[HTTP] Slow request (${duration}ms): ${response.config.method?.toUpperCase()} ${response.config.url}`);
    }

    return response;
  },
  (error) => {
    // Normalize all errors to consistent format
    return Promise.reject(mapApiError(error));
  }
);

// ============================================================================
// EXPORTED FUNCTIONS
// ============================================================================

/**
 * Store token in cache and AsyncStorage
 */
export const persistAuthToken = async (
  token: string,
  expiryMs: number
): Promise<void> => {
  try {
    // Update in-memory cache
    tokenCache.set(token, expiryMs);

    // Persist to AsyncStorage
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token),
      AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryMs.toString()),
    ]);
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
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TOKEN,
      STORAGE_KEYS.TOKEN_EXPIRY,
    ]);
  } catch (error) {
    // Don't throw - clear succeeded even if storage failed
  }
};

export const getTokenExpiry = async (): Promise<number | null> => {
  try {
    const expiryStr = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    if (!expiryStr) return null;
    return parseInt(expiryStr, 10);
  } catch (error) {
    return null;
  }
};

export default httpClient;
