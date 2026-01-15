import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
  RefreshControl,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../AppNavigator';

// Components
import ActionGrid from './ActionGrid';
import PrivacyTermsPage from './PrivacyTermsPage';
import RecentlyViewedSection from '../../components/home/screens/RecentlyViewedSection';
import RecentlyViewedCategory from '../../components/home/screens/RecentlyViewedCategory';
import ProfileCard from './ProfileCard';
import ProfileSkeleton from './ProfileSkeleton';

// Hooks
import { useProfilePageUI } from '../../hooks/useProfilePageUI';

// Constants
const { width: screenWidth } = Dimensions.get('window');
const getResponsiveSize = (size: number): number => (screenWidth / 375) * size;

interface ContactItemProps {
  icon: string;
  text: string;
  isDark: boolean;
}

const ContactItem: React.FC<ContactItemProps> = React.memo(({ icon, text, isDark }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
    <MaterialCommunityIcons
      name={icon}
      size={getResponsiveSize(20)}
      color={isDark ? '#d77b7bff' : '#e16c61f1'}
    />
    <Text style={{
      fontSize: getResponsiveSize(14),
      marginLeft: 15,
      color: isDark ? '#D1D5DB' : '#6B7280'
    }}>
      {text}
    </Text>
  </View>
));

const ProfilePage: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // Custom Hook (MVVM Pattern) - Encapsulates all logic
  const {
    userData,
    isDark,
    statusBarStyle,
    personalDetailsExpanded,
    privacyTermsExpanded,
    isManualRefreshing,
    refreshKey,
    isLoading,
    isRefetching,
    isError,
    error,
    refetch,
    handleRefresh,
    handleLogout,
    togglePersonalDetails,
    togglePrivacyTerms,
    contactItems,
  } = useProfilePageUI();

  // Render Skeleton
  if (isLoading || isManualRefreshing) {
    return <ProfileSkeleton />;
  }

  // Render Error
  if (isError && error) {
    return (
      <LinearGradient
        colors={isDark ? ['#1A1A1A', '#2A2A2A'] : ['#FFFFFF', '#F8F9FA']}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        <MaterialCommunityIcons name="alert-circle-outline" size={64} color={isDark ? '#EF4444' : '#DC2626'} />
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 20, color: isDark ? '#FFFFFF' : '#1F2937' }}>
          Failed to Load Profile
        </Text>
        <TouchableOpacity
          style={{
            marginTop: 20,
            paddingHorizontal: 20,
            paddingVertical: 10,
            backgroundColor: isDark ? '#DC2626' : '#da5959ff',
            borderRadius: 20
          }}
          onPress={() => refetch()}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Retry</Text>
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
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: screenWidth * 0.04,
        paddingBottom: 15,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + (-25) : 45,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? '#3A3A3A' : '#E5E7EB',
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? '#3A3A3A' : '#F3F4F6',
          }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={isDark ? '#FFFFFF' : '#1F2937'} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDark ? '#FFFFFF' : '#1F2937' }}>
          Profile
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching || isManualRefreshing}
            onRefresh={handleRefresh}
            tintColor={isDark ? '#FFFFFF' : '#000000'}
            colors={[isDark ? '#FFFFFF' : '#000000']}
          />
        }
      >
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
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 5 }}
            onPress={togglePersonalDetails}
          >
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: isDark ? '#FFFFFF' : '#1F2937' }}>
              Personal Details
            </Text>
            <MaterialCommunityIcons
              name={personalDetailsExpanded ? "chevron-up" : "chevron-down"}
              size={24}
              color={isDark ? '#FFFFFF' : '#1F2937'}
            />
          </TouchableOpacity>
          {personalDetailsExpanded && (
            <View style={{ marginTop: 15 }}>
              {contactItems.map((item, index) => (
                <ContactItem key={index} icon={item.icon} text={item.text} isDark={isDark} />
              ))}
            </View>
          )}
        </View>

        {/* Recently Viewed Categories Section */}
        <View style={{ marginBottom: 20 }}>
          <RecentlyViewedCategory key={`recent-cat-${refreshKey}`} transparentBackground={true} />
        </View>

        {/* Recently Viewed Section */}
        <View style={{ marginBottom: 20 }}>
          <RecentlyViewedSection key={`recent-${refreshKey}`} transparentBackground={true} />
        </View>

        {/* Privacy & Terms - Collapsible */}
        <View style={{
          marginHorizontal: screenWidth * 0.04,
          marginBottom: 20,
          padding: screenWidth * 0.04,
          backgroundColor: isDark ? 'transparent' : '#FFFFFF',
        }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 5 }}
            onPress={togglePrivacyTerms}
          >
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: isDark ? '#FFFFFF' : '#1F2937' }}>
              Privacy & Terms
            </Text>
            <MaterialCommunityIcons
              name={privacyTermsExpanded ? "chevron-up" : "chevron-down"}
              size={24}
              color={isDark ? '#FFFFFF' : '#1F2937'}
            />
          </TouchableOpacity>
          {privacyTermsExpanded && (
            <View style={{ marginTop: 15 }}>
              <PrivacyTermsPage />
            </View>
          )}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            marginLeft: screenWidth * 0.8,
            marginBottom: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? '#DC2626' : '#da5959ff',
            elevation: 5,
          }}
          onPress={handleLogout}
        >
          <MaterialCommunityIcons name="logout" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={{ textAlign: 'center', fontSize: 12, marginBottom: 10, color: isDark ? '#666666' : '#9CA3AF' }}>
          MEDICARE+ v3.0.0
        </Text>
      </ScrollView>
    </LinearGradient>
  );
};

export default React.memo(ProfilePage);