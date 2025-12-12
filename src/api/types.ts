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

export interface UpdateProfilePayload {
  readonly name?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly age?: number;
  readonly dob?: string;
  readonly fcmToken?: string;
  readonly address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    location?: {
      latitude?: number;
      longitude?: number;
    };
  };
  readonly ProfileImage?: string | string[];
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

export interface UserProfilePayload {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly role: string;
  readonly age: number | null;
  readonly dob: string | null;
  readonly lastLogin: string | null;
  readonly fcmToken: string | null;
  readonly address: Record<string, any>;
  readonly wishlistCount: number;
  readonly viewedItemsCount: number;
  readonly itemsPurchasedCount: number;
  readonly profileImage: string[];
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

// ============================================================================
// ITEM TYPES
// ============================================================================

export interface ItemFeedItem {
  _id: string;
  itemName: string;
  code?: string;
  image: string | null;
  itemDescription?: string;
  itemDiscount?: number;
  itemRatings?: number;
  itemFinalPrice?: number;
  itemInitialPrice?: number;
}

export interface ItemDetails {
  _id: string;
  itemName: string;
  itemDescription: string;
  itemMfgDate: string;
  itemExpiryDate: string;
  itemImages: string[];
  itemDiscount: number;
  itemRatings: number;
  itemFinalPrice: number;
  itemInitialPrice: number;
  views: number;
  category: any;
  units: {
    parent: { _id: string; name: string };
    child: { _id: string; name: string };
  };
  gst: { id: string; rate: number };
  otherInformation?: {
    keyFeatures?: string[];
    benefits?: string[];
    precautions?: string[];
    allergyInfo?: string[];
    sideEffects?: string[];
    howToUse?: string;
    safetyAdvice?: string[];
    ingredients?: string[];
  };
  formula?: string;
  deliveryTime?: string; // Not in schema but used in UI
}
