import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Validate card number
export const validateCardNumber = (cardNumber: string): boolean => {
  const cleaned = cardNumber.replace(/\s/g, '');
  return /^\d{13,19}$/.test(cleaned);
};

// Validate CVV
export const validateCVV = (cvv: string, cardType: 'amex' | 'other' = 'other'): boolean => {
  const length = cardType === 'amex' ? 4 : 3;
  return new RegExp(`^\\d{${length}}$`).test(cvv);
};

// Format card number with spaces
export const formatCardNumber = (cardNumber: string): string => {
  return cardNumber.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
};

// Mask card number
export const maskCardNumber = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\s/g, '');
  return `**** **** **** ${cleaned.slice(-4)}`;
};

// Detect card type
export const detectCardType = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\s/g, '');
  if (/^4/.test(cleaned)) return 'Visa';
  if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
  if (/^3[47]/.test(cleaned)) return 'American Express';
  return 'Unknown';
};

const PaymentScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment</Text>
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

export default PaymentScreen;
