/**
 * USE NOTIFICATION LOGS HOOK
 * Custom hook for managing notification logs state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getMyNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  NotificationLog,
  GetNotificationsParams,
} from '../api/notificationApi';

// ============================================================================
// TYPES
// ============================================================================

interface UseNotificationLogsReturn {
  notifications: NotificationLog[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchMore: () => Promise<void>;
  hasMore: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

export const useNotificationLogs = (
  params?: GetNotificationsParams
): UseNotificationLogsReturn => {
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ============================================================================
  // FETCH NOTIFICATIONS
  // ============================================================================

  const fetchNotifications = useCallback(
    async (page = 1, append = false) => {
      try {
        setLoading(true);
        setError(null);

        const response = await getMyNotifications({
          ...params,
          page,
          limit: params?.limit || 20,
        });

        if (append) {
          setNotifications((prev) => [...prev, ...response.logs]);
        } else {
          setNotifications(response.logs);
        }

        setCurrentPage(response.pagination.currentPage);
        setTotalPages(response.pagination.totalPages);
        setUnreadCount(response.stats?.unreadLogs || 0);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load notifications');
      } finally {
        setLoading(false);
      }
    },
    [params]
  );

  // Fetch unread count separately
  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (err : any) {
      throw err;
      // Silent fail - non-critical operation
    }
  }, []);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    fetchNotifications(1, false);
  }, [fetchNotifications]);

  // Poll for unread count every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const refreshNotifications = useCallback(async () => {
    await fetchNotifications(1, false);
  }, [fetchNotifications]);

  const fetchMore = useCallback(async () => {
    if (currentPage < totalPages) {
      await fetchNotifications(currentPage + 1, true);
    }
  }, [currentPage, totalPages, fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await markNotificationAsRead(id);

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err: any) {
      throw err;
    }
  }, []);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    fetchMore,
    hasMore: currentPage < totalPages,
  };
};

// ============================================================================
// SIMPLE UNREAD COUNT HOOK
// ============================================================================

export const useUnreadCount = (): {
  unreadCount: number;
  refreshCount: () => Promise<void>;
} => {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshCount = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      throw err;

      // Silent fail - non-critical operation
    }
  }, []);

  useEffect(() => {
    refreshCount();

    // Poll every 30 seconds
    const interval = setInterval(refreshCount, 30000);

    return () => clearInterval(interval);
  }, [refreshCount]);

  return { unreadCount, refreshCount };
};

export default useNotificationLogs;
