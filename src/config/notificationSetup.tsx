/**
 * NOTIFICATION INITIALIZATION
 * Handles FCM notification setup, token registration, and message listeners
 * Extracted from App.tsx for cleaner architecture
 */

import React from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { API_BASE_URL } from '../api/config';
import { notificationService } from '../services/notificationService';

// ============================================================================
// NOTIFICATION SETUP COMPONENT
// ============================================================================

/**
 * NotificationSetup Component
 * Initializes and manages FCM notifications for the application
 * Should be mounted once at the app root level
 */
export const NotificationSetup: React.FC = () => {
  // Initialize notifications with configuration
  useNotifications({
    backendUrl: API_BASE_URL,
    autoRegister: true,
    onForegroundMessage: (message) => {
      // Display notification using Notifee for rich styling when app is in foreground
      notificationService.displayNotification(
        message.notification?.title || 'Notification',
        message.notification?.body || 'You have a new notification',
        message.data
      );
    },
    onNotificationOpened: (_message) => {
      // Handle notification tap - can be extended for navigation
      // Example: if (_message.data?.screen) navigation.navigate(_message.data.screen);
    },
  });

  // This component doesn't render anything
  return null;
};

// ============================================================================
// EXPORT
// ============================================================================

export default NotificationSetup;
