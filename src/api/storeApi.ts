/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Store API Service - Handles all medicine store related API calls
 * Includes: store listing, details, reviews, medicines, distances
 * Backend: PHRMA-PRODUCTION-APP-BACKEND-MAIN-2 (API_BASE_URL_2)
 * ═══════════════════════════════════════════════════════════════════════════
 */

import axios from 'axios';
import { API_BASE_URL_2, API_TIMEOUT } from './config';
import { secureStorage } from '../utils/storage';
import type { ApiResponse, Store, StoreReviewStats, StoreItemsResponse } from './types';
import { mapApiError, toHumanReadableError } from '../utils/errorHandler';

// ============================================================================
// AXIOS INSTANCE FOR STORE API (uses API_BASE_URL_2)
// ============================================================================

const storeHttpClient = axios.create({
  baseURL: API_BASE_URL_2,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ============================================================================
// REQUEST INTERCEPTOR - Add Auth Token
// ============================================================================

storeHttpClient.interceptors.request.use(
  (config) => {
    try {
      const token = secureStorage.getString('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('[storeHttpClient] Could not retrieve auth token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================================
// RESPONSE INTERCEPTOR - Handle Errors
// ============================================================================

storeHttpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log for debugging with readable error messages
    if (error.response) {
      const errorMsg = error.response.data?.message || error.response.statusText || 'Unknown error';
      console.error(
        `[storeHttpClient] HTTP Error ${error.response.status} at ${error.config?.url}: ${errorMsg}`
      );
    } else if (error.request) {
      console.error(`[storeHttpClient] Network Error: ${error.message}`);
    } else {
      console.error(`[storeHttpClient] Error: ${error.message}`);
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// API ROUTES
// ============================================================================

const STORE_API_ROUTES = {
  getAllStores: '/api/v2/medicine-store/all',
  getDistances: '/api/v2/medicine-store/distances',
  getStoreDetails: (storeId: string) => `/api/v2/medicine-store/${storeId}`,
  getReviewStats: (storeId: string) => `/api/v2/medicine-store/${storeId}/review-stats`,
  getMedicinesByStore: (storeId: string) => `/api/v2/medicine-store/${storeId}/items`,
  getAvailableMedicines: (storeId: string) => `/api/v2/medicine-store/${storeId}/items/available`,
  searchMedicines: (storeId: string) => `/api/v2/medicine-store/${storeId}/items/search`,
  getMedicinesByCategory: (storeId: string) => `/api/v2/medicine-store/${storeId}/categories`,
  getBestSellers: (storeId: string) => `/api/v2/medicine-store/${storeId}/bestsellers`,
  getInventoryStatus: (storeId: string) => `/api/v2/medicine-store/${storeId}/inventory-status`,
  giveReview: (storeId: string) => `/api/v2/medicine-store/${storeId}/review`,
  // TODO: Implement order management APIs
  // getStoreOrders: (storeId: string) => `/api/v2/medicine-store/${storeId}/orders`,
  // getOrderDetails: (storeId: string, orderId: string) => `/api/v2/medicine-store/${storeId}/orders/${orderId}`,
  // updateOrderStatus: (storeId: string, orderId: string) => `/api/v2/medicine-store/${storeId}/orders/${orderId}/status`,
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface ReviewPayload {
  rating: number; // 1-5
  comment: string;
}

export interface StoreWithDistance extends Store {
  actualDistance?: number;
}

export interface StoreListResponse {
  stores: Store[];
  totalCount?: number;
  page?: number;
  limit?: number;
}

export interface MedicineWithStock {
  id: string;
  name: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  discountBadge?: string;
  inStock: boolean;
  stockStatus?: 'in_stock' | 'out_of_stock' | 'limited_stock';
  quantity?: number;
  imageUrl: string;
  category?: string;
  rating?: number;
}

export interface StoreInventoryStatus {
  totalItems: number;
  inStockItems: number;
  outOfStockItems: number;
  limitedStockItems: number;
  totalValue?: number;
  lastUpdated?: string;
}

export interface OpeningHours {
  day: string;
  open: string;
  close: string;
  isClosed?: boolean;
}

export interface StoreOpeningHoursPayload {
  monday?: OpeningHours;
  tuesday?: OpeningHours;
  wednesday?: OpeningHours;
  thursday?: OpeningHours;
  friday?: OpeningHours;
  saturday?: OpeningHours;
  sunday?: OpeningHours;
}

export interface BatchStockUpdatePayload {
  items: Array<{
    itemId: string;
    stockStatus: 'in_stock' | 'out_of_stock' | 'limited_stock';
    quantity?: number;
  }>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Transform API store response to frontend Store interface
 */
const transformStoreResponse = (apiStore: any): Store => {
  return {
    id: apiStore.storeId || apiStore.id || '',
    name: apiStore.storeName || apiStore.name || 'Unknown Store',
    description: apiStore.description || apiStore.storeType || '',
    rating: apiStore.averageRating ?? 4.5, // Default rating if not provided
    reviewsCount: String(apiStore.storeReviews?.length || 0),
    freeDelivery: apiStore.fastDeliveryAvailable ?? false,
    distance: apiStore.distance || '0 km',
    deliveryTime: apiStore.deliveryTime || '30-45 mins',
    isOpen: apiStore.isStoreOpen ?? true,
    imageUrl: apiStore.storeImage || apiStore.storeImages?.[0] || '',
    discountBadge: apiStore.discountBadge,
    isFavorite: apiStore.isFavorite ?? false,
  };
};

/**
 * Transform review stats response with safe defaults
 */
const transformReviewStats = (apiStats: any): StoreReviewStats => {
  return {
    totalReviews: Number(apiStats?.totalReviews) || Number(apiStats?.storeReviews?.length) || 0,
    averageRating: Number(apiStats?.averageRating) || Number(apiStats?.rating) || 4.5,
    reviewDistribution: apiStats?.reviewDistribution || {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    },
  };
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get all medicine stores with caching
 */
export const getAllStores = async (): Promise<
  ApiResponse<{ stores: Store[] }>
> => {
  try {
    const response = await storeHttpClient.get<ApiResponse<any>>(
      STORE_API_ROUTES.getAllStores,
      { cache: { ttl: 10 * 60 * 1000 } } as any // Cache for 10 minutes
    );

    const data = response.data;
    const apiStores = data?.data?.stores || data?.data || [];

    const transformedStores = Array.isArray(apiStores)
      ? apiStores.map(transformStoreResponse)
      : [];

    return {
      success: data?.success ?? true,
      message: data?.message ?? 'Stores fetched successfully',
      data: { 
        stores: transformedStores
      },
    };
  } catch (error) {
    const normalizedError = mapApiError(error);
    const userMessage = toHumanReadableError(error);
    console.error(`[getAllStores] Error: ${userMessage || normalizedError.message}`);
    throw {
      ...normalizedError,
      userMessage: userMessage,
    };
  }
};

/**
 * Get distances to all stores and count
 */
export const getStorDistances = async (
  latitude?: number,
  longitude?: number
): Promise<
  ApiResponse<{ stores: StoreWithDistance[] }>
> => {
  try {
    const params = new URLSearchParams();
    if (latitude && longitude) {
      params.append('latitude', latitude.toString());
      params.append('longitude', longitude.toString());
    }

    const response = await storeHttpClient.get<ApiResponse<any>>(
      `${STORE_API_ROUTES.getDistances}${params.toString() ? '?' + params : ''}`,
      { cache: { ttl: 5 * 60 * 1000 } } as any // Cache for 5 minutes
    );

    const data = response.data;
    const stores = data?.data?.stores || data?.data || [];

    return {
      success: data?.success ?? true,
      message: data?.message ?? 'Store distances fetched',
      data: { 
        stores: Array.isArray(stores) ? stores : [] 
      },
    };
  } catch (error) {
    const normalizedError = mapApiError(error);
    console.error('[getStorDistances] Error:', normalizedError);
    throw {
      ...normalizedError,
      userMessage: toHumanReadableError(error),
    };
  }
};

/**
 * Get review statistics for a specific store
 */
export const getStoreReviewStats = async (
  storeId: string
): Promise<
  ApiResponse<StoreReviewStats>
> => {
  try {
    if (!storeId) {
      throw new Error('Store ID is required');
    }

    const response = await storeHttpClient.get<ApiResponse<any>>(
      STORE_API_ROUTES.getReviewStats(storeId),
      { cache: { ttl: 5 * 60 * 1000 } } as any // Cache for 5 minutes
    );

    const data = response.data;
    const transformedStats = transformReviewStats(data?.data || {});

    return {
      success: data?.success ?? true,
      message: data?.message ?? 'Review stats fetched',
      data: transformedStats,
    };
  } catch (error) {
    const normalizedError = mapApiError(error);
    console.error('[getStoreReviewStats] Error:', normalizedError);
    throw {
      ...normalizedError,
      userMessage: toHumanReadableError(error),
    };
  }
};

/**
 * Get medicines/items available in a specific store (Authenticated)
 */
export const getMedicinesByStore = async (
  storeId: string,
  filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'price' | 'rating' | 'newest';
    page?: number;
    limit?: number;
  }
): Promise<
  ApiResponse<StoreItemsResponse>
> => {
  try {
    if (!storeId) {
      throw new Error('Store ID is required');
    }

    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const url = `${STORE_API_ROUTES.getMedicinesByStore(storeId)}${
      params.toString() ? '?' + params : ''
    }`;

    const response = await storeHttpClient.get<ApiResponse<any>>(url);

    const data = response.data;
    const items = data?.data?.items || data?.data || [];

    return {
      success: data?.success ?? true,
      message: data?.message ?? 'Items fetched successfully',
      data: {
        items: Array.isArray(items) ? items : [],
        pagination: data?.data?.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
        },
      },
    };
  } catch (error) {
    const normalizedError = mapApiError(error);
    console.error('[getMedicinesByStore] Error:', normalizedError);
    throw {
      ...normalizedError,
      userMessage: toHumanReadableError(error),
    };
  }
};

/**
 * Give review and rating for a store (Authenticated)
 */
export const giveStoreReview = async (
  storeId: string,
  reviewData: ReviewPayload
): Promise<
  ApiResponse<{ success: boolean; reviewId?: string }>
> => {
  try {
    if (!storeId) {
      throw new Error('Store ID is required');
    }

    if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    if (!reviewData.comment?.trim()) {
      throw new Error('Comment is required');
    }

    const response = await storeHttpClient.post<ApiResponse<any>>(
      STORE_API_ROUTES.giveReview(storeId),
      {
        ...reviewData,
        timestamp: new Date().toISOString(),
      }
    );

    const data = response.data;

    return {
      success: data?.success ?? true,
      message: data?.message ?? 'Review submitted successfully',
      data: data?.data || { success: true },
    };
  } catch (error) {
    const normalizedError = mapApiError(error);
    console.error('[giveStoreReview] Error:', normalizedError);
    throw {
      ...normalizedError,
      userMessage: toHumanReadableError(error),
    };
  }
};


/**
 * Get detailed store information including hours, address, contact details
 */
export const getStoreDetails = async (
  storeId: string
): Promise<
  ApiResponse<Store & { address?: string; contactPhone?: string; openingHours?: StoreOpeningHoursPayload }>
> => {
  try {
    if (!storeId) {
      throw new Error('Store ID is required');
    }

    const response = await storeHttpClient.get<ApiResponse<any>>(
      STORE_API_ROUTES.getStoreDetails(storeId),
      { cache: { ttl: 10 * 60 * 1000 } } as any // Cache for 10 minutes
    );

    const data = response.data;
    const storeData = data?.data || {};

    return {
      success: data?.success ?? true,
      message: data?.message ?? 'Store details fetched',
      data: {
        ...transformStoreResponse(storeData),
        address: storeData.address,
        contactPhone: storeData.contactDetails?.phone,
        openingHours: storeData.openingHours,
      },
    };
  } catch (error) {
    const normalizedError = mapApiError(error);
    console.error('[getStoreDetails] Error:', normalizedError);
    throw {
      ...normalizedError,
      userMessage: toHumanReadableError(error),
    };
  }
};

/**
 * Get available (in-stock) medicines in a store
 */
export const getAvailableMedicines = async (
  storeId: string,
  filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'price' | 'rating' | 'newest' | 'discount';
    page?: number;
    limit?: number;
  }
): Promise<
  ApiResponse<{ items: MedicineWithStock[]; pagination?: any }>
> => {
  try {
    if (!storeId) {
      throw new Error('Store ID is required');
    }

    const params = new URLSearchParams();
    params.append('stockStatus', 'in_stock');
    if (filters?.category) params.append('category', filters.category);
    if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const url = `${STORE_API_ROUTES.getAvailableMedicines(storeId)}${
      params.toString() ? '?' + params : ''
    }`;

    const response = await storeHttpClient.get<ApiResponse<any>>(url);

    const data = response.data;
    const items = data?.data?.items || data?.data || [];

    return {
      success: data?.success ?? true,
      message: data?.message ?? 'Available medicines fetched',
      data: {
        items: Array.isArray(items) ? items : [],
        pagination: data?.data?.pagination,
      },
    };
  } catch (error) {
    const normalizedError = mapApiError(error);
    console.error('[getAvailableMedicines] Error:', normalizedError);
    throw {
      ...normalizedError,
      userMessage: toHumanReadableError(error),
    };
  }
};

/**
 * Search medicines in a specific store by name, brand, or category
 */
export const searchMedicinesInStore = async (
  storeId: string,
  searchQuery: string,
  filters?: {
    category?: string;
    type?: 'name' | 'brand' | 'category' | 'all';
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }
): Promise<
  ApiResponse<{ items: MedicineWithStock[]; totalResults?: number; pagination?: any }>
> => {
  try {
    if (!storeId) {
      throw new Error('Store ID is required');
    }

    if (!searchQuery?.trim()) {
      throw new Error('Search query is required');
    }

    const params = new URLSearchParams();
    params.append('q', searchQuery);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const url = `${STORE_API_ROUTES.searchMedicines(storeId)}?${params}`;

    const response = await storeHttpClient.get<ApiResponse<any>>(url);

    const data = response.data;
    const items = data?.data?.items || data?.data || [];

    return {
      success: data?.success ?? true,
      message: data?.message ?? 'Search completed',
      data: {
        items: Array.isArray(items) ? items : [],
        totalResults: data?.data?.totalResults,
        pagination: data?.data?.pagination,
      },
    };
  } catch (error) {
    const normalizedError = mapApiError(error);
    console.error('[searchMedicinesInStore] Error:', normalizedError);
    throw {
      ...normalizedError,
      userMessage: toHumanReadableError(error),
    };
  }
};

/**
 * Get medicines grouped by category in a store
 */
export const getMedicinesByCategory = async (
  storeId: string,
  category?: string,
  filters?: {
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }
): Promise<
  ApiResponse<{
    categories?: Array<{ name: string; items: MedicineWithStock[] }>;
    items?: MedicineWithStock[];
    pagination?: any;
  }>
> => {
  try {
    if (!storeId) {
      throw new Error('Store ID is required');
    }

    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const url = `${STORE_API_ROUTES.getMedicinesByCategory(storeId)}${
      params.toString() ? '?' + params : ''
    }`;

    const response = await storeHttpClient.get<ApiResponse<any>>(url);

    const data = response.data;

    return {
      success: data?.success ?? true,
      message: data?.message ?? 'Categories fetched',
      data: data?.data || { categories: [] },
    };
  } catch (error) {
    const normalizedError = mapApiError(error);
    console.error('[getMedicinesByCategory] Error:', normalizedError);
    throw {
      ...normalizedError,
      userMessage: toHumanReadableError(error),
    };
  }
};

/**
 * Get best-selling medicines in a store
 */
export const getStoreBestSellers = async (
  storeId: string,
  limit: number = 10
): Promise<
  ApiResponse<{ items: MedicineWithStock[] }>
> => {
  try {
    if (!storeId) {
      throw new Error('Store ID is required');
    }

    const params = new URLSearchParams();
    params.append('limit', limit.toString());

    const response = await storeHttpClient.get<ApiResponse<any>>(
      `${STORE_API_ROUTES.getBestSellers(storeId)}?${params}`,
      { cache: { ttl: 15 * 60 * 1000 } } as any // Cache for 15 minutes
    );

    const data = response.data;
    const items = data?.data?.items || data?.data || [];

    return {
      success: data?.success ?? true,
      message: data?.message ?? 'Best sellers fetched',
      data: {
        items: Array.isArray(items) ? items : [],
      },
    };
  } catch (error) {
    const normalizedError = mapApiError(error);
    console.error('[getStoreBestSellers] Error:', normalizedError);
    throw {
      ...normalizedError,
      userMessage: toHumanReadableError(error),
    };
  }
};

/**
 * Get inventory status for a store (total items, in-stock, out-of-stock counts)
 */
export const getStoreInventoryStatus = async (
  storeId: string
): Promise<
  ApiResponse<StoreInventoryStatus>
> => {
  try {
    if (!storeId) {
      throw new Error('Store ID is required');
    }

    const response = await storeHttpClient.get<ApiResponse<any>>(
      STORE_API_ROUTES.getInventoryStatus(storeId),
      { cache: { ttl: 10 * 60 * 1000 } } as any // Cache for 10 minutes
    );

    const data = response.data?.data || {};

    return {
      success: true,
      message: 'Inventory status fetched',
      data: {
        totalItems: data.totalItems || 0,
        inStockItems: data.inStockItems || 0,
        outOfStockItems: data.outOfStockItems || 0,
        limitedStockItems: data.limitedStockItems || 0,
        totalValue: data.totalValue,
        lastUpdated: data.lastUpdated,
      },
    };
  } catch (error) {
    const normalizedError = mapApiError(error);
    console.error('[getStoreInventoryStatus] Error:', normalizedError);
    throw {
      ...normalizedError,
      userMessage: toHumanReadableError(error),
    };
  }
};


/**
 * TODO: Implement order management APIs when Order system is ready
 * 
 * Planned APIs:
 * - getStoreOrders() - Get all orders for a store with filtering & pagination
 * - getOrderDetails() - Get specific order details with items and status
 * - updateOrderStatus() - Update order status (pending, confirmed, shipped, delivered, cancelled)
 * - getOrderStats() - Get order statistics (total orders, revenue, avg order value)
 * - trackOrderShipment() - Track shipment status with real-time updates
 * 
 * Will require:
 * - Order collection/schema in backend
 * - Order status workflow management
 * - Inventory depletion on order placement
 * - Order notifications (SMS/Push/Email)
 * - Refund/Return management
 */
