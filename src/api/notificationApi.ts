/**
 * NOTIFICATION API SERVICE
 * Handles all notification-related API calls including logs, stats, and read status
 */

import axios from 'axios';
import { API_ROUTES, API_BASE_URL } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create a separate axios instance for notifications using production backend
const notificationClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token interceptor for notification client
notificationClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================================
// TYPES
// ============================================================================

export interface NotificationLog {
  _id: string;
  type: string;
  title: string;
  body: string;
  relatedEntityType?: string;
  status: string;
  payload?: Record<string, any>;
  sentAt: string;
  readAt?: string;
  isRead: boolean;
  createdAt: string;
  relatedEntity?: {
    _id: string;
    name: string;
    isActive?: boolean;
  };
  userInfo?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface NotificationLogsResponse {
  logs: NotificationLog[];
  pagination: PaginationInfo;
  filters?: Record<string, any>;
  meta?: Record<string, any>;
  stats?: {
    totalLogs: number;
    unreadLogs: number;
    readLogs: number;
  };
}

export interface NotificationStats {
  totalNotifications: number;
  unreadCount: number;
  readCount: number;
  notificationsByType: Array<{
    type: string;
    count: number;
  }>;
  recentActivity: Array<{
    date: string;
    count: number;
  }>;
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  type?: string;
  isRead?: boolean;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface MarkMultipleAsReadParams {
  logIds: string[];
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get all active notification logs (admin/public view)
 */
export const getActiveLogs = async (
  params?: GetNotificationsParams
): Promise<NotificationLogsResponse> => {
  const response = await notificationClient.get(API_ROUTES.notifications.activeLogs, {
    params,
  });
  return response.data;
};

/**
 * Get current user's notification logs (requires authentication)
 */
export const getMyNotifications = async (
  params?: GetNotificationsParams
): Promise<NotificationLogsResponse> => {
  const response = await notificationClient.get(
    API_ROUTES.notifications.myNotifications,
    { params }
  );
  return response.data;
};

/**
 * Get a specific notification log by ID
 */
export const getNotificationById = async (
  id: string
): Promise<NotificationLog> => {
  const response = await notificationClient.get(
    `${API_ROUTES.notifications.logById}/${id}`
  );
  return response.data;
};

/**
 * Get user notification statistics
 */
export const getUserNotificationStats = async (
  period: '24h' | '7d' | '30d' = '7d'
): Promise<NotificationStats> => {
  const response = await notificationClient.get(API_ROUTES.notifications.stats, {
    params: { period },
  });
  return response.data;
};

/**
 * Mark a single notification as read
 */
export const markNotificationAsRead = async (
  id: string
): Promise<NotificationLog> => {
  const response = await notificationClient.patch(
    `${API_ROUTES.notifications.markAsRead}/${id}`
  );
  return response.data;
};

/**
 * Mark multiple notifications as read
 */
export const markMultipleNotificationsAsRead = async (
  logIds: string[]
): Promise<{ modifiedCount: number; matchedCount: number }> => {
  const response = await notificationClient.patch(
    API_ROUTES.notifications.markMultipleAsRead,
    { logIds }
  );
  return response.data;
};

/**
 * Mark all notifications as read (fetch all unread and mark them)
 */
export const markAllNotificationsAsRead = async (): Promise<{
  modifiedCount: number;
  matchedCount: number;
}> => {
  // First, fetch all unread notifications
  const unreadNotifications = await getMyNotifications({
    isRead: false,
    limit: 100, // Adjust as needed
  });

  const unreadIds = unreadNotifications.logs.map((log) => log._id);

  if (unreadIds.length === 0) {
    return { modifiedCount: 0, matchedCount: 0 };
  }

  // Mark all unread notifications as read
  return markMultipleNotificationsAsRead(unreadIds);
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get unread notification count
 */
export const getUnreadCount = async (): Promise<number> => {
  const response = await getMyNotifications({
    page: 1,
    limit: 1,
    isRead: false,
  });
  return response.stats?.unreadLogs || 0;
};

/**
 * Check if there are new notifications
 */
export const hasNewNotifications = async (): Promise<boolean> => {
  const count = await getUnreadCount();
  return count > 0;
};

/**
 * Refresh notification list
 */
export const refreshNotifications = async (
  params?: GetNotificationsParams
): Promise<NotificationLogsResponse> => {
  return getMyNotifications({
    ...params,
    page: 1, // Always start from first page on refresh
  });
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  getActiveLogs,
  getMyNotifications,
  getNotificationById,
  getUserNotificationStats,
  markNotificationAsRead,
  markMultipleNotificationsAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
  hasNewNotifications,
  refreshNotifications,
};
