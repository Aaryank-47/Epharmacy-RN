import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Validate email for password reset
export const validateResetEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Generate reset token
export const generateResetToken = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Check token expiry
export const isTokenExpired = (expiryTime: number): boolean => {
  return Date.now() > expiryTime;
};

// Generate OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const ForgetPassword: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>Enter your email to reset your password</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    color: '#666',
  },
});

export default ForgetPassword;
