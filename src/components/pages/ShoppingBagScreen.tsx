import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BagItem {
  id: string;
  price: number;
  quantity: number;
}

// Calculate bag subtotal
export const calculateBagSubtotal = (items: BagItem[]): number => {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

// Count total items
export const countTotalItems = (items: BagItem[]): number => {
  return items.reduce((count, item) => count + item.quantity, 0);
};

// Check if bag is empty
export const isBagEmpty = (items: BagItem[]): boolean => {
  return items.length === 0;
};

// Get savings amount
export const calculateSavings = (originalTotal: number, currentTotal: number): number => {
  return Math.max(0, originalTotal - currentTotal);
};

const ShoppingBagScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shopping Bag</Text>
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

export default ShoppingBagScreen;
