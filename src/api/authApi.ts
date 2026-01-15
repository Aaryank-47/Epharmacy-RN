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
// HELPERS
// ============================================================================

const normalizeUser = (rawUser: Record<string, any>): UserPayload => ({
  id: rawUser._id || rawUser.id,
  name: rawUser.name || '',
  email: rawUser.email || '',
  phone: rawUser.phone || '',
  avatar: rawUser.ProfileImage?.[0] || rawUser.avatar || null,
  role: rawUser.role || 'user',
  createdAt: rawUser.createdAt || new Date().toISOString(),
  updatedAt: rawUser.updatedAt || new Date().toISOString(),
});

const normalizeLoginResponse = (response: ApiResponse<any>): LoginResponsePayload => {
  const { data } = response;
  const user = data.user || data;
  const token = data.token || null;
  const refreshToken = data.refreshToken || null;

  if (!user) {
    throw new Error('Invalid response: missing user data');
  }

  return {
    token,
    refreshToken,
    user: normalizeUser(user),
  };
};

// ============================================================================
// AUTH API
// ============================================================================

export const loginRequest = async (payload: LoginRequestPayload): Promise<LoginResponsePayload> => {
  try {
    let fcmToken = null;
    try {
      fcmToken = await notificationService.getToken();
    } catch {
      // Ignore FCM error
    }

    const response = await httpClient.post<ApiResponse<any>>(API_ROUTES.auth.login, {
      ...payload,
      ...(fcmToken && { fcmToken }),
    });

    return normalizeLoginResponse(response.data);
  } catch (error) {
    throw error;
  }
};

export const signupUser = async (payload: SignUpPayload): Promise<LoginResponsePayload> => {
  try {
    const response = await httpClient.post<ApiResponse<any>>(API_ROUTES.auth.signup, payload);
    return normalizeLoginResponse(response.data);
  } catch (error) {
    throw error;
  }
};

export const logoutRequest = async (): Promise<void> => {
  try {
    await httpClient.post(API_ROUTES.auth.logout);
  } catch (error) {
    throw error;
  }
};

export const forgotPasswordRequest = async (payload: ForgotPasswordPayload): Promise<AuthActionResponse> => {
  try {
    const response = await httpClient.post<AuthActionResponse>(API_ROUTES.auth.forgotPassword, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const verifyOtpRequest = async (payload: VerifyOtpPayload): Promise<AuthActionResponse> => {
  try {
    const response = await httpClient.post<AuthActionResponse>(API_ROUTES.auth.verifyOtp, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const resetPasswordRequest = async (payload: ResetPasswordPayload): Promise<AuthActionResponse> => {
  try {
    const response = await httpClient.post<AuthActionResponse>(API_ROUTES.auth.resetPassword, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const googleLoginRequest = async (idToken: string): Promise<LoginResponsePayload> => {
  try {
    if (!idToken) throw new Error('No ID token provided');

    let fcmToken = null;
    try {
      fcmToken = await notificationService.getToken();
    } catch (error) {
      throw error;
    }

    const response = await httpClient.post<ApiResponse<any>>(API_ROUTES.auth.googleLogin, {
      userToken: idToken,
      ...(fcmToken && { fcmToken }),
    });

    if (!response.data) throw new Error('Invalid response from server');

    return normalizeLoginResponse(response.data);
  } catch (error) {
    throw error;
  }
};

// ============================================================================
// PROFILE API
// ============================================================================

export const getUserProfile = async (): Promise<ApiResponse<UserProfilePayload>> => {
  try {
    const response = await httpClient.get<ApiResponse<UserProfilePayload>>(API_ROUTES.user.profile);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateUserProfile = async (
  payload: FormData | UpdateProfilePayload,
  hasFile: boolean = false
): Promise<ApiResponse<any>> => {
  try {
    const config = hasFile
      ? { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 90000 }
      : { timeout: 30000 };

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

