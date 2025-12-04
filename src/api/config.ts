export const API_BASE_URL = "https://phrma-production-app-backend-main.onrender.com";
export const API_TIMEOUT = 30000; // Increased timeout to 30 seconds

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
  advertisements: {
    running: "/api/v1/advertisements/currently-running",
    active: "/api/v1/advertisements/active",
    trackClick: "/api/v1/advertisements/track-click",
  },
  items: {
    all: "/api/v1/items",
    dealsOfTheDay: "/api/v1/items/deals-of-the-day",
    trending: "/api/v1/items/trending",
  },
} as const;

export type ApiRouteTree = typeof API_ROUTES;
