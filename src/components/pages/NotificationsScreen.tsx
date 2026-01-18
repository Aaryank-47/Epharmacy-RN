import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Alert,
  Image,
  Modal
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
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
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Fetch Notifications
  const fetchNotifications = useCallback(
    async (page = 1, append = false) => {
      try {
        if (!append) setLoading(true);
        else setLoadingMore(true);

        const isRead = filter === 'unread' ? false : filter === 'read' ? true : undefined;

        const response: NotificationLogsResponse = await getMyNotifications({
          page,
          limit: 20,
          isRead,
          sortBy: 'sentAt',
          order: 'desc',
        });


        if (append) {
          setNotifications((prev) => [...prev, ...response.notifications]);
        } else {
          setNotifications(response.notifications);
        }

        setCurrentPage(response.pagination.currentPage);
        setTotalPages(response.pagination.totalPages);

        // Fetch unread count separately as it might not be in the response stats
        getUnreadCount().then(setUnreadCount).catch(console.error);
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

  const handleDeleteNotification = useCallback((id: string) => {
    // Optimistic local delete
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    // Provide a way to undo? For now just local remove as requested.
  }, []);

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
      case 'order': return { name: 'cart', color: '#3B82F6', bg: 'bg-blue-50 dark:bg-blue-900/20' };
      case 'offer': return { name: 'tag', color: '#10B981', bg: 'bg-emerald-50 dark:bg-emerald-900/20' };
      case 'advertisement': return { name: 'bullhorn', color: '#F59E0B', bg: 'bg-amber-50 dark:bg-amber-900/20' };
      case 'medicine': return { name: 'pill', color: '#EC4899', bg: 'bg-pink-50 dark:bg-pink-900/20' };
      default: return { name: 'bell', color: '#6366F1', bg: 'bg-indigo-50 dark:bg-indigo-900/20' };
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return diffDays < 7 ? `${diffDays}d` : date.toLocaleDateString();
  };

  const renderRightActions = (id: string) => {
    return (
      <TouchableOpacity
        onPress={() => handleDeleteNotification(id)}
        className="bg-red-500 justify-center items-center w-20 mb-3 rounded-r-2xl h-full"
        style={{ height: '88%' }} // visual adjustment to match card height
      >
        <Ionicons name="trash-outline" size={24} color="white" />
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: NotificationLog }) => {
    const config = getIconConfig(item.type);
    const isUnread = !item.isRead;
    const hasImage = !!item.payload?.image;

    // Use Swipeable from react-native-gesture-handler
    return (
      // @ts-ignore
      <Swipeable
        renderRightActions={() => renderRightActions(item._id)}
        containerStyle={{ overflow: 'visible' }}
      >
        <TouchableOpacity
          onPress={() => handleNotificationPress(item)}
          activeOpacity={0.9}
          className={`p-4 mb-3 mx-4 rounded-2xl border ${isDark
            ? 'bg-[#1E1E1E] border-neutral-800'
            : 'bg-white border-gray-100'
            } shadow-sm`}
        >
          {/* Header Row: Icon + App/Type Name + Time */}
          <View className="flex-row items-center mb-2">
            <View className={`w-6 h-6 rounded-full items-center justify-center mr-2 ${config.bg}`}>
              <MaterialCommunityIcons name={config.name} size={14} color={config.color} />
            </View>
            <Text className={`text-xs font-semibold mr-1 capitalize ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {item.type.replace('_', ' ')}
            </Text>
            <Text className="text-xs text-gray-400 mx-1">•</Text>
            <Text className="text-xs text-gray-400 flex-1">
              {formatTime(item.sentAt)}
            </Text>
            {isUnread && (
              <View className="w-2 h-2 rounded-full bg-red-500 ml-2" />
            )}
          </View>

          {/* Content Row: Text Left, Image Right */}
          <View className="flex-row items-start">
            <View className="flex-1 mr-3">
              <Text className={`text-[15px] font-bold mb-1 leading-5 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {item.title}
              </Text>
              <Text
                className={`text-[13px] leading-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                numberOfLines={3}
              >
                {item.body}
              </Text>
            </View>

            {hasImage && (
              <TouchableOpacity
                onLongPress={() => setSelectedImage(item.payload.image)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: item.payload.image }}
                  className="w-20 h-14 rounded-lg bg-gray-200 dark:bg-gray-700 border border-gray-100 dark:border-gray-600"
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const renderEmpty = () => (
    <View className="items-center justify-center py-24 px-6 opacity-60">
      <View className="w-20 h-20 bg-gray-100 dark:bg-neutral-800 rounded-full items-center justify-center mb-6">
        <Ionicons name="notifications-outline" size={40} color={isDark ? '#525252' : '#9CA3AF'} />
      </View>
      <Text className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">No Notifications</Text>
      <Text className="text-center text-sm text-gray-500 dark:text-gray-400">
        You're all caught up!
      </Text>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-gray-50 dark:bg-[#121212]">
      <StatusBar barStyle={statusBarStyle} backgroundColor={surfaceColor} />

      {/* Zoom Modal */}
      <Modal visible={!!selectedImage} transparent={true} animationType="fade">
        <View className="flex-1 bg-black/90 justify-center items-center relative">
          <TouchableOpacity
            onPress={() => setSelectedImage(null)}
            className="absolute top-10 right-5 z-10 p-2 bg-white/20 rounded-full"
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={{ width: '100%', height: '80%' }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* Header */}
      <View className="px-3.5 pt-0 pb-2 flex-row items-center justify-between dark:bg-[#121212]">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3 p-1 rounded-full active:bg-gray-100 dark:active:bg-neutral-800">
            <Ionicons name="arrow-back" size={24} color={isDark ? 'white' : 'black'} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</Text>
        </View>
        <TouchableOpacity onPress={handleMarkAllAsRead} disabled={unreadCount === 0} className={`p-2 rounded-full ${unreadCount === 0 ? 'opacity-30' : 'active:bg-gray-100 dark:active:bg-neutral-800'}`}>
          <MaterialCommunityIcons name="check-all" size={24} color={isDark ? 'white' : '#1F2937'} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View className="flex-row px-4 py-3 space-x-2 border-b border-gray-100 dark:border-neutral-800/50 mb-2">
        {['all', 'unread', 'read'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setFilter(tab as 'all' | 'unread' | 'read')}
            className={`px-6 py-3 ml-2 rounded-full border ${filter === tab
              ? 'bg-black dark:bg-white border-black dark:border-white'
              : isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'
              }`}
          >
            <Text className={`text-xs font-semibold capitalize ${filter === tab
              ? 'text-white dark:text-black'
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
