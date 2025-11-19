import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface UserData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

// Get user initials
export const getUserInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

// Format phone number
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : phone;
};

// Check profile completion
export const getProfileCompletionPercentage = (user: UserData): number => {
  const fields = ['name', 'email', 'phone', 'address'];
  const completed = fields.filter(field => user[field as keyof UserData]).length;
  return (completed / fields.length) * 100;
};

// Mask email
export const maskEmail = (email: string): string => {
  const [name, domain] = email.split('@');
  return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}@${domain}`;
};

const ProfilePage: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
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

export default ProfilePage;
