import httpClient from './httpClient';
import { API_ROUTES } from './config';
import type { ApiResponse, ItemFeedItem, ItemDetails, Advertisement, Medicine, DealItem, UserAddress, RecentSearch } from './types';

// ============================================================================
// MEDICINES API FUNCTIONS
// ============================================================================

export const getFeaturedMedicines = async (): Promise<
  ApiResponse<{ data: Medicine[] }>
> => {
  try {
    const response = await httpClient.get<ApiResponse<any>>(
      API_ROUTES.catalog.featuredMedicines,
      { cache: { ttl: 15 * 60 * 1000 } } as any // Cache for 15 minutes
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
      API_ROUTES.advertisements.running,
      { cache: { ttl: 5 * 60 * 1000 } } as any // Cache for 5 minutes
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
      API_ROUTES.items.trending,
      { cache: true } as any // Default TTL
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
      API_ROUTES.catalog.categories,
      { cache: { ttl: 60 * 60 * 1000 } } as any // Cache for 1 hour
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
      API_ROUTES.recentlyViewed.item,
      { itemId }
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
// ============================================================================
// WISHLIST API
// ============================================================================

export const addToWishlist = async (
  itemId: string
): Promise<ApiResponse<any>> => {
  try {
    // Both functionalities share the same endpoint but different payload formats
    const response = await httpClient.post<ApiResponse<any>>(
      API_ROUTES.recentlyViewed.item,
      { itemId: `wishlistitem${itemId}` }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getWishlist = async (): Promise<
  ApiResponse<{ items: Medicine[] }>
> => {
  try {
    const response = await httpClient.get<ApiResponse<any>>(
      API_ROUTES.items.wishlist,
      { cache: { ttl: 5 * 60 * 1000 } } as any
    );
    const data = response.data;
    // Map response structure: data.data.items or data.items depending on backend wrapping
    const items = data?.data?.items || data?.data || [];

    return {
      success: data?.success ?? true,
      message: data?.message ?? 'Wishlist fetched',
      data: { items: Array.isArray(items) ? items : [] },
    };
  } catch (error) {
    throw error;
  }
};

export const removeWishlistItem = async (
  itemId: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await httpClient.delete<ApiResponse<any>>(
      `${API_ROUTES.items.wishlistRemove}/${itemId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ============================================================================
// SIMILAR PRODUCTS API
// ============================================================================

export interface SimilarProductsResponse {
  sourceProduct: {
    _id: string;
    itemName: string;
    itemCategory: string;
    itemFinalPrice: number;
  };
  items: Medicine[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const getSimilarProducts = async (
  itemId: string
): Promise<ApiResponse<SimilarProductsResponse>> => {
  try {
    const response = await httpClient.get<ApiResponse<SimilarProductsResponse>>(
      `${API_ROUTES.items.similarItems}/${itemId}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};


// search apis
export const getSearchSuggestions = async (
  query: string,
  limit: number = 10
): Promise<ApiResponse<{ suggestions: any[]; cached: boolean; query: string; count?: number }>> => {
  try {
    const response = await httpClient.get<ApiResponse<any>>(
      API_ROUTES.search.suggestions,
      {
        params: { q: query, limit },
      } as any
    );
    const data = response.data;
    const suggestions = data?.data?.suggestions || [];

    return {
      success: data?.success ?? true,
      message: data?.message ?? 'Suggestions fetched',
      data: {
        suggestions: Array.isArray(suggestions) ? suggestions : [],
        cached: data?.data?.cached ?? false,
        query: data?.data?.query ?? query,
        count: data?.data?.count,
      },
    };
  } catch (error) {
    throw error;
  }
};

export const getPopularSearchTerms = async (): Promise<
  ApiResponse<{ terms: any[]; cached: boolean }>
> => {
  try {
    const response = await httpClient.get<ApiResponse<any>>(
      API_ROUTES.search.popularTerms
    );
    const data = response.data;
    const terms = data?.data?.terms || [];

    return {
      success: data?.success ?? true,
      message: data?.message ?? 'Popular terms fetched',
      data: {
        terms: Array.isArray(terms) ? terms : [],
        cached: data?.data?.cached ?? false,
      },
    };
  } catch (error) {
    throw error;
  }
};

// ============================================================================
// RECENT SEARCH API
// ============================================================================

export const getRecentSearches = async (
  limit: number = 10
): Promise<ApiResponse<{ searches: RecentSearch[]; count: number }>> => {
  try {
    const response = await httpClient.get<ApiResponse<any>>(
      API_ROUTES.search.getRecentSearches,
      {
        params: { limit },
      } as any
    );
    const data = response.data;
    const searches = data?.data?.searches || [];

    return {
      success: data?.success ?? true,
      message: data?.message ?? 'Recent searches fetched',
      data: {
        searches: Array.isArray(searches) ? searches : [],
        count: data?.data?.count ?? 0,
      },
    };
  } catch (error) {
    throw error;
  }
};

export const saveRecentSearch = async (data: {
  query: string;
  itemId?: string;
  itemName?: string;
  itemImage?: string;
}): Promise<ApiResponse<{ query: string; saved: boolean }>> => {
  try {
    const response = await httpClient.post<ApiResponse<any>>(
      API_ROUTES.search.recentSearches,
      data
    );
    const resData = response.data;

    return {
      success: resData?.success ?? true,
      message: resData?.message ?? 'Search saved successfully',
      data: resData?.data || { query: data.query, saved: true },
    };
  } catch (error) {
    throw error;
  }
};

export const deleteRecentSearch = async (
  query: string
): Promise<ApiResponse<{ deleted: boolean; query: string }>> => {
  try {
    const response = await httpClient.delete<ApiResponse<any>>(
      `${API_ROUTES.search.recentSearches}/${encodeURIComponent(query)}`
    );
    const data = response.data;

    return {
      success: data?.success ?? true,
      message: data?.message ?? 'Search deleted successfully',
      data: data?.data || { deleted: true, query },
    };
  } catch (error) {
    throw error;
  }
};

export const clearRecentSearches = async (): Promise<
  ApiResponse<{ cleared: boolean }>
> => {
  try {
    const response = await httpClient.delete<ApiResponse<any>>(
      API_ROUTES.search.clearRecentSearches
    );
    const data = response.data;

    return {
      success: data?.success ?? true,
      message: data?.message ?? 'All recent searches cleared',
      data: data?.data || { cleared: true },
    };
  } catch (error) {
    throw error;
  }
};


