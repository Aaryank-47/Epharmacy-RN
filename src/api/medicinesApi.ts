
import httpClient from './httpClient';
import { API_ROUTES } from './config';
import type { ApiResponse } from './types';

// ============================================================================
// TYPES
// ============================================================================

interface Medicine {
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

interface Advertisement {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  offerText?: string;
  link?: string;
}

interface UserAddress {
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

interface UserProfilePayload {
  address: UserAddress;
}

// ============================================================================
// MEDICINES API FUNCTIONS
// ============================================================================

export const getFeaturedMedicines = async (): Promise<
  ApiResponse<{ data: Medicine[] }>
> => {
  try {
    const response = await httpClient.get<ApiResponse<any>>(
      API_ROUTES.catalog.featuredMedicines
    );
    console.log('[medicinesApi] Featured medicines response:', response.data);
    
    // Handle different response structures from backend
    const data = response.data;
    const medicines = data?.data?.data || data?.data || data || [];
    
    return {
      success: data?.success ?? true,
      message: data?.message ?? 'Success',
      data: { data: Array.isArray(medicines) ? medicines : [] },
    };
  } catch (error) {
    console.error('[medicinesApi] Failed to fetch featured medicines:', error);
    throw error;
  }
};

export const getRunningAdvertisements = async (): Promise<
  ApiResponse<{ data: Advertisement[] }>
> => {
  try {
    const response = await httpClient.get<ApiResponse<any>>(
      API_ROUTES.advertisements.running
    );
    console.log('[medicinesApi] Running advertisements response:', response.data);
    
    // Handle different response structures from backend
    const data = response.data;
    const ads = data?.data?.data || data?.data || data || [];
    
    return {
      success: data?.success ?? true,
      message: data?.message ?? 'Success',
      data: { data: Array.isArray(ads) ? ads : [] },
    };
  } catch (error) {
    console.error('[medicinesApi] Failed to fetch advertisements:', error);
    throw error;
  }
};


export const trackAdvertisementClick = async (
  advertisementId: string
): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const response = await httpClient.post<
      ApiResponse<{ success: boolean }>
    >(
      `${API_ROUTES.advertisements.trackClick}/${advertisementId}`,
      {
        timestamp: new Date().toISOString(),
      }
    );
    return response.data;
  } catch (error) {
    console.error('[medicinesApi] Failed to track advertisement click:', error);
    throw error;
  }
};

export const updateUserProfile = async (
  profileData: { address: UserAddress },
  updateAll: boolean = false
): Promise<ApiResponse<{ success: boolean; message?: string }>> => {
  try {
    const payload = updateAll ? profileData : { address: profileData.address };

    const response = await httpClient.put<
      ApiResponse<{ success: boolean; message?: string }>
    >(API_ROUTES.user.updateProfile, payload);

    return response.data;
  } catch (error) {
    console.error('[medicinesApi] Failed to update user profile:', error);
    throw error;
  }
};

export const getAllMedicines = async (): Promise<
  ApiResponse<{ data: Medicine[] }>
> => {
  try {
    const response = await httpClient.get<ApiResponse<{ data: Medicine[] }>>(
      API_ROUTES.items.all
    );
    return response.data;
  } catch (error) {
    console.error('[medicinesApi] Failed to fetch all medicines:', error);
    throw error;
  }
};


export const getDealsOfTheDay = async (): Promise<
  ApiResponse<{ data: Medicine[] }>
> => {
  try {
    const response = await httpClient.get<ApiResponse<{ data: Medicine[] }>>(
      API_ROUTES.items.dealsOfTheDay
    );
    return response.data;
  } catch (error) {
    console.error('[medicinesApi] Failed to fetch deals of the day:', error);
    throw error;
  }
};

/**
 * Get trending medicines (AI Personalized)
 * @returns Promise with trending medicines data
 */
export const getTrendingMedicines = async (): Promise<
  ApiResponse<{ data: any[] }>
> => {
  try {
    const response = await httpClient.get<ApiResponse<any>>(
      API_ROUTES.items.trending
    );
    console.log('[medicinesApi] Trending medicines response:', response.data);
    
    // Handle response structure
    const data = response.data;
    const trending = data?.data || [];
    
    return {
      success: data?.success ?? true,
      message: data?.message ?? 'AI Trending Products',
      data: { data: Array.isArray(trending) ? trending : [] },
    };
  } catch (error) {
    console.error('[medicinesApi] Failed to fetch trending medicines:', error);
    throw error;
  }
};


export const getCategories = async (): Promise<
  ApiResponse<{ data: any[] }>
> => {
  try {
    const response = await httpClient.get<ApiResponse<{ data: any[] }>>(
      API_ROUTES.catalog.categories
    );
    return response.data;
  } catch (error) {
    console.error('[medicinesApi] Failed to fetch categories:', error);
    throw error;
  }
};

// ============================================================================
// RECENTLY VIEWED APIs
// ============================================================================

export const addCategoryToRecentlyViewed = async (
  categoryId: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await httpClient.post<ApiResponse<any>>(
      `${API_ROUTES.recentlyViewed.category}/${categoryId}`
    );
    return response.data;
  } catch (error) {
    console.error('[medicinesApi] Failed to add category to recently viewed:', error);
    throw error;
  }
};


export const addItemToRecentlyViewed = async (
  itemId: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await httpClient.post<ApiResponse<any>>(
      `${API_ROUTES.recentlyViewed.item}/${itemId}`
    );
    return response.data;
  } catch (error) {
    console.error('[medicinesApi] Failed to add item to recently viewed:', error);
    throw error;
  }
};
