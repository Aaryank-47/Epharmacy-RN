import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
  Share,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useThemePalette } from '../../hooks/useThemePalette';
import Icon from 'react-native-vector-icons/Ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'EventDetail'>;

const EventDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { event } = route.params;
  const { isDark } = useThemePalette();
  const [isSaved, setIsSaved] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getMonthDay = (dateString: string) => {
    const date = new Date(dateString);
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: date.getDate(),
    };
  };

  const startDateInfo = getMonthDay(event.startDate);
  // const endDateInfo = getMonthDay(event.endDate);

  const showToast = (message: string) => {
    Alert.alert('Success', message, [{ text: 'OK' }]);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this event: ${event.title}\nDate: ${formatDate(event.startDate)}\nLocation: ${event.eventDetails?.location || 'TBA'}`,
        title: event.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleSaveEvent = () => {
    setIsSaved(!isSaved);
    showToast(isSaved ? 'Event removed from saved' : 'Event saved!');
  };

  const handleAddToCalendar = () => {
    // In a real app, you'd use a calendar integration library
    Alert.alert(
      'Add to Calendar',
      'This will add the event to your calendar',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add', 
          onPress: () => showToast('Event added to calendar!') 
        },
      ]
    );
  };

  const handleViewLocation = () => {
    const address = event.eventDetails?.location || 'West Menlo Park, California';
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(address)}`,
      android: `geo:0,0?q=${encodeURIComponent(address)}`,
    });
    if (url) {
      Linking.openURL(url).catch(() => 
        Alert.alert('Error', 'Unable to open maps')
      );
    }
  };

  const handleRegister = async () => {
    setIsRegistering(true);
    // Simulate API call
    setTimeout(() => {
      setIsRegistering(false);
      Alert.alert(
        'Registration Successful!',
        'You have been registered for this event. Check your email for confirmation.',
        [{ text: 'OK' }]
      );
    }, 1500);
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-[#181A20]' : 'bg-white'}`}>
      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#1E2026', '#181A20'] : ['#FFFFFF', '#F9FAFB']}
        className={`flex-row items-center justify-between px-4 border-b border-black/5 ${Platform.OS === 'ios' ? 'pt-12' : 'pt-4'} pb-4`}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className={`w-10 h-10 rounded-full items-center justify-center ${
            isDark ? 'bg-[#2A2D35]' : 'bg-gray-100'
          }`}
        >
          <Icon
            name="arrow-back"
            size={24}
            color={isDark ? '#FFFFFF' : '#111827'}
          />
        </TouchableOpacity>
        <Text
          className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
        >
          Event Details
        </Text>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={handleSaveEvent}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              isDark ? 'bg-[#2A2D35]' : 'bg-gray-100'
            }`}
            accessibilityLabel={isSaved ? 'Unsave event' : 'Save event'}
          >
            <Icon
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={isSaved ? '#22C55E' : (isDark ? '#FFFFFF' : '#111827')}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleShare}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              isDark ? 'bg-[#2A2D35]' : 'bg-gray-100'
            }`}
            accessibilityLabel="Share event"
          >
            <Icon
              name="share-social-outline"
              size={22}
              color={isDark ? '#FFFFFF' : '#111827'}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Event Image Section */}
        <View className="w-full h-60 bg-gray-100">
          <Image
            source={{ uri: event.imageUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>

        {/* Main Details Section */}
        <View className={`flex-1 -mt-5 rounded-t-3xl pb-5 ${isDark ? 'bg-[#181A20]' : 'bg-white'}`}>
          {/* Event Title and Time */}
          <View className="px-5 pt-5">
            <Text className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {formatTime(event.startDate)} • {event.eventDetails?.location || 'California'}
            </Text>
            <Text className={`text-[28px] font-black tracking-tight mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {event.title}
            </Text>
            <Text className={`text-sm font-medium mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <Icon name="people-circle-outline" size={16} /> {event.eventDetails?.organizer || 'Global Community Events'}
            </Text>
          </View>

          {/* Details Card */}
          <View
            className={`mx-5 mt-5 rounded-2xl p-4 border ${
              isDark ? 'bg-[#1E2026] border-[#2A2D35]' : 'bg-gray-50 border-gray-200'
            }`}
          >
            {/* Event Fee */}
            <View className="flex-row items-center mb-5">
              <View className={`w-14 h-14 rounded-xl items-center justify-center mr-4 ${isDark ? 'bg-[#2A2D35]' : 'bg-white'}`}>
                <Icon name="ticket-outline" size={24} color="#22C55E" />
              </View>
              <View className="flex-1">
                <Text className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Event Fee
                </Text>
                <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  ${event.eventDetails?.fee || event.offerText || '541.00'}
                </Text>
              </View>
            </View>

            {/* Date and Time */}
            <TouchableOpacity 
              className="flex-row items-center mb-5"
              onPress={handleAddToCalendar}
              accessibilityLabel="Add to calendar"
            >
              <View className={`w-14 h-14 rounded-xl items-center justify-center mr-4 ${isDark ? 'bg-[#2A2D35]' : 'bg-white'}`}>
                <View className="items-center justify-center">
                  <Text className={`text-[10px] font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {startDateInfo.month}
                  </Text>
                  <Text className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {startDateInfo.day}
                  </Text>
                </View>
              </View>
              <View className="flex-1">
                <Text className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {formatDate(event.startDate)}
                </Text>
                <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {formatTime(event.startDate)} to {formatTime(event.endDate)}
                </Text>
              </View>
              <Icon name="add-circle-outline" size={20} color="#22C55E" />
            </TouchableOpacity>

            {/* Location */}
            <TouchableOpacity 
              className="flex-row items-center mb-5"
              onPress={handleViewLocation}
              accessibilityLabel="View location on map"
            >
              <View className={`w-14 h-14 rounded-xl items-center justify-center mr-4 ${isDark ? 'bg-[#2A2D35]' : 'bg-white'}`}>
                <Icon name="location-outline" size={24} color="#22C55E" />
              </View>
              <View className="flex-1">
                <Text className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {event.eventDetails?.venue || '94025'}
                </Text>
                <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {event.eventDetails?.location || 'West Menlo Park, California'}
                </Text>
              </View>
              <Icon name="navigate-circle-outline" size={20} color="#22C55E" />
            </TouchableOpacity>
          </View>

          {/* Event Details Section */}
          <View className="px-5 mt-6">
            <Text className={`text-xl font-extrabold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Event Details
            </Text>
            <Text className={`text-[15px] leading-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {event.description}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Button */}
      <View
        className={`absolute bottom-0 left-0 right-0 px-5 py-4 border-t ${
          isDark ? 'bg-[#1E2026] border-[#2A2D35]' : 'bg-white border-gray-200'
        }`}
      >
        <TouchableOpacity 
          className="rounded-[30px] overflow-hidden shadow-lg"
          onPress={handleRegister}
          disabled={isRegistering}
          accessibilityLabel="Register for event"
        >
          <LinearGradient
            colors={['#22C55E', '#16A34A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="flex-row items-center justify-center py-4 gap-2"
          >
            {isRegistering ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text className="text-base font-bold text-white">Registering...</Text>
              </>
            ) : (
              <>
                <Text className="text-base font-bold text-white">Register Now</Text>
                <Icon name="arrow-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default EventDetailScreen;
