import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance, EventType, AndroidStyle } from '@notifee/react-native';

// ============================================================================
// CONSTANTS
// ============================================================================

const FCM_TOKEN_KEY = '@fcm_token';
const CHANNEL_ID = 'default';

// ============================================================================
// FIREBASE CLOUD MESSAGING SERVICE - Production Ready
// ============================================================================


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



  private getImageUrl(data?: any, notification?: any): string | null {
    if (notification?.android?.imageUrl) return notification.android.imageUrl;
    if (data?.image) return data.image;

    // Check nested payload
    if (data?.payload) {
   
      if (typeof data.payload === 'string') {
        try {
          const parsed = JSON.parse(data.payload);
          if (parsed?.image) return parsed.image;
        } catch (e) {
        }
      } else if (typeof data.payload === 'object') {
       
        if (data.payload.image) return data.payload.image;
      }
    }
    return null;
  }

  async displayNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      // Basic Android Configuration
      const androidConfig: any = {
        channelId: CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        pressAction: { id: 'default' },
        smallIcon: 'ic_launcher',
      };

      // Extract image
      const imageUrl = this.getImageUrl(data);

    
      if (imageUrl) {
        androidConfig.largeIcon = imageUrl; 
        androidConfig.style = {
          type: AndroidStyle.BIGPICTURE,
          picture: imageUrl,
        };
      }

      await notifee.displayNotification({
        title,
        body,
        data,
        android: androidConfig,
        ios: {
          sound: 'default',
          foregroundPresentationOptions: {
            alert: true,
            badge: true,
            sound: true,
          },
          attachments: imageUrl ? [{ url: imageUrl }] : [],
        },
      });
    } catch (error) {
      // Silent fail
    }
  }

  // ==========================================================================
  // MESSAGE LISTENERS
  // ==========================================================================


  onMessage(callback: (message: any) => void): () => void {
    if (this.onMessageListener) {
      this.onMessageListener();
    }

    const unsubscribe = messaging().onMessage(async (remoteMessage) => {

      if (remoteMessage.notification) {

        const { title, body } = remoteMessage.notification;
        if (title && body) {
          await this.displayNotification(title, body, remoteMessage.data);
        }
      }
      callback(remoteMessage);
    });

    this.onMessageListener = unsubscribe;
    return unsubscribe;
  }


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
  // CLEANUP
  // ==========================================================================

  /**
   * Handle background message (Headless JS)
   * @param remoteMessage - Firebase remote message
   */
  async handleBackgroundMessage(remoteMessage: any): Promise<void> {
    const imageUrl = this.getImageUrl(remoteMessage.data, remoteMessage.notification);

    const androidConfig: any = {
      channelId: CHANNEL_ID,
      importance: AndroidImportance.HIGH,
      pressAction: { id: 'default' },
      smallIcon: 'ic_launcher',
    };

    // Add Big Picture Style if image exists
    if (imageUrl) {
      androidConfig.largeIcon = imageUrl; 
      androidConfig.style = {
        type: AndroidStyle.BIGPICTURE,
        picture: imageUrl,
      };
    }

    // Display notification using Notifee
    await notifee.displayNotification({
      title: remoteMessage.notification?.title || 'Notification',
      body: remoteMessage.notification?.body || 'You have a new notification',
      data: remoteMessage.data,
      android: androidConfig,
      ios: {
        sound: 'default',
        attachments: imageUrl ? [{ url: imageUrl }] : [],
      },
    });
  }

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

