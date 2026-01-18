import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../api/notificationApi';
import {
  NotificationLog,
  NotificationLogsResponse,
} from '../../api/types';
import useThemePalette from '../../hooks/useThemePalette';

interface NotificationsScreenProps {
  navigation?: any;
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const { isDark, surfaceColor, primary, statusBarStyle } = useThemePalette();

  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Fetch Notifications
  const fetchNotifications = useCallback(
    async (page = 1, append = false) => {
      try {
        if (!append) setLoading(true);
        else setLoadingMore(true);

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
        // Silent error or minimal alert if critical
        console.error("Failed to fetch notifications", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [filter]
  );

  useEffect(() => {
    fetchNotifications(1, false);
  }, [filter, fetchNotifications]);

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
        if (!notification.isRead) {
          await markNotificationAsRead(notification._id);
          setNotifications((prev) =>
            prev.map((n) =>
              n._id === notification._id ? { ...n, isRead: true } : n
            )
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        if (notification.relatedEntityType === 'Category' && notification.relatedEntity) {
          navigation?.navigate('CategoryDetail', { categoryId: notification.relatedEntity._id });
        } else if (notification.relatedEntityType === 'Advertisement' && notification.relatedEntity) {
          navigation?.navigate('AdvertisementDetail', { adId: notification.relatedEntity._id });
        } else if (notification.relatedEntityType === 'FeaturedMedicine' && notification.relatedEntity) {
          navigation?.navigate('ProductDetail', { productId: notification.relatedEntity._id }); // ensuring param name consistency
        }
      } catch (error) {
        console.error("Navigation/Read error", error);
      }
    },
    [navigation]
  );

  const handleMarkAllAsRead = useCallback(async () => {
    Alert.alert(
      'Mark all read',
      'Are you sure you want to mark all as read?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await markAllNotificationsAsRead();
              setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
              setUnreadCount(0);
            } catch (e) { Alert.alert("Error", "Could not mark all as read"); }
          }
        }
      ]
    );
  }, []);

  // Helpers
  const getIconConfig = (type: string) => {
    switch (type) {
      case 'order': return { name: 'cart-outline', color: '#3B82F6', bg: 'bg-blue-100 dark:bg-blue-900/30' }; // blue
      case 'offer': return { name: 'tag-outline', color: '#10B981', bg: 'bg-emerald-100 dark:bg-emerald-900/30' }; // green
      case 'advertisement': return { name: 'bullhorn-outline', color: '#F59E0B', bg: 'bg-amber-100 dark:bg-amber-900/30' }; // amber
      case 'medicine': return { name: 'medical-bag', color: '#EC4899', bg: 'bg-pink-100 dark:bg-pink-900/30' }; // pink
      default: return { name: 'bell-outline', color: '#6366F1', bg: 'bg-indigo-100 dark:bg-indigo-900/30' }; // indigo
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return diffDays < 7 ? `${diffDays}d ago` : date.toLocaleDateString();
  };

  const renderItem = ({ item }: { item: NotificationLog }) => {
    const config = getIconConfig(item.type);
    const isUnread = !item.isRead;

    return (
      <TouchableOpacity
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
        className={`flex-row items-center p-4 mb-3 mx-4 rounded-2xl border ${isDark
          ? 'bg-[#1E1E1E] border-neutral-800'
          : 'bg-white border-gray-100'
          } ${isUnread ? 'border-l-4 border-l-blue-500' : ''} shadow-sm`}
      >
        {/* Icon */}
        <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${config.bg}`}>
          <MaterialCommunityIcons name={config.name} size={24} color={config.color} />
        </View>

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row justify-between items-start mb-1">
            <Text className={`text-base font-bold flex-1 mr-2 ${isDark ? 'text-gray-100' : 'text-gray-900'} ${isUnread ? '' : 'text-gray-600 dark:text-gray-400'}`}>
              {item.title}
            </Text>
            <Text className="text-xs text-gray-400 font-medium">
              {formatTime(item.sentAt)}
            </Text>
          </View>
          <Text
            className={`text-sm leading-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
            numberOfLines={2}
          >
            {item.body}
          </Text>
        </View>

        {/* Unread Dot (redundant with border-l but good for visibility) */}
        {isUnread && (
          <View className="w-2 h-2 rounded-full bg-blue-500 ml-2 mt-1" />
        )}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View className="items-center justify-center py-20 px-6">
      <View className="w-24 h-24 bg-gray-100 dark:bg-neutral-800 rounded-full items-center justify-center mb-6">
        <Ionicons name="notifications-off-outline" size={48} color={isDark ? '#525252' : '#9CA3AF'} />
      </View>
      <Text className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">No Notifications</Text>
      <Text className="text-center text-gray-500 dark:text-gray-400">
        You're all caught up! notifications will appear here when you have updates.
      </Text>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-gray-50 dark:bg-[#121212]">
      <StatusBar barStyle={statusBarStyle} backgroundColor={surfaceColor} />

      {/* Header */}
      <View className="px-4 pt-2 pb-4 flex-row items-center justify-between  dark:bg-[#1A1A1A] border-b border-gray-100 dark:border-neutral-800">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3 p-1">
            <Ionicons name="arrow-back" size={24} color={isDark ? 'white' : 'black'} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">Notifications</Text>
          {unreadCount > 0 && (
            <View className="bg-red-500 rounded-full px-2 py-0.5 ml-2">
              <Text className="text-white text-xs font-bold">{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={handleMarkAllAsRead} disabled={unreadCount === 0} className={unreadCount === 0 ? 'opacity-50' : ''}>
          <MaterialCommunityIcons name="check-all" size={24} color={isDark ? 'white' : '#1F2937'} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View className="flex-row px-4 py-4 space-x-3">
        {['all', 'unread'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setFilter(tab as 'all' | 'unread')}
            className={`px-5 py-2 rounded-full border ${filter === tab
              ? isDark ? 'bg-white border-white' : 'bg-black border-black'
              : isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-gray-200'
              }`}
          >
            <Text className={`font-semibold capitalize ${filter === tab
              ? isDark ? 'text-black' : 'text-white'
              : isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading && !loadingMore ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={primary || '#000'} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{ paddingBottom: 20, paddingTop: 4 }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator size="small" className="py-4" /> : null}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={isDark ? '#fff' : '#000'}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

export default NotificationsScreen;
