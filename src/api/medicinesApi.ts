
import httpClient from './httpClient';
import { API_ROUTES } from './config';
import type { ApiResponse, ItemFeedItem, ItemDetails } from './types';

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

interface DealItem {
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
    // Handle different response structures from backend
    const data = response.data;
    const medicines = data?.data?.data || data?.data || data || [];

    return {
      success: data?.success ?? true,
      message: data?.message ?? 'Success',
      data: { data: Array.isArray(medicines) ? medicines : [] },
    };
  } catch (error) {
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
    // Handle different response structures from backend
    const data = response.data;
    const ads = data?.data?.data || data?.data || data || [];

    return {
      success: data?.success ?? true,
      message: data?.message ?? 'Success',
      data: { data: Array.isArray(ads) ? ads : [] },
    };
  } catch (error) {
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
    throw error;
  }
};


export interface DealsOfTheDayResponse {
  deals: DealItem[];
  totalDeals: number;
  displayedDeals: number;
}

export const getDealsOfTheDay = async (): Promise<
  ApiResponse<DealsOfTheDayResponse>
> => {
  try {
    const response = await httpClient.get<ApiResponse<DealsOfTheDayResponse>>(
      API_ROUTES.items.dealsOfTheDay
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const getTrendingMedicines = async (): Promise<
  ApiResponse<{ data: any[] }>
> => {
  try {
    const response = await httpClient.get<ApiResponse<any>>(
      API_ROUTES.items.trending
    );
    // Handle response structure
    const data = response.data;
    const trending = data?.data || [];

    return {
      success: data?.success ?? true,
      message: data?.message ?? 'AI Trending Products',
      data: { data: Array.isArray(trending) ? trending : [] },
    };
  } catch (error) {
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
    throw error;
  }
};

export const getRecentlyViewedItems = async (): Promise<
  ApiResponse<{ data: any[] }>
> => {
  try {
    const response = await httpClient.get<ApiResponse<any>>(
      API_ROUTES.recentlyViewed.get
    );
    // Handle response structure
    const data = response.data;
    const items = data?.data || [];

    return {
      success: data?.success ?? true,
      message: data?.message ?? 'Recently viewed items retrieved',
      data: { data: Array.isArray(items) ? items : [] },
    };
  } catch (error) {
    throw error;
  }
};

export const getRecentlyViewedCategories = async (): Promise<
  ApiResponse<{ data: any[] }>
> => {
  try {
    const response = await httpClient.get<ApiResponse<any>>(
      API_ROUTES.recentlyViewed.getCategories
    );
    const data = response.data;
    const items = data?.data || [];

    return {
      success: data?.success ?? true,
      message: data?.message ?? 'Recently viewed categories retrieved',
      data: { data: Array.isArray(items) ? items : [] },
    };
  } catch (error) {
    throw error;
  }
};

// ============================================================================
// DYNAMIC FEED API
// ============================================================================

export const getItemFeed = async (): Promise<
  ApiResponse<{ data: ItemFeedItem[] }>
> => {
  try {
    const response = await httpClient.get<ApiResponse<any>>(
      API_ROUTES.items.itemFeed
    );
    // Handle response structure
    const data = response.data;
    const items = data?.data || [];

    return {
      success: data?.success ?? true,
      message: data?.message ?? 'Dynamic feed fetched successfully',
      data: { data: Array.isArray(items) ? items : [] },
    };
  } catch (error) {
    throw error;
  }
};

// ============================================================================
// ITEM DETAILS API
// ============================================================================

export const getItemDetails = async (
  itemId: string
): Promise<ApiResponse<{ data: ItemDetails }>> => {
  try {
    const response = await httpClient.get<ApiResponse<any>>(
      `${API_ROUTES.items.details}/${itemId}`
    );
    const data = response.data;
    const item = data?.data || {};

    return {
      success: data?.success ?? true,
      message: data?.message ?? 'Item details fetched successfully',
      data: { data: item },
    };
  } catch (error) {
    throw error;
  }
};
