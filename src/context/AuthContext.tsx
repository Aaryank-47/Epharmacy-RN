/**
 * AUTHENTICATION CONTEXT
 * Centralized auth state management with persistent storage
 * - JWT token lifecycle management
 * - AsyncStorage persistence
 * - Redux integration
 * - Auto-login on app boot
 */

import React, {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useEffect,
  useState,
  useCallback,
} from 'react';
// import AsyncStorage from '@react-native-async-storage/async-storage'; // Migrated to MMKV
import { secureStorage } from '../utils/storage';
import type { LoginResponsePayload, UserPayload } from '../api/types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  clearSession,
  setCredentials,
  hydrate,
} from '../store/slices/authSlice';
import { persistAuthToken, clearAuthToken } from '../api/httpClient';

// ============================================================================
// TYPES
// ============================================================================

interface AuthContextType {
  readonly user: UserPayload | null;
  readonly token: string | null;
  readonly login: (payload: LoginResponsePayload) => Promise<void>;
  readonly logout: () => Promise<void>;
  readonly isAuthenticated: boolean;
  readonly isInitialized: boolean;
  // readonly 
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'auth_user',
  TOKEN_EXPIRY: 'auth_token_expiry',
} as const;

const AUTH_INIT_DELAY_MS = 10; // Minimal delay for Redux to stabilize

// ============================================================================
// JWT DECODING
// ============================================================================

/**
 * Decode JWT payload to extract exp claim
 * React Native compatible - works on all platforms
 */
const decodeJWT = (
  token: string
): { exp?: number;[key: string]: any } | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    // Add padding if needed
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);

    // Manual base64 decode that works everywhere
    let decoded = '';
    try {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      let output = '';

      for (let i = 0; i < padded.length; i += 4) {
        const a = chars.indexOf(padded[i] || '=');
        const b = chars.indexOf(padded[i + 1] || '=');
        const c = chars.indexOf(padded[i + 2] || '=');
        const d = chars.indexOf(padded[i + 3] || '=');

        if (a === -1 || b === -1) break;

        const bitmap = (a << 18) | (b << 12) | ((c & 0x3f) << 6) | (d & 0x3f);
        output += String.fromCharCode((bitmap >> 16) & 0xff);
        if (c !== 64) output += String.fromCharCode((bitmap >> 8) & 0xff);
        if (d !== 64) output += String.fromCharCode(bitmap & 0xff);
      }

      decoded = output;
    } catch {
      return null;
    }

    // Parse the decoded JSON
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
};

/**
 * Get JWT expiry time in milliseconds
 */
const getTokenExpiryMs = (token: string): number | null => {
  const decoded = decodeJWT(token);
  if (!decoded?.exp) return null;
  return decoded.exp * 1000; // Convert from seconds to milliseconds
};

/**
 * Check if token has expired (with 1 minute buffer)
 */
const isTokenExpired = (expiryMs: number | null): boolean => {
  if (!expiryMs) return true;
  const BUFFER_MS = 60000; // 1 minute
  return Date.now() >= expiryMs - BUFFER_MS;
};

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const token = useAppSelector(state => state.auth.token);
  const [isInitialized, setIsInitialized] = useState(false);



  // ========================================================================
  // INITIALIZATION: Restore session from secure storage (Synchronous)
  // ========================================================================

  useEffect(() => {
    try {
      // Read all auth data synchronously
      const tokenStr = secureStorage.getString(STORAGE_KEYS.TOKEN);
      const userStr = secureStorage.getString(STORAGE_KEYS.USER);
      const expiryStr = secureStorage.getString(STORAGE_KEYS.TOKEN_EXPIRY);

      // No stored auth data - skip hydration
      if (!tokenStr || !userStr || !expiryStr) {
        dispatch(clearSession());
        setIsInitialized(true);
        return;
      }

      // Parse stored data
      const expiryMs = parseInt(expiryStr, 10);

      // Check if token is still valid
      if (isTokenExpired(expiryMs)) {
        // Token expired - clear all storage and logout
        secureStorage.delete(STORAGE_KEYS.TOKEN);
        secureStorage.delete(STORAGE_KEYS.USER);
        secureStorage.delete(STORAGE_KEYS.TOKEN_EXPIRY);
        clearAuthToken();
        dispatch(clearSession());
        setIsInitialized(true);
        return;
      }

      // Token is valid - restore user session
      try {
        const userData = JSON.parse(userStr);
        dispatch(hydrate({ token: tokenStr, user: userData }));
        setIsInitialized(true);
      } catch (parseError) {
        secureStorage.delete(STORAGE_KEYS.TOKEN);
        secureStorage.delete(STORAGE_KEYS.USER);
        secureStorage.delete(STORAGE_KEYS.TOKEN_EXPIRY);
        dispatch(clearSession());
        setIsInitialized(true);
      }
    } catch (error) {
      dispatch(clearSession());
      setIsInitialized(true);
    }
  }, [dispatch]);

  // ========================================================================
  // LOGIN: Store credentials and update Redux
  // ========================================================================

  const login = useCallback(
    async (payload: LoginResponsePayload) => {
      try {
        const expiryMs = getTokenExpiryMs(payload.token);

        if (!expiryMs) {
          throw new Error('Invalid token: no expiry found');
        }

        // Persist credentials to Secure Storage (Synchronous)
        secureStorage.set(STORAGE_KEYS.TOKEN, payload.token);
        secureStorage.set(STORAGE_KEYS.USER, JSON.stringify(payload.user));
        secureStorage.set(STORAGE_KEYS.TOKEN_EXPIRY, expiryMs.toString());

        // Sync token with httpClient cache
        await persistAuthToken(payload.token, expiryMs);

        // Update Redux state
        dispatch(setCredentials(payload));
      } catch (error) {
        throw error;
      }
    },
    [dispatch]
  );

  // ========================================================================
  // LOGOUT: Clear all credentials
  // ========================================================================

  const logout = useCallback(async () => {
    try {
      // Clear Secure Storage
      secureStorage.delete(STORAGE_KEYS.TOKEN);
      secureStorage.delete(STORAGE_KEYS.USER);
      secureStorage.delete(STORAGE_KEYS.TOKEN_EXPIRY);

      // Clear httpClient cache
      await clearAuthToken();

      // Clear Redux state
      dispatch(clearSession());
    } catch (error) {
      // Ensure Redux is cleared even if storage fails
      dispatch(clearSession());
    }
  }, [dispatch]);

  // ========================================================================
  // CONTEXT VALUE
  // ========================================================================

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      login,
      logout,
      isAuthenticated: user !== null && token !== null,
      isInitialized,
    }),
    [user, token, login, logout, isInitialized]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============================================================================
// HOOK
// ============================================================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
