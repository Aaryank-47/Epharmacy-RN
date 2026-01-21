import React, { useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, StatusBar, Platform, RefreshControl } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../AppNavigator';

import ActionGrid from './ActionGrid';
import PrivacyTermsPage from './PrivacyTermsPage';
import RecentlyViewedSection from '../../components/home/screens/RecentlyViewedSection';
import RecentlyViewedCategory from '../../components/home/screens/RecentlyViewedCategory';
import ProfileCard from './ProfileCard';
import ProfileSkeleton from './ProfileSkeleton';

import { useProfilePageUI } from '../../hooks/useProfilePageUI';

const { width: screenWidth } = Dimensions.get('window');
const getResponsiveSize = (size: number): number => (screenWidth / 375) * size;

interface ContactItemProps {
  icon: string;
  text: string;
  isDark: boolean;
}

const ContactItem: React.FC<ContactItemProps> = React.memo(({ icon, text, isDark }) => (
  <View className="flex-row items-center py-2.5">
    <MaterialCommunityIcons name={icon} size={getResponsiveSize(20)} color={isDark ? '#d77b7bff' : '#e16c61f1'} />
    <Text style={{ fontSize: getResponsiveSize(14), color: isDark ? '#D1D5DB' : '#6B7280' }} className="ml-4">
      {text}
    </Text>
  </View>
));

