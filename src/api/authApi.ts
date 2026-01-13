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
  UserProfilePayload,
  UpdateProfilePayload,
} from './types';
import { notificationService } from '../services/notificationService';

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
  // Handle case where data IS the user object (direct response)
  const user = data.user || data;
  const token = data.token || null;
  const refreshToken = data.refreshToken || null;

  if (!user) {
    throw new Error('Invalid response: missing user data');
  }

  // Ensure user has required fields before normalizing
  const normalizedUser = normalizeUser(user);

  return {
    token,
    refreshToken,
    user: normalizedUser,
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
    // Get FCM token before login
    let fcmToken = null;
    try {
      fcmToken = await notificationService.getToken();
    } catch (tokenError) {
      // Failed to get FCM token, continue without it
    }

    // Add FCM token to login payload
    const loginPayload = {
      ...payload,
      ...(fcmToken && { fcmToken })
    };

    const response = await httpClient.post<ApiResponse<any>>(
      API_ROUTES.auth.login,
      loginPayload
    );

    return normalizeLoginResponse(response.data);
  } catch (error) {
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
    throw error;
  }
};

/**
 * Login with Google ID token
 * @param idToken - Google ID token from Google Sign-In
 * @throws Error if login fails
 */
export const googleLoginRequest = async (
  idToken: string
): Promise<LoginResponsePayload> => {
  try {
    if (!idToken) {
      throw new Error('No ID token provided to googleLoginRequest');
    }

    let fcmToken = null;
    try {
      fcmToken = await notificationService.getToken();
    } catch (tokenError) {
      throw tokenError;
    }

    const payload = {
      userToken: idToken,
      ...(fcmToken && { fcmToken })
    };

    const response = await httpClient.post<ApiResponse<any>>(
      API_ROUTES.auth.googleLogin,
      payload
    );

    if (!response.data) {
      throw new Error('Invalid response from server');
    }

    return normalizeLoginResponse(response.data);
  } catch (error: any) {
    throw error;
  }
};

// ============================================================================

/**
 * Get current user profile
 * @throws Error if profile fetch fails
 */
export const getUserProfile = async (): Promise<ApiResponse<UserProfilePayload>> => {
  try {
    const response = await httpClient.get<ApiResponse<UserProfilePayload>>(
      API_ROUTES.user.profile
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update user profile
 * @param payload - Profile data to update (can be FormData for file upload or JSON object)
 * @param hasFile - Whether the payload contains a file upload
 * @throws Error if profile update fails
 */
export const updateUserProfile = async (
  payload: FormData | UpdateProfilePayload,
  hasFile: boolean = false
): Promise<ApiResponse<any>> => {
  try {
    const config = hasFile
      ? {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 90000, // 90 seconds timeout for file uploads (longer than default)
      }
      : {
        timeout: 30000, // 30 seconds for regular updates
      };

    const response = await httpClient.put<ApiResponse<any>>(
      API_ROUTES.user.updateProfile,
      payload,
      config
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

