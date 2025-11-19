import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Get greeting based on time
export const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

// Format welcome message
export const formatWelcomeMessage = (username?: string): string => {
  const greeting = getTimeBasedGreeting();
  return username ? `${greeting}, ${username}!` : `${greeting}!`;
};

// Check if first time user
export const isFirstTimeUser = (lastLogin: Date | null): boolean => {
  return lastLogin === null;
};

const WelcomePage: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{getTimeBasedGreeting()}</Text>
      <Text style={styles.subtitle}>Welcome to E-Pharmacy</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 10,
  },
});

export default WelcomePage;