const ProfilePage: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const {
    userData,
    isDark,
    statusBarStyle,
    personalDetailsExpanded,
    privacyTermsExpanded,
    isManualRefreshing,
    refreshKey,
    isLoading,
    isError,
    error,
    refetch,
    handleRefresh,
    handleLogout,
    togglePersonalDetails,
    togglePrivacyTerms,
    contactItems,
  } = useProfilePageUI();

  // Memoize Navigation Handlers
  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleNavigateNotifications = useCallback(() => navigation.navigate('Notifications'), [navigation]);

  // Memoize Sections to prevent unnecessary re-renders
  const sections = useMemo(() => (
    <>
      <ProfileCard userData={userData} isDark={isDark} refetch={refetch} />

      <ActionGrid />

      {/* Personal Details - Collapsible */}
      <View style={{
        marginHorizontal: screenWidth * 0.04,
        marginBottom: 20,
        padding: screenWidth * 0.05,
        borderRadius: 16,
        backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
      }}>
        <TouchableOpacity
          className="flex-row items-center justify-between py-1.5"
          onPress={togglePersonalDetails}
        >
          <Text style={{ fontSize: 18, color: isDark ? '#FFFFFF' : '#1F2937' }} className="font-bold">
            Personal Details
          </Text>
          <MaterialCommunityIcons
            name={personalDetailsExpanded ? "chevron-up" : "chevron-down"}
            size={24}
            color={isDark ? '#FFFFFF' : '#1F2937'}
          />
        </TouchableOpacity>
        {personalDetailsExpanded && (
          <View className="mt-4">
            {contactItems.map((item, index) => (
              <ContactItem key={`contact-${index}`} icon={item.icon} text={item.text} isDark={isDark} />
            ))}
          </View>
        )}
      </View>

      {/* Recently Viewed Categories Section */}
      <View className="mb-5">
        <RecentlyViewedCategory key={`recent-cat-${refreshKey}`} transparentBackground={true} />
      </View>

      {/* Recently Viewed Section */}
      <View className="mb-5">
        <RecentlyViewedSection key={`recent-${refreshKey}`} transparentBackground={true} />
      </View>

      {/* Privacy & Terms - Collapsible */}
      <View style={{
        marginHorizontal: screenWidth * 0.04,
        marginBottom: 20,
        padding: screenWidth * 0.05,
        borderRadius: 16,
        backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',

      }}>
        <TouchableOpacity
          className="flex-row items-center justify-between py-1.5"
          onPress={togglePrivacyTerms}
        >
          <Text style={{ fontSize: 18, color: isDark ? '#FFFFFF' : '#1F2937' }} className="font-bold">
            Privacy & Terms
          </Text>
          <MaterialCommunityIcons
            name={privacyTermsExpanded ? "chevron-up" : "chevron-down"}
            size={24}
            color={isDark ? '#FFFFFF' : '#1F2937'}
          />
        </TouchableOpacity>
        {privacyTermsExpanded && (
          <PrivacyTermsPage />
        )}
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={{
          width: 50,
          height: 50,
          marginLeft: screenWidth * 0.8,
          backgroundColor: isDark ? '#DC2626' : '#da5959ff',
        }}
        className="rounded-full mb-5 items-center justify-center shadow-lg elevation-5"
        onPress={handleLogout}
      >
        <MaterialCommunityIcons name="logout" size={22} color="#FFFFFF" />
      </TouchableOpacity>

      <Text style={{ color: isDark ? '#666666' : '#9CA3AF' }} className="text-center text-xs mb-2.5">
        MEDICARE+ v3.0.0
      </Text>
    </>
  ), [
    userData,
    isDark,
    refetch,
    personalDetailsExpanded,
    togglePersonalDetails,
    contactItems,
    refreshKey,
    privacyTermsExpanded,
    togglePrivacyTerms,
    handleLogout
  ]);

  if (isLoading || isManualRefreshing) return <ProfileSkeleton />;

  if (isError && error) {
    return (
      <LinearGradient
        colors={isDark ? ['#1A1A1A', '#2A2A2A'] : ['#FFFFFF', '#F8F9FA']}
        className="flex-1 items-center justify-center"
      >
        <MaterialCommunityIcons name="alert-circle-outline" size={64} color={isDark ? '#EF4444' : '#DC2626'} />
        <Text style={{ color: isDark ? '#FFFFFF' : '#1F2937' }} className="text-xl font-bold mt-5">Failed to Load Profile</Text>
        <TouchableOpacity
          style={{ backgroundColor: isDark ? '#DC2626' : '#da5959ff' }}
          className="mt-5 px-5 py-2.5 rounded-2xl"
          onPress={() => refetch()}
        >
          <Text className="text-white font-bold">Retry</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={isDark ? ['#1A1A1A', '#2A2A2A'] : ['#FFFFFF', '#F8F9FA']}
      style={{ flex: 1 }}
    >
      <StatusBar backgroundColor={isDark ? '#1A1A1A' : '#FFFFFF'} barStyle={statusBarStyle} />

      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#000000', '#2A2D35'] : ['#FFFFFF', '#F3F4F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + (-25) : 45,
          borderBottomColor: isDark ? '#3A3A3A' : '#E5E7EB',
          borderBottomWidth: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: screenWidth * 0.04,
          paddingBottom: 15,
        }}
      >
        <TouchableOpacity
          onPress={handleGoBack}
          style={{ backgroundColor: isDark ? '#3A3A3A' : '#F3F4F6' }}
          className="w-10 h-10 rounded-full items-center justify-center"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={isDark ? '#FFFFFF' : '#1F2937'} />
        </TouchableOpacity>
        <Text style={{ color: isDark ? '#FFFFFF' : '#1F2937' }} className="text-xl font-bold">Profile</Text>
        <TouchableOpacity
          className="w-10 items-end justify-center"
          onPress={handleNavigateNotifications}
        >
          <MaterialCommunityIcons name="bell-outline" size={24} color={isDark ? '#FFFFFF' : '#1F2937'} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl
            refreshing={false} // Managed by skeleton for initial load
            onRefresh={handleRefresh}
            tintColor={isDark ? '#FFFFFF' : '#000000'}
            colors={[isDark ? '#FFFFFF' : '#000000']}
          />
        }
      >
        {sections}
      </ScrollView>
    </LinearGradient>
  );
};

export default ProfilePage;