/**
 * NOTIFICATION TEST SCREEN
 * Simple test screen to verify notification API integration
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  getMyNotifications,
  getUnreadCount,
  getUserNotificationStats,
  markAllNotificationsAsRead,
} from '../../api/notificationApi';

const NotificationTestScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    try {
      setLoading(true);
      setResult(`Running ${testName}...`);

      const response = await testFn();

      setResult(
        `✅ ${testName} Success:\n\n${JSON.stringify(response, null, 2)}`
      );
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      setResult(`❌ ${testName} Failed:\n\n${errorMsg}`);
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const tests = [
    {
      name: 'Get My Notifications',
      fn: () => getMyNotifications({ page: 1, limit: 5 }),
    },
    {
      name: 'Get Unread Count',
      fn: () => getUnreadCount(),
    },
    {
      name: 'Get User Stats (7 days)',
      fn: () => getUserNotificationStats('7d'),
    },
    {
      name: 'Get Unread Notifications',
      fn: () => getMyNotifications({ isRead: false, limit: 5 }),
    },
    {
      name: 'Mark All as Read',
      fn: async () => {
        const confirmed = await new Promise((resolve) => {
          Alert.alert(
            'Confirm',
            'Mark all notifications as read?',
            [
              { text: 'Cancel', onPress: () => resolve(false) },
              { text: 'OK', onPress: () => resolve(true) },
            ]
          );
        });
        if (!confirmed) throw new Error('Cancelled by user');
        return markAllNotificationsAsRead();
      },
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Notification API Tests</Text>

      <ScrollView style={styles.buttonContainer}>
        {tests.map((test, index) => (
          <TouchableOpacity
            key={index}
            style={styles.button}
            onPress={() => runTest(test.name, test.fn)}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{test.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.resultContainer}>
        <Text style={styles.resultHeader}>Result:</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : (
          <ScrollView style={styles.resultScroll}>
            <Text style={styles.resultText}>{result || 'No test run yet'}</Text>
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  buttonContainer: {
    flex: 1,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    maxHeight: 300,
  },
  resultHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  resultScroll: {
    flex: 1,
  },
  resultText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
});

export default NotificationTestScreen;
