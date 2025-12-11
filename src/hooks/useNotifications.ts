import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface UseNotificationsOptions {
  backendUrl: string;
  userId?: string;
  autoRegister?: boolean;
  onForegroundMessage?: (message: any) => void;
  onNotificationOpened?: (message: any) => void;
}

interface NotificationState {
  token: string | null;
  permissionGranted: boolean;
  loading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  refreshToken: () => Promise<string | null>;
  registerToken: (fcmToken: string) => Promise<boolean>;
  subscribeToTopic: (topic: string) => Promise<void>;
  unsubscribeFromTopic: (topic: string) => Promise<void>;
}

// ============================================================================
// NOTIFICATION HOOK - Production Ready
// ============================================================================

/**
 * React Hook for managing Firebase Cloud Messaging notifications
 * Handles token management, permissions, and message listeners
 * 
 * @param options - Configuration options for notification setup
 * @returns Notification state and methods
 */
export const useNotifications = ({
  backendUrl,
  autoRegister = true,
  onForegroundMessage,
  onNotificationOpened,
}: UseNotificationsOptions): NotificationState => {
  const [token, setToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Register FCM token with backend API
   * @param fcmToken - FCM device token
   * @returns Success status
   */
  const registerToken = useCallback(async (fcmToken: string): Promise<boolean> => {
    try {
      const authToken = await AsyncStorage.getItem('auth_token');
      
      if (!authToken) {
        return false;
      }

      const response = await axios.post(
        `${backendUrl}/api/v1/notifications/register-token`,
        { token: fcmToken },
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          }
        }
      );

      return response.data.success === true;
    } catch (error: any) {
      setError(error?.message || 'Failed to register token');
      return false;
    }
  }, [backendUrl]);

  /**
   * Initialize notification service
   * Requests permissions and gets FCM token
   */
  const initialize = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const fcmToken = await notificationService.getToken();

      if (fcmToken) {
        setToken(fcmToken);
        setPermissionGranted(true);

        if (autoRegister) {
          await registerToken(fcmToken);
        }
      } else {
        setPermissionGranted(false);
        setError('Failed to get FCM token');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize notifications');
    } finally {
      setLoading(false);
    }
  }, [autoRegister, registerToken]);

  /**
   * Request notification permissions manually
   * @returns Permission granted status
   */
  const requestPermissions = async (): Promise<boolean> => {
    const granted = await notificationService.requestPermissions();
    setPermissionGranted(granted);

    if (granted) {
      const fcmToken = await notificationService.getToken();
      if (fcmToken) {
        setToken(fcmToken);
        if (autoRegister) {
          await registerToken(fcmToken);
        }
      }
    }

    return granted;
  };

  /**
   * Refresh FCM token manually
   * @returns New FCM token or null
   */
  const refreshToken = async (): Promise<string | null> => {
    const fcmToken = await notificationService.getToken();
    if (fcmToken) {
      setToken(fcmToken);
      if (autoRegister) {
        await registerToken(fcmToken);
      }
    }
    return fcmToken;
  };

  /**
   * Subscribe to FCM topic
   * @param topic - Topic name
   */
  const subscribeToTopic = async (topic: string): Promise<void> => {
    await notificationService.subscribeToTopic(topic);
  };

  /**
   * Unsubscribe from FCM topic
   * @param topic - Topic name
   */
  const unsubscribeFromTopic = async (topic: string): Promise<void> => {
    await notificationService.unsubscribeFromTopic(topic);
  };

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  useEffect(() => {
    initialize();

    const unsubscribeOnMessage = notificationService.onMessage((message) => {
      if (onForegroundMessage) {
        onForegroundMessage(message);
      }
    });

    const unsubscribeOnNotificationOpened = notificationService.onNotificationOpenedApp((message) => {
      if (onNotificationOpened) {
        onNotificationOpened(message);
      }
    });

    notificationService.getInitialNotification().then((message) => {
      if (message && onNotificationOpened) {
        onNotificationOpened(message);
      }
    });

    const unsubscribeTokenRefresh = notificationService.onTokenRefresh(async (newToken) => {
      setToken(newToken);
      if (autoRegister) {
        await registerToken(newToken);
      }
    });

    return () => {
      unsubscribeOnMessage();
      unsubscribeOnNotificationOpened();
      unsubscribeTokenRefresh();
      notificationService.cleanup();
    };
  }, [initialize, autoRegister, onForegroundMessage, onNotificationOpened, registerToken]);

  return {
    token,
    permissionGranted,
    loading,
    error,
    initialize,
    requestPermissions,
    refreshToken,
    registerToken,
    subscribeToTopic,
    unsubscribeFromTopic,
  };
};

