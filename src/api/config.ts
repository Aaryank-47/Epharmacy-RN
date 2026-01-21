 export const API_BASE_URL = "https://phrma-production-app-backend-main-tld3.onrender.com";

// WebSocket URL (same as API base URL for Socket.IO)
export const SOCKET_URL = API_BASE_URL;

export const API_TIMEOUT = 60000;

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
    getItemByCategory: "/api/v1/category",
    similarItems: "/api/v1/items/similar",
    wishlist: "/api/v1/items/wishlist",
    wishlistRemove: "/api/v1/items/wishlist/remove",
  },
  search: {
    search: "/api/v1/items/search",
    suggestions: "/api/v1/items/search/suggestions",
    popularTerms: "/api/v1/items/search/popular-terms",
    recentSearches: "/api/v1/items/search/recent",
    getRecentSearches: "/api/v1/items/search/get-recent",
    clearRecentSearches: "/api/v1/items/search/recent/clear",
    deleteRecentSearch: "/api/v1/items/search/recent/delete",
  },
  notifications: {
    registerToken: "/api/v1/notifications/register-token",
    activeLogs: "/api/v1/notifications/active-logs",
    myNotifications: "/api/v1/notifications/received",
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

// AI Chat Endpoints
export const AI_ENDPOINTS = {
  PREDICT: "https://ai-server-1-xzqm.onrender.com/predict",
  REGISTER: "https://ai-server-1-xzqm.onrender.com/register",
};
