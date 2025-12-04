import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRefreshControl } from '../../hooks/useRefreshControl';
import { RefreshControlWrapper } from '../RefreshControlWrapper';
import { useQueryClient } from '@tanstack/react-query';
import Tabs from '../commonPage/Tab';
import HeaderScreen from '../home/screens/HeaderSection';
import HeroSection from '../home/screens/HeroSection';
import CategoriesSection from './screens/CategoriesSection';
// Types
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  featured: boolean;
}

interface ApiResponse {
  featured: string[];
  timestamp: string;
}

// Filter products by category
export const filterProductsByCategory = (products: Product[], category: string): Product[] => {
  return products.filter(product => product.category === category);
};

// Sort products by price
export const sortProductsByPrice = (products: Product[], ascending: boolean = true): Product[] => {
  return [...products].sort((a, b) => 
    ascending ? a.price - b.price : b.price - a.price
  );
};

// Get featured products
export const getFeaturedProducts = (products: Product[], limit: number = 5): Product[] => {
  return products.filter(product => product.featured).slice(0, limit);
};

// Search products by name
export const searchProducts = (products: Product[], query: string): Product[] => {
  return products.filter(product => 
    product.name.toLowerCase().includes(query.toLowerCase())
  );
};

const Home: React.FC = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Test API function - mock data
  const fetchData = useCallback(async (): Promise<void> => {
    try {
      console.log('[HomePage] Fetching data...');
      // Force component remount
      setRefreshKey(prev => prev + 1);

      // Reset queries to clear cache and force loading state (shimmer)
      await queryClient.resetQueries();

      // Simulate API call
      await new Promise<void>((resolve) => setTimeout(resolve, 500));
      setData({
        featured: ['Product 1', 'Product 2', 'Product 3'],
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (error) {
      console.error('[HomePage] Error:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData().then(() => setLoading(false));
  }, [fetchData]);

  // Refresh control hook
  const { isRefreshing, handleRefresh } = useRefreshControl({
    onRefresh: [fetchData],
    minRefreshTime: 1200,
  });

  // Memoized featured products
  const featuredProducts = useMemo(() => {
    if (!data) return [];
    return data.featured;
  }, [data]);

  // Loading state
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600 dark:text-gray-300">
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <Tabs>
        {/* Header */}
        <HeaderScreen />

      <RefreshControlWrapper
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      >

      

        {/* Main Content */}
        <View
          className="flex-1 bg-white dark:bg-gray-900"

        >
          {/* Hero Section with Featured Products and Ads */}
          <HeroSection key={refreshKey} navigation={navigation} />
          <CategoriesSection />
          {/* Header Section */}
          <View className="px-6 pt-6 pb-4">
            <Text className="text-3xl font-bold text-gray-900 dark:text-white">
              Home
            </Text>
            <View className="mt-2 h-1 w-16 bg-blue-500 rounded-full" />
          </View>

          {/* Content Section */}
          <View className="px-6 pb-8">
            {/* Featured Products Section */}
            <Text className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Featured Products
            </Text>

            {data && (
              <View className="space-y-3">
                {featuredProducts.map((product: string, index: number) => (
                  <View
                    key={index}
                    className="flex-row items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
                  >
                    <View className="w-3 h-3 bg-blue-500 rounded-full mr-3" />
                    <Text className="text-base text-gray-700 dark:text-gray-300">
                      {product}
                    </Text>
                  </View>
                ))}

                {/* Timestamp */}
                <View className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                  <Text className="text-sm text-blue-600 dark:text-blue-400 text-center italic">
                    Last updated: {data.timestamp}
                  </Text>
                </View>
              </View>
            )}

            {/* Hint Section */}
            <View className="mt-8 p-5 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl">
              <Text className="text-base text-center text-gray-600 dark:text-gray-400">
                👇 Pull down to refresh
              </Text>
              <Text className="text-xs text-center text-gray-500 dark:text-gray-500 mt-2">
                Swipe down to update content
              </Text>
            </View>

            {/* Quick Stats Section (Optional) */}
            <View className="mt-8">
              <Text className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-4">
                Quick Stats
              </Text>
              <View className="flex-row justify-between">
                <View className="flex-1 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mr-2">
                  <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                    12
                  </Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    Total Products
                  </Text>
                </View>
                <View className="flex-1 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg ml-2">
                  <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                    5
                  </Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    Featured
                  </Text>
                </View>
              </View>
            </View>
             

            {/* Empty State (if no data) */}
            {!data && (
              <View className="mt-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <Text className="text-lg font-medium text-yellow-800 dark:text-yellow-300 text-center">
                  No data available
                </Text>
                <Text className="text-sm text-yellow-600 dark:text-yellow-400 text-center mt-2">
                  Pull to refresh or check your connection
                </Text>
              </View>
            )}
          </View>
        </View>
      </RefreshControlWrapper>
    </Tabs>
  );
};

export default Home;