import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Validate registration form
export const validateRegistrationForm = (data: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.name || data.name.length < 2) errors.push('Name must be at least 2 characters');
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push('Invalid email');
  if (!data.password || data.password.length < 8) errors.push('Password must be at least 8 characters');
  if (data.password !== data.confirmPassword) errors.push('Passwords do not match');
  
  return { valid: errors.length === 0, errors };
};

// Check password strength
export const getPasswordStrength = (password: string): number => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  return strength;
};

// Generate username from email
export const generateUsernameFromEmail = (email: string): string => {
  return email.split('@')[0];
};

const SignUpScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>
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

export default SignUpScreen;
