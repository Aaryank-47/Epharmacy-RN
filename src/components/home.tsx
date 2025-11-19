import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Filter products by availability
export const filterAvailableProducts = (products: any[]): any[] => {
  return products.filter(product => product.inStock);
};

// Get trending products
export const getTrendingProducts = (products: any[], limit: number = 10): any[] => {
  return products.sort((a, b) => b.sales - a.sales).slice(0, limit);
};

// Calculate discount percentage
export const getDiscountPercentage = (originalPrice: number, salePrice: number): number => {
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
};

const Home: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default Home;
