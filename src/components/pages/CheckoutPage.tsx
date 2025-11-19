import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Calculate tax
export const calculateTax = (subtotal: number, taxRate: number = 0.08): number => {
  return parseFloat((subtotal * taxRate).toFixed(2));
};

// Calculate shipping fee
export const calculateShippingFee = (subtotal: number, freeShippingThreshold: number = 50): number => {
  return subtotal >= freeShippingThreshold ? 0 : 7.99;
};

// Get order total
export const getOrderTotal = (subtotal: number): number => {
  const tax = calculateTax(subtotal);
  const shipping = calculateShippingFee(subtotal);
  return parseFloat((subtotal + tax + shipping).toFixed(2));
};

// Validate checkout form
export const validateCheckoutForm = (data: { address: string; city: string; zip: string }): boolean => {
  return Boolean(data.address && data.city && data.zip && data.zip.length >= 5);
};

const CheckoutPage: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Checkout</Text>
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

export default CheckoutPage;
