import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRefreshControl } from '../../hooks/useRefreshControl';
import { RefreshControlWrapper } from '../RefreshControlWrapper';

// Filter products by category
export const filterProductsByCategory = (products: any[], category: string): any[] => {
  return products.filter(product => product.category === category);
};

// Sort products by price
export const sortProductsByPrice = (products: any[], ascending: boolean = true): any[] => {
  return [...products].sort((a, b) => 
    ascending ? a.price - b.price : b.price - a.price
  );
};

// Get featured products
export const getFeaturedProducts = (products: any[], limit: number = 5): any[] => {
  return products.filter(product => product.featured).slice(0, limit);
};

// Search products by name
export const searchProducts = (products: any[], query: string): any[] => {
  return products.filter(product => 
    product.name.toLowerCase().includes(query.toLowerCase())
  );
};

const Home: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Test API function - mock data
  const fetchData = useCallback(async () => {
    try {
      console.log('[HomePage] Fetching data...');
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

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <RefreshControlWrapper
      isRefreshing={isRefreshing}
      onRefresh={handleRefresh}
    >
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Home</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          {data && (
            <>
              {data.featured.map((product: string, index: number) => (
                <Text key={index} style={styles.productItem}>
                  • {product}
                </Text>
              ))}
              <Text style={styles.timestamp}>
                Last updated: {data.timestamp}
              </Text>
            </>
          )}
          <Text style={styles.hint}>👇 Pull down to refresh</Text>
        </View>
      </ScrollView>
    </RefreshControlWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  productItem: {
    fontSize: 14,
    marginBottom: 8,
    paddingLeft: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 16,
    fontStyle: 'italic',
  },
  hint: {
    fontSize: 14,
    color: '#666',
    marginTop: 20,
    textAlign: 'center',
  },
});

export default Home;
