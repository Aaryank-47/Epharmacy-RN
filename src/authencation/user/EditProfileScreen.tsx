import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Validate profile data
export const validateProfileData = (data: {
  name: string;
  email: string;
  phone?: string;
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.name || data.name.length < 2) errors.push('Name must be at least 2 characters');
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push('Invalid email');
  if (data.phone && !/^\d{10}$/.test(data.phone.replace(/\D/g, ''))) errors.push('Invalid phone number');
  
  return { valid: errors.length === 0, errors };
};

// Check for changes
export const hasUnsavedChanges = (original: any, current: any): boolean => {
  return JSON.stringify(original) !== JSON.stringify(current);
};

// Normalize phone number
export const normalizePhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

// Trim all fields
export const trimFormData = (data: Record<string, any>): Record<string, any> => {
  const trimmed: Record<string, any> = {};
  Object.keys(data).forEach(key => {
    trimmed[key] = typeof data[key] === 'string' ? data[key].trim() : data[key];
  });
  return trimmed;
};

const EditProfileScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>
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

export default EditProfileScreen;
