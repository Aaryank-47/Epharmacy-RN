/**
 * EXAMPLE: How to use Refresh Control in your pages
 * Copy this pattern to any page that needs refresh functionality
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRefreshControl } from '../hooks/useRefreshControl';
import { RefreshControlWrapper } from '../components/RefreshControlWrapper';
import useThemePalette from '../hooks/useThemePalette';

// ============================================================================
// EXAMPLE 1: Simple ScrollView with Refresh
// ============================================================================

export const ExampleSimpleRefresh = () => {
  const { isDark } = useThemePalette();
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<any[]>([]);

  // API functions - ye sab refresh hoga
  const fetchProducts = useCallback(async () => {
    console.log('[Refresh] Fetching products...');
    // Your API call here
    // const response = await api.getProducts();
    // setProducts(response);
  }, []);

  const fetchBanner = useCallback(async () => {
    console.log('[Refresh] Fetching banner...');
    // Your banner API call
  }, []);

  const fetchCategories = useCallback(async () => {
    console.log('[Refresh] Fetching categories...');
    // Your categories API call
  }, []);

  // useRefreshControl hook
  const { isRefreshing, handleRefresh } = useRefreshControl({
    onRefresh: [fetchProducts, fetchBanner, fetchCategories],
    minRefreshTime: 1000,
  });

  return (
    <RefreshControlWrapper
      isRefreshing={isRefreshing}
      onRefresh={handleRefresh}
      scrollViewProps={{
        contentContainerStyle: [
          styles.scrollContent,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ],
      }}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>
          Products
        </Text>
      </View>
    </RefreshControlWrapper>
  );
};

// ============================================================================
// EXAMPLE 2: FlatList with Refresh (Most Common)
// ============================================================================

export const ExampleFlatListRefresh = () => {
  const { isDark, ctaGradient } = useThemePalette();
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // API functions
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      console.log('[Refresh] Fetching products...');
      // const response = await api.getProducts();
      // setProducts(response);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBanner = useCallback(async () => {
    console.log('[Refresh] Fetching banner...');
  }, []);

  // useRefreshControl hook
  const { isRefreshing, handleRefresh } = useRefreshControl({
    onRefresh: [fetchProducts, fetchBanner],
    minRefreshTime: 1500,
  });

  return (
    <FlatList
      data={products}
      renderItem={({ item }) => (
        <View style={[styles.productItem, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
          <Text style={{ color: isDark ? '#fff' : '#000' }}>{item.name}</Text>
        </View>
      )}
      keyExtractor={(item, index) => `${item.id}-${index}`}
      onEndReachedThreshold={0.7}
      scrollEventThrottle={16}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={ctaGradient[0]}
          colors={[ctaGradient[0]]}
        />
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={{ color: isDark ? '#999' : '#666' }}>No products found</Text>
        </View>
      }
    />
  );
};

// ============================================================================
// EXAMPLE 3: Advanced Refresh with Auto-Refresh
// ============================================================================

import { useAdvancedRefreshControl } from '../hooks/useAdvancedRefreshControl';

export const ExampleAdvancedRefresh = () => {
  const { isDark } = useThemePalette();
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<any[]>([]);

  const fetchProducts = useCallback(async () => {
    console.log('[Refresh] Fetching products...');
  }, []);

  const fetchBanner = useCallback(async () => {
    console.log('[Refresh] Fetching banner...');
  }, []);

  // Advanced refresh with auto-refresh
  const {
    isRefreshing,
    lastRefreshedAt,
    isError,
    errorMessage,
    handleRefresh,
    clearError,
  } = useAdvancedRefreshControl({
    onRefresh: [fetchProducts, fetchBanner],
    autoRefreshInterval: 30000,
    enableAutoRefresh: false,
    retryCount: 2,
    retryDelay: 1000,
    onRefreshComplete: (success) => {
      console.log('[Refresh] Complete:', success ? 'Success' : 'Failed');
    },
    onError: (error) => {
      console.error('[Refresh] Error:', error);
    },
  });

  return (
    <RefreshControlWrapper
      isRefreshing={isRefreshing}
      onRefresh={handleRefresh}
      scrollViewProps={{
        contentContainerStyle: [
          styles.scrollContent,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ],
      }}
    >
      <View style={styles.content}>
        {lastRefreshedAt && (
          <Text style={[styles.info, { color: isDark ? '#999' : '#666' }]}>
            Last refreshed: {lastRefreshedAt.toLocaleTimeString()}
          </Text>
        )}

        {isError && errorMessage && (
          <View style={[styles.errorBanner, { backgroundColor: '#fee2e2' }]}>
            <Text style={{ color: '#991b1b' }}>{errorMessage}</Text>
            <Text
              style={[styles.retryText, { color: '#1e40af' }]}
              onPress={clearError}
            >
              Dismiss
            </Text>
          </View>
        )}

        <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>
          Products
        </Text>
      </View>
    </RefreshControlWrapper>
  );
};

// ============================================================================
// EXAMPLE 4: Multiple Sections with Refresh
// ============================================================================

export const ExampleMultipleSectionsRefresh = () => {
  const { isDark } = useThemePalette();
  const insets = useSafeAreaInsets();

  // Separate API functions for different sections
  const fetchBanner = useCallback(async () => {
    console.log('[Refresh] Fetching banner...');
  }, []);

  const fetchProducts = useCallback(async () => {
    console.log('[Refresh] Fetching products...');
  }, []);

  const fetchDeals = useCallback(async () => {
    console.log('[Refresh] Fetching deals...');
  }, []);

  const fetchCategories = useCallback(async () => {
    console.log('[Refresh] Fetching categories...');
  }, []);

  // Single refresh call - sab kuch together refresh hoga
  const { isRefreshing, handleRefresh } = useRefreshControl({
    onRefresh: [fetchBanner, fetchProducts, fetchDeals, fetchCategories],
    minRefreshTime: 2000,
  });

  return (
    <RefreshControlWrapper
      isRefreshing={isRefreshing}
      onRefresh={handleRefresh}
      scrollViewProps={{
        contentContainerStyle: [
          styles.scrollContent,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ],
      }}
    >
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
            Featured
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
            Categories
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
            Products
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
            Deals
          </Text>
        </View>
      </View>
    </RefreshControlWrapper>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  productItem: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  info: {
    fontSize: 12,
    marginBottom: 12,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  retryText: {
    fontWeight: '600',
  },
});
