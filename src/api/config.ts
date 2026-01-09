// Local backend for notifications (testing) - DEPRECATED: Now using API_BASE_URL for production
// export const NOTIFICATION_API_BASE_URL = "http://10.0.2.2:5000";

// Production backend for all features including notifications
// export const API_BASE_URL = "https://phrma-production-app-backend-main.onrender.com";
export const API_BASE_URL = "https://phrma-production-app-backend-main-qbt9.onrender.com";
// export const API_BASE_URL = "http://10.10.124.123:5000";
// export const API_BASE_URL = "http://10.41.89.226:5000";

export const API_TIMEOUT = 60000; // Increased timeout to 60 seconds for file uploads

export const AUTH_TOKEN_STORAGE_KEY = "jwtToken";
export const REFRESH_TOKEN_STORAGE_KEY = "refreshToken";

export const API_ROUTES = {
  auth: {
    signup: "/api/v1/users/signup",
    login: "/api/v1/users/login",
    logout: "/api/v1/users/logout",
    forgotPassword: "/api/v1/users/forgot-password",
    verifyOtp: "/api/v1/users/verify-otp",
    resetPassword: "/api/v1/users/reset-password",
    googleLogin: "/api/v1/users/google-login",
  },
  user: {
    profile: "/api/v1/users/profile",
    updateProfile: "/api/v1/users/update/profile",
  },
  catalog: {
    featuredMedicines: "/api/v1/featured-medicines",
    categories: "/api/v1/categories/list",
  },
  recentlyViewed: {
    category: "/api/v1/categories/recently-viewed",
    item: "/api/v1/items/AddToRecentlyViewedItems",
    get: "/api/v1/items/GetRecentlyViewedItems",
    getCategories: "/api/v1/categories/RecentlyViewed",
  },
  advertisements: {
    running: "/api/v1/advertisements/currently-running",
    active: "/api/v1/advertisements/active",
    trackClick: "/api/v1/advertisements/track-click",
  },
  items: {
    all: "/api/v1/items",
    dealsOfTheDay: "/api/v1/items/deals-of-the-day",
    trending: "/api/v1/items/trending/AiPersonalized",
    itemFeed: "/api/v1/items/GetItemFeed",
    details: "/api/v1/items/details",
  },
  notifications: {
    registerToken: "/api/v1/notifications/register-token",
    send: "/api/v1/notifications/send",
    subscribeTopic: "/api/v1/notifications/subscribe-topic",
    unsubscribeTopic: "/api/v1/notifications/unsubscribe-topic",
    // Notification Log APIs
    activeLogs: "/api/v1/notifications/active-logs",
    myNotifications: "/api/v1/notifications/myNotification",
    logById: "/api/v1/notifications/log",
    stats: "/api/v1/notifications/stats",
    markAsRead: "/api/v1/notifications/mark-read",
    markMultipleAsRead: "/api/v1/notifications/mark-multiple-read",
  },
  prescriptions: {
    ocrExtract: "/api/v1/prescriptions/upload",
  },
} as const;

export type ApiRouteTree = typeof API_ROUTES;
