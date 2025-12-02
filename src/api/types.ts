/**
 * AUTH API TYPES
 * Strict type definitions for authentication flows
 */

// ============================================================================
// REQUEST PAYLOADS
// ============================================================================

export interface LoginRequestPayload {
  readonly email: string;
  readonly password: string;
  readonly fcmToken?: string | null;
}

export interface SignUpPayload {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly password: string;
}

export interface ForgotPasswordPayload {
  readonly email: string;
}

export interface VerifyOtpPayload {
  readonly email: string;
  readonly otp: string;
}

export interface ResetPasswordPayload {
  readonly email: string;
  readonly otp: string;
  readonly password: string;
}

// ============================================================================
// RESPONSE PAYLOADS
// ============================================================================

export interface UserPayload {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly avatar: string | null;
  readonly role: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface LoginResponsePayload {
  readonly token: string;
  readonly refreshToken: string | null;
  readonly user: UserPayload;
}

export interface AuthActionResponse {
  readonly message: string;
  readonly otpExpiresIn?: number;
}

// ============================================================================
// API WRAPPER TYPES
// ============================================================================

export interface ApiResponse<T> {
  readonly success: boolean;
  readonly message: string;
  readonly data: T;
}

export interface ApiErrorResponse {
  readonly success: false;
  readonly message: string;
  readonly data?: null;
}
