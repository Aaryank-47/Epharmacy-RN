/**
 * AUTH REDUX SLICE
 * Manages authentication state in Redux store
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { LoginResponsePayload, UserPayload } from '../../api/types';

// ============================================================================
// TYPES
// ============================================================================

export interface AuthState {
  readonly user: UserPayload | null;
  readonly token: string | null;
  readonly refreshToken: string | null;
  readonly lastLoginAt: string | null;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  lastLoginAt: null,
};

// ============================================================================
// SLICE
// ============================================================================

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Set credentials after successful login
     */
    setCredentials: (state, action: PayloadAction<LoginResponsePayload>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken ?? null;
      state.lastLoginAt = new Date().toISOString();
    },

    /**
     * Hydrate auth state from persistent storage
     * Called on app initialization
     */
    hydrate: (
      state,
      action: PayloadAction<{
        token: string;
        user: UserPayload;
      }>
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
    },

    /**
     * Clear all authentication data
     */
    clearSession: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.lastLoginAt = null;
    },
  },
});

export const { setCredentials, clearSession, hydrate } = authSlice.actions;
export default authSlice.reducer;
