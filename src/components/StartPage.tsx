import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Get app intro text
export const getIntroText = (): string => {
  return 'Your trusted online pharmacy for all your health needs';
};

// Calculate loading delay
export const getLoadingDelay = (networkSpeed: 'slow' | 'fast'): number => {
  return networkSpeed === 'slow' ? 3000 : 1500;
};

// Check if onboarding completed
export const hasCompletedOnboarding = (storageValue: string | null): boolean => {
  return storageValue === 'completed';
};

const StartPage: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>E-Pharmacy</Text>
      <Text style={styles.description}>{getIntroText()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  description: {
    fontSize: 16,
    color: '#fff',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default StartPage;
