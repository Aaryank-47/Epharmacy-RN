/**
 * AUTH API TYPES
 * Strict type definitions for authentication flows
 */

// ============================================================================
// REQUEST PAYLOADS
// ============================================================================

export interface LoginRequestPayload {
  readonly email?: string;
  readonly phone?: string;
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
  readonly token: string | null;
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

export interface Advertisement {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  offerText?: string;
  link?: string;
}

export interface Medicine {
  _id: string;
  title: string;
  imageUrl: string;
  price?: number;
  originalPrice?: number;
  discount?: number;
  rating?: number;
  description?: string;
  category?: string;
}

export interface RecentSearch {
  id: number;
  query: string;
  itemId?: string;
  itemName?: string;
  itemImage?: string;
  timestamp: number;
  timeAgo?: string;
}

export interface DealItem {
  _id: string;
  itemName: string;
  itemInitialPrice: number;
  itemDiscount: number;
  itemDescription?: string;
  gstRate: number;
  discountPrice: number;
  gstAmount: number;
  itemFinalPrice: number;
  itemImages: string[];
  itemCategory?: string;
  itemCompany?: string;
  updatedAt?: string;
}

export interface UserAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface NotificationLog {
  _id: string;
  type: string;
  title: string;
  body: string;
  relatedEntityType?: string;
  status: string;
  payload?: Record<string, any>;
  sentAt: string;
  readAt?: string;
  isRead: boolean;
  createdAt: string;
  relatedEntity?: {
    _id: string;
    name: string;
    isActive?: boolean;
  };
  userInfo?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface NotificationLogsResponse {
  notifications: NotificationLog[];
  pagination: PaginationInfo;
  filters?: Record<string, any>;
  meta?: Record<string, any>;
  stats?: {
    totalLogs: number;
    unreadLogs: number;
    readLogs: number;
  };
}

export interface NotificationStats {
  totalNotifications: number;
  unreadCount: number;
  readCount: number;
  notificationsByType: Array<{
    type: string;
    count: number;
  }>;
  recentActivity: Array<{
    date: string;
    count: number;
  }>;
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  type?: string;
  isRead?: boolean;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface MarkMultipleAsReadParams {
  logIds: string[];
}

// ============================================================================
// PRESCRIPTION / OCR TYPES
// ============================================================================

export interface MedicineDetails {
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  raw?: string;
}

export interface OcrResponse {
  text: string;
  medicines: MedicineDetails[];
  meta: {
    detectedCount: number;
  };
}

export interface UploadedFilePayload {
  name: string;
  size: number;
  type: string;
  uri: string;
}
