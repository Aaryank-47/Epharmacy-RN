import httpClient from './httpClient';
import { API_ROUTES } from './config';
import type { NotificationLog, NotificationLogsResponse, NotificationStats, GetNotificationsParams } from './types';

// ============================================================================
// NOTIFICATION API
// ============================================================================

export const getActiveLogs = async (params?: GetNotificationsParams): Promise<NotificationLogsResponse> => {
  const response = await httpClient.get(API_ROUTES.notifications.activeLogs, { params });
  return response.data;
};

export const getMyNotifications = async (params?: GetNotificationsParams): Promise<NotificationLogsResponse> => {
  const response = await httpClient.get(API_ROUTES.notifications.myNotifications, { params });
  return response.data;
};

export const getNotificationById = async (id: string): Promise<NotificationLog> => {
  const response = await httpClient.get(`${API_ROUTES.notifications.logById}/${id}`);
  return response.data;
};

export const getUserNotificationStats = async (period: '24h' | '7d' | '30d' = '7d'): Promise<NotificationStats> => {
  // Cache stats for 1 minute to avoid spamming
  const response = await httpClient.get(API_ROUTES.notifications.stats, {
    params: { period },
    cache: { ttl: 60 * 1000 }
  } as any);
  return response.data;
};

export const markNotificationAsRead = async (id: string): Promise<NotificationLog> => {
  const response = await httpClient.patch(`${API_ROUTES.notifications.markAsRead}/${id}`);
  return response.data;
};

export const markMultipleNotificationsAsRead = async (
  logIds: string[]
): Promise<{ modifiedCount: number; matchedCount: number }> => {
  const response = await httpClient.patch(API_ROUTES.notifications.markMultipleAsRead, { logIds });
  return response.data;
};

export const markAllNotificationsAsRead = async (): Promise<{ modifiedCount: number; matchedCount: number }> => {
  const unreadNotifications = await getMyNotifications({ isRead: false, limit: 100 });
  const unreadIds = unreadNotifications.logs.map((log) => log._id);

  if (unreadIds.length === 0) return { modifiedCount: 0, matchedCount: 0 };
  return markMultipleNotificationsAsRead(unreadIds);
};

// ============================================================================
// HELPERS
// ============================================================================

export const getUnreadCount = async (): Promise<number> => {
  const response = await getMyNotifications({ page: 1, limit: 1, isRead: false });
  // Safely handle optional chaining if stats might be missing
  return (response as any).stats?.unreadLogs || 0;
};

export const hasNewNotifications = async (): Promise<boolean> => {
  const count = await getUnreadCount();
  return count > 0;
};

export const refreshNotifications = async (params?: GetNotificationsParams): Promise<NotificationLogsResponse> => {
  return getMyNotifications({ ...params, page: 1 });
};

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
