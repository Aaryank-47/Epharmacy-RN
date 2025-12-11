import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';

// ============================================================================
// CONSTANTS
// ============================================================================

const FCM_TOKEN_KEY = '@fcm_token';
const CHANNEL_ID = 'default';

// ============================================================================
// FIREBASE CLOUD MESSAGING SERVICE - Production Ready
// ============================================================================

/**
 * Firebase Cloud Messaging (FCM) Service
 * Handles notification permissions, FCM token management, and message listeners
 */
class NotificationService {
  private token: string | null = null;
  private onMessageListener: (() => void) | null = null;
  private onNotificationOpenedListener: (() => void) | null = null;

  constructor() {
    this.setupNotifee();
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  /**
   * Setup Notifee notification channels and event listeners
   * @private
   */
  private async setupNotifee(): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        await notifee.createChannel({
          id: CHANNEL_ID,
          name: 'Default Channel',
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibration: true,
        });
      }

      notifee.onForegroundEvent(({ type }) => {
        if (type === EventType.PRESS) {
          // Handle notification tap - extend as needed for navigation
        }
      });
    } catch (error) {
      // Silent fail - non-critical
    }
  }

  // ==========================================================================
  // PERMISSIONS
  // ==========================================================================

  /**
   * Request notification permissions
   * iOS: Requests user permission
   * Android 13+: Requests POST_NOTIFICATIONS permission
   * @returns {boolean} Permission granted status
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        return (
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL
        );
      } else if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true; // Android < 13 doesn't need runtime permission
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  // ==========================================================================
  // TOKEN MANAGEMENT
  // ==========================================================================

  /**
   * Get FCM token (requests permissions if needed)
   * @returns {string | null} FCM token or null if failed
   */
  async getToken(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const token = await messaging().getToken();
      if (token) {
        this.token = token;
        await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
        return token;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get stored token from AsyncStorage
   * @returns {string | null} Stored FCM token or null
   */
  async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(FCM_TOKEN_KEY);
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete FCM token (call on logout)
   */
  async deleteToken(): Promise<void> {
    try {
      await messaging().deleteToken();
      await AsyncStorage.removeItem(FCM_TOKEN_KEY);
      this.token = null;
    } catch (error) {
      // Silent fail
    }
  }

  /**
   * Get current in-memory token
   * @returns {string | null} Current FCM token or null
   */
  getCurrentToken(): string | null {
    return this.token;
  }

  /**
   * Listen for token refresh events
   * @param callback - Function to call with new token
   * @returns Unsubscribe function
   */
  onTokenRefresh(callback: (token: string) => void): () => void {
    return messaging().onTokenRefresh(async (token) => {
      this.token = token;
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
      callback(token);
    });
  }

  // ==========================================================================
  // NOTIFICATION DISPLAY
  // ==========================================================================

  /**
   * Display local notification using Notifee
   * @param title - Notification title
   * @param body - Notification body
   * @param data - Optional data payload
   */
  async displayNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      await notifee.displayNotification({
        title,
        body,
        data,
        android: {
          channelId: CHANNEL_ID,
          importance: AndroidImportance.HIGH,
          pressAction: { id: 'default' },
          smallIcon: 'ic_launcher',
        },
        ios: {
          sound: 'default',
          foregroundPresentationOptions: {
            alert: true,
            badge: true,
            sound: true,
          },
        },
      });
    } catch (error) {
      // Silent fail
    }
  }

  // ==========================================================================
  // MESSAGE LISTENERS
  // ==========================================================================

  /**
   * Listen for foreground messages
   * @param callback - Function to handle incoming messages
   * @returns Unsubscribe function
   */
  onMessage(callback: (message: any) => void): () => void {
    if (this.onMessageListener) {
      this.onMessageListener();
    }

    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      callback(remoteMessage);
    });

    this.onMessageListener = unsubscribe;
    return unsubscribe;
  }

  /**
   * Listen for notification opened from background
   * @param callback - Function to handle notification open
   * @returns Unsubscribe function
   */
  onNotificationOpenedApp(callback: (message: any) => void): () => void {
    if (this.onNotificationOpenedListener) {
      this.onNotificationOpenedListener();
    }

    const unsubscribe = messaging().onNotificationOpenedApp((remoteMessage) => {
      callback(remoteMessage);
    });

    this.onNotificationOpenedListener = unsubscribe;
    return unsubscribe;
  }

  /**
   * Check if app was opened from notification (quit state)
   * @returns Initial notification or null
   */
  async getInitialNotification(): Promise<any | null> {
    try {
      return await messaging().getInitialNotification();
    } catch (error) {
      return null;
    }
  }

  // ==========================================================================
  // TOPIC SUBSCRIPTION
  // ==========================================================================

  /**
   * Subscribe to FCM topic
   * @param topic - Topic name to subscribe to
   */
  async subscribeToTopic(topic: string): Promise<void> {
    try {
      await messaging().subscribeToTopic(topic);
    } catch (error) {
      
      // Silent fail
    }
  }

  /**
   * Unsubscribe from FCM topic
   * @param topic - Topic name to unsubscribe from
   */
  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(topic);
    } catch (error) {
      // Silent fail
    }
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  /**
   * Clean up all listeners (call on unmount)
   */
  cleanup(): void {
    if (this.onMessageListener) {
      this.onMessageListener();
      this.onMessageListener = null;
    }
    if (this.onNotificationOpenedListener) {
      this.onNotificationOpenedListener();
      this.onNotificationOpenedListener = null;
    }
  }
}

export const notificationService = new NotificationService();

