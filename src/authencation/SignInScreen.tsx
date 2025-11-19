import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Validate login credentials
export const validateLoginCredentials = (email: string, password: string): { valid: boolean; error?: string } => {
  if (!email) return { valid: false, error: 'Email is required' };
  if (!password) return { valid: false, error: 'Password is required' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { valid: false, error: 'Invalid email format' };
  if (password.length < 6) return { valid: false, error: 'Password must be at least 6 characters' };
  return { valid: true };
};

// Sanitize email
export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

// Hash password (mock)
export const hashPassword = (password: string): string => {
  // Simple mock hash - in production use proper crypto library
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

const SignInScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>
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
});

export default SignInScreen;
