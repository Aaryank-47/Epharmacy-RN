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
  useNotifications({
    backendUrl: API_BASE_URL,
    autoRegister: true,
    onForegroundMessage: (message) => {
      // Extract image from either standard field or data
      const image = message.notification?.android?.imageUrl || message.data?.image;

      // Merge image into data for notificationService to pick it up
      const dataWithImage = { ...message.data, ...(image ? { image } : {}) };

      notificationService.displayNotification(
        message.notification?.title || 'Notification',
        message.notification?.body || 'You have a new notification',
        dataWithImage
      );
    },
    onNotificationOpened: (_message) => {
      // Handle notification tap - can be extended for navigation
      // Example: if (_message.data?.screen) navigation.navigate(_message.data.screen);
    },
  });
  return null;
};


export default NotificationSetup;
