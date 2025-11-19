import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

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
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Home</Text>
      </View>
      <View style={styles.content}>
        <Text>Featured Products</Text>
      </View>
    </ScrollView>
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
});

export default Home;
