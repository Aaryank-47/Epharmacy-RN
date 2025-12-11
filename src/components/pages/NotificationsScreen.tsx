/**
 * NOTIFICATIONS SCREEN
 * Displays user notifications with filtering, pagination, and mark as read functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  NotificationLog,
  NotificationLogsResponse,
} from '../../api/notificationApi';

// ============================================================================
// TYPES
// ============================================================================

interface NotificationsScreenProps {
  navigation?: any;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  navigation,
}) => {
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // ============================================================================
  // FETCH NOTIFICATIONS
  // ============================================================================

  const fetchNotifications = useCallback(
    async (page = 1, append = false) => {
      try {
        if (!append) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const response: NotificationLogsResponse = await getMyNotifications({
          page,
          limit: 20,
          isRead: filter === 'unread' ? false : undefined,
          sortBy: 'sentAt',
          order: 'desc',
        });

        if (append) {
          setNotifications((prev) => [...prev, ...response.logs]);
        } else {
          setNotifications(response.logs);
        }

        setCurrentPage(response.pagination.currentPage);
        setTotalPages(response.pagination.totalPages);
        setUnreadCount(response.stats?.unreadLogs || 0);
      } catch (error: any) {
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Failed to load notifications'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [filter]
  );

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    fetchNotifications(1, false);
  }, [filter, fetchNotifications]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications(1, false);
  }, [fetchNotifications]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && currentPage < totalPages) {
      fetchNotifications(currentPage + 1, true);
    }
  }, [currentPage, totalPages, loadingMore, fetchNotifications]);

  const handleNotificationPress = useCallback(
    async (notification: NotificationLog) => {
      try {
        // Mark as read if not already read
        if (!notification.isRead) {
          await markNotificationAsRead(notification._id);
          
          // Update local state
          setNotifications((prev) =>
            prev.map((n) =>
              n._id === notification._id ? { ...n, isRead: true } : n
            )
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        // Navigate based on notification type or entity
        if (notification.relatedEntityType === 'Category' && notification.relatedEntity) {
          // Navigate to category detail
          navigation?.navigate('CategoryDetail', {
            categoryId: notification.relatedEntity._id,
          });
        } else if (
          notification.relatedEntityType === 'Advertisement' &&
          notification.relatedEntity
        ) {
          // Navigate to advertisement detail
          navigation?.navigate('AdvertisementDetail', {
            adId: notification.relatedEntity._id,
          });
        } else if (
          notification.relatedEntityType === 'FeaturedMedicine' &&
          notification.relatedEntity
        ) {
          // Navigate to medicine detail
          navigation?.navigate('ProductDetail', {
            medicineId: notification.relatedEntity._id,
          });
        }
      } catch (error: any) {
        Alert.alert('Error', 'Failed to mark notification as read', error);
      }
    },
    [navigation]
  );

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      Alert.alert(
        'Mark All as Read',
        'Are you sure you want to mark all notifications as read?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Mark All',
            onPress: async () => {
              try {
                await markAllNotificationsAsRead();
                
                // Update local state
                setNotifications((prev) =>
                  prev.map((n) => ({ ...n, isRead: true }))
                );
                setUnreadCount(0);
                
                Alert.alert('Success', 'All notifications marked as read');
              } catch {
                Alert.alert('Error', 'Failed to mark all as read');
              }
            },
          },
        ]
      );
    } catch (error) {
      throw error;
      // Silent fail - error already handled in Alert
    }
  }, []);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderNotificationItem = useCallback(
    ({ item }: { item: NotificationLog }) => (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.isRead && styles.unreadNotification,
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationIcon}>
          <Icon
            name={getNotificationIcon(item.type)}
            size={24}
            color={item.isRead ? '#999' : '#007AFF'}
          />
        </View>
        <View style={styles.notificationContent}>
          <Text style={[styles.title, !item.isRead && styles.unreadTitle]}>
            {item.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={styles.time}>{formatTime(item.sentAt)}</Text>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    ),
    [handleNotificationPress]
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="bell-off-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>No notifications yet</Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.activeFilter]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'all' && styles.activeFilterText,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'unread' && styles.activeFilter,
          ]}
          onPress={() => setFilter('unread')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'unread' && styles.activeFilterText,
            ]}
          >
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
          >
            <Icon name="check-all" size={20} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={renderNotificationItem}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyList : undefined
        }
      />
    </View>
  );
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getNotificationIcon = (type: string): string => {
  switch (type) {
    case 'category':
      return 'tag-outline';
    case 'advertisement':
      return 'bullhorn-outline';
    case 'medicine':
    case 'featured_medicine':
      return 'pill';
    case 'order':
      return 'cart-outline';
    case 'offer':
      return 'sale';
    default:
      return 'bell-outline';
  }
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeFilter: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
  },
  markAllButton: {
    marginLeft: 'auto',
    padding: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  unreadNotification: {
    backgroundColor: '#f0f8ff',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: '600',
    color: '#000',
  },
  body: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default NotificationsScreen;
