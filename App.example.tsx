import React, { useEffect } from 'react';
import { Alert, View, Text, ActivityIndicator } from 'react-native';
import { useNotifications } from './src/hooks/useNotifications';

/**
 * Example App.tsx showing FCM integration
 */
const App = () => {
  const {
    token,
    permissionGranted,
    loading,
    error,
    subscribeToTopic,
    unsubscribeFromTopic,
  } = useNotifications({
    // For Android Emulator use: http://10.0.2.2:5001
    // For iOS Simulator use: http://localhost:5001
    // For Physical Device use: http://YOUR_LOCAL_IP:5001
    backendUrl: 'http://10.0.2.2:5001',
    
    // Optional: Pass userId when user is logged in
    userId: undefined, // Replace with actual userId from your auth state
    
    // Auto-register token with backend
    autoRegister: true,
    
    // Handle foreground notifications
    onForegroundMessage: (message) => {
      Alert.alert(
        message.notification?.title || 'Notification',
        message.notification?.body || '',
        [
          {
            text: 'OK',
            onPress: () => ,
          },
        ]
      );
    },
    
    // Handle notification taps (background/quit state)
    onNotificationOpened: (message) => {
      // Navigate based on notification data
      if (message.data?.screen) {
        // navigation.navigate(message.data.screen, { id: message.data.id });
        }
    },
  });

  useEffect(() => {
    if (token) {
      // Optional: Subscribe to topics
      // subscribeToTopic('all-users');
      // subscribeToTopic('promotions');
    }
  }, [token]);

  useEffect(() => {
    if (error) {
      }
  }, [error]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Initializing notifications...</Text>
      </View>
    );
  }

  // Your existing app content
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>FCM Integration Ready!</Text>
      <Text style={{ marginTop: 10, fontSize: 12 }}>
        Permission: {permissionGranted ? '✅' : '❌'}
      </Text>
      {token && (
        <Text style={{ marginTop: 5, fontSize: 10, padding: 10 }}>
          Token: {token.substring(0, 20)}...
        </Text>
      )}
    </View>
  );
};

export default App;
