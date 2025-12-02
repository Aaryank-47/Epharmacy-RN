/**
 * AUTHENTICATION API FUNCTIONS
 * Handles login, signup, password reset, and logout
 */

import httpClient from './httpClient';
import { API_ROUTES } from './config';
import type {
  ApiResponse,
  AuthActionResponse,
  ForgotPasswordPayload,
  LoginRequestPayload,
  LoginResponsePayload,
  ResetPasswordPayload,
  VerifyOtpPayload,
  SignUpPayload,
  UserPayload,
} from './types';

// ============================================================================
// RESPONSE NORMALIZATION
// ============================================================================

/**
 * Normalize raw backend user response to standard format
 */
const normalizeUser = (
  rawUser: Record<string, any>
): UserPayload => {
  return {
    id: rawUser._id || rawUser.id,
    name: rawUser.name || '',
    email: rawUser.email || '',
    phone: rawUser.phone || '',
    avatar: rawUser.ProfileImage?.[0] || rawUser.avatar || null,
    role: rawUser.role || 'user',
    createdAt: rawUser.createdAt || new Date().toISOString(),
    updatedAt: rawUser.updatedAt || new Date().toISOString(),
  };
};

/**
 * Normalize login response from backend
 */
const normalizeLoginResponse = (
  response: ApiResponse<any>
): LoginResponsePayload => {
  const { data } = response;
  const { user, token, refreshToken } = data;

  if (!token || !user) {
    throw new Error('Invalid login response: missing token or user data');
  }

  return {
    token,
    refreshToken: refreshToken || null,
    user: normalizeUser(user),
  };
};

// ============================================================================
// AUTH API FUNCTIONS
// ============================================================================

/**
 * Login user with email and password
 * @throws Error if login fails
 */
export const loginRequest = async (
  payload: LoginRequestPayload
): Promise<LoginResponsePayload> => {
  try {
    const response = await httpClient.post<ApiResponse<any>>(
      API_ROUTES.auth.login,
      payload
    );

    return normalizeLoginResponse(response.data);
  } catch (error) {
    console.error('[authApi] Login failed:', error);
    throw error;
  }
};

/**
 * Register new user
 * @throws Error if signup fails
 */
export const signupUser = async (
  payload: SignUpPayload
): Promise<LoginResponsePayload> => {
  try {
    const response = await httpClient.post<ApiResponse<any>>(
      API_ROUTES.auth.signup,
      payload
    );

    return normalizeLoginResponse(response.data);
  } catch (error) {
    console.error('[authApi] Signup failed:', error);
    throw error;
  }
};

/**
 * Logout current user
 * @throws Error if logout fails
 */
export const logoutRequest = async (): Promise<void> => {
  try {
    await httpClient.post(API_ROUTES.auth.logout);
  } catch (error) {
    console.error('[authApi] Logout failed:', error);
    throw error;
  }
};

/**
 * Request password reset via email
 * @throws Error if request fails
 */
export const forgotPasswordRequest = async (
  payload: ForgotPasswordPayload
): Promise<AuthActionResponse> => {
  try {
    const response = await httpClient.post<AuthActionResponse>(
      API_ROUTES.auth.forgotPassword,
      payload
    );
    return response.data;
  } catch (error) {
    console.error('[authApi] Forgot password request failed:', error);
    throw error;
  }
};

/**
 * Verify OTP sent to email
 * @throws Error if verification fails
 */
export const verifyOtpRequest = async (
  payload: VerifyOtpPayload
): Promise<AuthActionResponse> => {
  try {
    const response = await httpClient.post<AuthActionResponse>(
      API_ROUTES.auth.verifyOtp,
      payload
    );
    return response.data;
  } catch (error) {
    console.error('[authApi] OTP verification failed:', error);
    throw error;
  }
};

/**
 * Reset password with OTP verification
 * @throws Error if reset fails
 */
export const resetPasswordRequest = async (
  payload: ResetPasswordPayload
): Promise<AuthActionResponse> => {
  try {
    const response = await httpClient.post<AuthActionResponse>(
      API_ROUTES.auth.resetPassword,
      payload
    );
    return response.data;
  } catch (error) {
    console.error('[authApi] Password reset failed:', error);
    throw error;
  }
};

