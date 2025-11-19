import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Format currency
export const formatCurrency = (amount: number): string => {
  return `$${amount.toFixed(2)}`;
};

// Check stock availability
export const checkStockAvailability = (quantity: number): 'out' | 'low' | 'available' => {
  if (quantity === 0) return 'out';
  if (quantity < 10) return 'low';
  return 'available';
};

// Calculate final price with discount
export const calculateFinalPrice = (price: number, discountPercent: number): number => {
  return parseFloat((price - (price * discountPercent / 100)).toFixed(2));
};

// Get rating display
export const getRatingDisplay = (rating: number, maxRating: number = 5): string => {
  return `${rating.toFixed(1)} / ${maxRating}`;
};

const ProductDetail: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Product Details</Text>
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

export default ProductDetail;
