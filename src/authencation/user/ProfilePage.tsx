import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
  Alert,
  Animated,
  Easing,
  Image,
  RefreshControl,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../../AppNavigator';
import { getUserProfile } from '../../api/authApi';
import type { UserProfilePayload } from '../../api/types';
import ActionGrid from './ActionGrid';
import PrivacyTermsPage from './PrivacyTermsPage';
import { notificationService } from '../../services/notificationService';
import { useThemePalette } from '../../hooks/useThemePalette';
import { RefreshControlWrapper } from '../../components/RefreshControlWrapper';
import RecentlyViewedSection from '../../components/home/screens/RecentlyViewedSection';
import RecentlyViewedCategory from '../../components/home/screens/RecentlyViewedCategory';

// Types
interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface UserData {
  name: string;
  email: string;
  phone: string;
  age: number | null;
  dob: string | null;
  role: string;
  address: Address;
  profileImage: string[];
  wishlistCount: number;
  viewedItemsCount: number;
  itemsPurchasedCount: number;
  lastLogin: string | null;
  fcmToken?: string | null;
}

interface ContactItemProps {
  icon: string;
  text: string;
  isDark: boolean;
}

interface ProfileCardProps {
  userData: UserData;
  isDark: boolean;
}

// Constants
const { width: screenWidth } = Dimensions.get('window');
const getResponsiveSize = (size: number): number => (screenWidth / 375) * size;

// Initial user data structure
const initialUserData: UserData = {
  name: '',
  email: '',
  phone: '',
  age: null,
  dob: null,
  role: '',
  address: {},
  profileImage: [],
  wishlistCount: 0,
  viewedItemsCount: 0,
  itemsPurchasedCount: 0,
  lastLogin: null,
};

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
  const { logout } = useAuth();
  const { isDark, statusBarStyle, statusBarBackground } = useThemePalette();
  const [personalDetailsExpanded, setPersonalDetailsExpanded] = useState<boolean>(true);
  const [privacyTermsExpanded, setPrivacyTermsExpanded] = useState<boolean>(true);
  const [isManualRefreshing, setIsManualRefreshing] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Fetch user profile data with React Query
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await getUserProfile();

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load profile');
      }

      // Map API response to UserData interface
      const apiData: UserProfilePayload = response.data;
      const mappedUserData: UserData = {
        name: apiData.name,
        email: apiData.email,
        phone: apiData.phone,
        age: apiData.age,
        dob: apiData.dob,
        role: apiData.role,
        address: apiData.address,
        profileImage: apiData.profileImage,
        wishlistCount: apiData.wishlistCount,
        viewedItemsCount: apiData.viewedItemsCount,
        itemsPurchasedCount: apiData.itemsPurchasedCount,
        lastLogin: apiData.lastLogin,
        fcmToken: apiData.fcmToken,
      };

      return mappedUserData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const userData = data || initialUserData;

  // Handle JWT expiry or errors
  React.useEffect(() => {
    if (isError && error) {
      const err = error as any;
      const isJWTExpired =
        (err.response?.status === 401 || err.response?.status === 500) && (
          err.response?.data?.message === 'jwt expired' ||
          err.response?.data?.message === 'Token expired' ||
          err.response?.data?.message === 'jwt malformed' ||
          err.response?.data?.message === 'invalid token' ||
          (err.response?.data?.message?.toLowerCase?.()?.includes('jwt') &&
            err.response?.data?.message?.toLowerCase?.()?.includes('expired'))
        );

      if (isJWTExpired) {
        console.log('JWT expired caught in profile API - Auto logout');
        logout();
      }
    }
  }, [isError, error, logout]);

  // Handle manual refresh - show skeleton during pull-to-refresh with minimum 2.5 second delay
  const handleRefresh = useCallback(async (): Promise<void> => {
    setIsManualRefreshing(true);
    try {
      // Start both the API call and minimum delay timer
      await Promise.all([
        refetch(),
        new Promise<void>((resolve) => setTimeout(() => resolve(), 2600)) // Minimum 2.6 seconds
      ]);
      setRefreshKey(prev => prev + 1);
    } finally {
      setIsManualRefreshing(false);
    }
  }, [refetch]);

  const getInitials = useCallback((name: string): string => {
    if (!name) return '?';
    return name.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }, []);

  const formatAge = useCallback((age: number | null, dob: string | null): string => {
    if (age) return `${age} Years`;
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      const calculatedAge = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      return `${calculatedAge} Years`;
    }
    return 'Not specified';
  }, []);

  const formatAddress = useCallback((address: Address): string => {
    if (!address || Object.keys(address).length === 0) return 'Not specified';
    const parts: string[] = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.country) parts.push(address.country);
    return parts.join(', ') || 'Not specified';
  }, []);

  const handleLogout = useCallback((): void => {
    Alert.alert(
      ' Secure Logout',
      'You are about to sign out of your MEDICARE+ account. Your session will be terminated securely.\n\nAre you sure you want to continue?',
      [
        {
          text: 'Stay Logged In',
          style: 'cancel',
          onPress: () => console.log('Logout cancelled'),
        },
        {
          text: 'Logout Safely',
          style: 'destructive',
          onPress: async () => {
            console.log('User logged out securely');

            // Delete FCM token before logout
            try {
              await notificationService.deleteToken();
              console.log('✅ FCM token deleted');
            } catch (error) {
              console.error('❌ Error deleting FCM token:', error);
            }

            logout();
          },
        },
      ],
      {
        cancelable: true,
        onDismiss: () => console.log('Alert dismissed'),
      }
    );
  }, [logout]);

  // Memoize contact items - must be before any conditional returns
  const contactItems = useMemo(() => [
    { icon: 'email-outline', text: userData.email || 'Not specified' },
    { icon: 'phone-outline', text: userData.phone || 'Not specified' },
    { icon: 'map-marker-outline', text: formatAddress(userData.address) },
    { icon: 'cake-variant', text: formatAge(userData.age, userData.dob) },
    { icon: 'crown-outline', text: `Role: ${userData.role || 'User'}` },
  ], [userData.email, userData.phone, userData.address, userData.age, userData.dob, userData.role, formatAddress, formatAge]);

  const ProfileCard: React.FC<ProfileCardProps> = React.memo(() => {
    const [cardExpanded, setCardExpanded] = useState<boolean>(false);
    const profilePicScale = React.useRef(new Animated.Value(1)).current;
    const contentTop = React.useRef(new Animated.Value(80)).current;

    const animateCard = useCallback((expand: boolean): void => {
      const nativeAnimations = [
        Animated.timing(profilePicScale, {
          toValue: expand ? 0.5 : 1,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true
        }),
      ];

      const layoutAnimations = [
        Animated.timing(contentTop, {
          toValue: expand ? 60 : 80,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false
        }),
      ];

      Animated.parallel([
        Animated.parallel(nativeAnimations),
        Animated.parallel(layoutAnimations)
      ]).start();
      setCardExpanded(expand);
    }, [profilePicScale, contentTop]);

    const socialIcons: string[] = useMemo(() => ['instagram', 'twitter', 'github'], []);
    const profileImageUrl = useMemo(() =>
      userData.profileImage && userData.profileImage.length > 0 ? userData.profileImage[0] : null,
      [userData.profileImage]
    );

    const userBio = useMemo(() =>
      `${userData.role || 'User'} at MEDICARE+ pharmacy. Total orders: ${userData.itemsPurchasedCount || 0}`,
      [userData.role, userData.itemsPurchasedCount]
    );

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => animateCard(!cardExpanded)}
        style={{
          margin: screenWidth * 0.04,
          height: getResponsiveSize(240),
          borderRadius: 32,
          padding: 3,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.5,
          shadowRadius: 8,
          elevation: 4,
          backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF'
        }}
      >
        <Animated.View
          style={{
            position: 'absolute',
            top: 1,
            left: 10,
            width: getResponsiveSize(100),
            height: getResponsiveSize(100),
            borderRadius: cardExpanded ? 20 : 50,
            borderWidth: 7,
            borderColor: isDark ? '#c56161ff' : '#fff',
            zIndex: 3,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale: profilePicScale }],
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <View style={{
            width: '100%',
            height: '100%',
            borderRadius: 50,
            backgroundColor: '#d77b7bff',
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {profileImageUrl ? (
              <Image
                source={{ uri: profileImageUrl }}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 50
                }}
                resizeMode="cover"
              />
            ) : (
              <Text style={{
                color: '#FFFFFF',
                fontSize: getResponsiveSize(32),
                fontWeight: 'bold'
              }}>{getInitials(userData.name)}</Text>
            )}
          </View>
        </Animated.View>

        <Animated.View
          style={{
            position: 'absolute',
            left: 3,
            right: 3,
            bottom: 3,
            top: contentTop,
            borderRadius: 29,
            borderTopLeftRadius: 70,
            borderTopRightRadius: 30,
            backgroundColor: isDark ? '#d77b7bff' : '#e16c61f1',
            padding: getResponsiveSize(20),
            zIndex: 2,
          }}
        >
          <View style={{ marginBottom: getResponsiveSize(20) }}>
            {!cardExpanded && (
              <Text style={{
                color: '#FFFFFF',
                fontSize: getResponsiveSize(25),
                fontWeight: 'bold',
                marginBottom: getResponsiveSize(5),
                marginTop: 10
              }}>{userData.name || 'User'}</Text>
            )}
            <Text style={{
              color: '#FFFFFF',
              fontSize: getResponsiveSize(13),
              opacity: 0.9
            }}>{userBio}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', gap: getResponsiveSize(15) }}>
              {socialIcons.map((icon) => (
                <TouchableOpacity key={icon}>
                  <MaterialCommunityIcons name={icon} size={getResponsiveSize(30)} color="#FFFFFF" />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: '#FFFFFF',
                paddingHorizontal: getResponsiveSize(15),
                paddingVertical: getResponsiveSize(8),
                borderRadius: 20
              }}
              onPress={() => navigation.navigate('EditProfile', { userData, refreshProfile: refetch })}
            >
              <Text style={{
                color: '#e16c61f1',
                fontSize: getResponsiveSize(12),
                fontWeight: 'bold'
              }}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  });

  // Shimmer Animation
  const shimmerAnimatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isLoading || isManualRefreshing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnimatedValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnimatedValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isLoading, isManualRefreshing, shimmerAnimatedValue]);

  const shimmerOpacity = shimmerAnimatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  // Skeleton Item Component
  const SkeletonItem: React.FC<{ width: number; height: number; borderRadius?: number; style?: any }> = React.memo(
    ({ width, height, borderRadius = 8, style }) => (
      <Animated.View
        style={[
          {
            width,
            height,
            borderRadius,
            backgroundColor: isDark ? '#3A3A3A' : '#E5E7EB',
            opacity: shimmerOpacity,
          },
          style,
        ]}
      />
    )
  );

  // Skeleton Loading Component
  const SkeletonLoader: React.FC = React.memo(() => (
    <LinearGradient
      colors={isDark ? ['#1A1A1A', '#2A2A2A'] : ['#FFFFFF', '#F8F9FA']}
      style={{ flex: 1 }}
    >
      <StatusBar
        backgroundColor={statusBarBackground}
        barStyle={statusBarStyle}
      />

      {/* Header Skeleton */}
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
        <SkeletonItem width={getResponsiveSize(40)} height={getResponsiveSize(40)} borderRadius={getResponsiveSize(20)} />
        <SkeletonItem width={getResponsiveSize(100)} height={getResponsiveSize(20)} borderRadius={6} />
        <SkeletonItem width={getResponsiveSize(40)} height={getResponsiveSize(40)} borderRadius={getResponsiveSize(20)} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Profile Card Skeleton */}
        <View style={{
          margin: screenWidth * 0.04,
          height: getResponsiveSize(280),
          borderRadius: 32,
          padding: 3,
          backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 5,
        }}>
          <SkeletonItem
            width={getResponsiveSize(100)}
            height={getResponsiveSize(100)}
            borderRadius={50}
            style={{ position: 'absolute', top: 10, left: 10, zIndex: 3 }}
          />
          <View style={{
            position: 'absolute',
            left: 3,
            right: 3,
            bottom: 3,
            height: getResponsiveSize(160),
            borderRadius: 29,
            borderTopLeftRadius: 70,
            borderTopRightRadius: 30,
            padding: getResponsiveSize(20),
            backgroundColor: isDark ? '#3A3A3A' : '#E5E7EB',
          }}>
            <View style={{ marginBottom: getResponsiveSize(20), marginTop: 10 }}>
              <SkeletonItem width={getResponsiveSize(150)} height={getResponsiveSize(25)} borderRadius={6} style={{ marginBottom: 8 }} />
              <SkeletonItem width={getResponsiveSize(200)} height={getResponsiveSize(14)} borderRadius={4} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', gap: getResponsiveSize(15) }}>
                {[1, 2, 3].map((i) => (
                  <SkeletonItem key={i} width={getResponsiveSize(30)} height={getResponsiveSize(30)} borderRadius={15} />
                ))}
              </View>
              <SkeletonItem width={getResponsiveSize(80)} height={getResponsiveSize(24)} borderRadius={12} />
            </View>
          </View>
        </View>

        {/* Action Grid Skeleton */}
        <View style={{
          paddingHorizontal: screenWidth * 0.04,
          paddingVertical: getResponsiveSize(12),
          marginBottom: 10
        }}>
          {/* Header Skeleton */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: getResponsiveSize(16)
          }}>
            <SkeletonItem width={getResponsiveSize(120)} height={getResponsiveSize(18)} borderRadius={4} />
            <SkeletonItem width={getResponsiveSize(60)} height={getResponsiveSize(14)} borderRadius={4} />
          </View>

          {/* Action Items Skeleton */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: getResponsiveSize(16)
          }}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={{ alignItems: 'center' }}>
                <SkeletonItem
                  width={getResponsiveSize(56)}
                  height={getResponsiveSize(56)}
                  borderRadius={getResponsiveSize(28)}
                  style={{ marginBottom: getResponsiveSize(8) }}
                />
                <SkeletonItem
                  width={getResponsiveSize(50)}
                  height={getResponsiveSize(14)}
                  borderRadius={4}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Personal Details Skeleton */}
        <View style={{
          marginHorizontal: screenWidth * 0.04,
          marginBottom: 20,
          padding: screenWidth * 0.05,
          borderRadius: 16,
          backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 5,
        }}>
          <SkeletonItem width={getResponsiveSize(120)} height={getResponsiveSize(18)} borderRadius={6} style={{ marginBottom: 15 }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
              <SkeletonItem width={getResponsiveSize(20)} height={getResponsiveSize(20)} borderRadius={10} style={{ marginRight: 15 }} />
              <SkeletonItem width={getResponsiveSize(180)} height={getResponsiveSize(14)} borderRadius={4} />
            </View>
          ))}
        </View>

        {/* Logout Button Skeleton */}
        <SkeletonItem
          width={getResponsiveSize(50)}
          height={getResponsiveSize(50)}
          borderRadius={getResponsiveSize(25)}
          style={{ marginLeft: screenWidth * 0.8, marginBottom: 20 }}
        />
      </ScrollView>
    </LinearGradient>
  ));

  // Loading screen - show skeleton during initial load OR manual refresh
  if (isLoading || isManualRefreshing) {
    return <SkeletonLoader />;
  }

  // Error screen
  if (isError && error) {
    return (
      <LinearGradient
        colors={isDark ? ['#1A1A1A', '#2A2A2A'] : ['#FFFFFF', '#F8F9FA']}
        className="flex-1 items-center justify-center"
      >
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={getResponsiveSize(64)}
          color={isDark ? '#EF4444' : '#DC2626'}
        />
        <Text style={{
          fontSize: getResponsiveSize(20),
          fontWeight: 'bold',
          marginTop: 20,
          textAlign: 'center',
          color: isDark ? '#FFFFFF' : '#1F2937'
        }}>
          Failed to Load Profile
        </Text>
        <Text style={{
          fontSize: getResponsiveSize(14),
          marginTop: 10,
          textAlign: 'center',
          paddingHorizontal: 20,
          color: isDark ? '#D1D5DB' : '#6B7280'
        }}>
          {(error as any)?.message || 'An error occurred'}
        </Text>
        <TouchableOpacity
          style={{
            width: getResponsiveSize(120),
            height: getResponsiveSize(40),
            borderRadius: 20,
            marginTop: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? '#DC2626' : '#da5959ff',
            shadowColor: isDark ? '#DC2626' : '#EF4444',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 5,
          }}
          onPress={() => refetch()}
          activeOpacity={0.7}
        >
          <Text style={{ color: '#FFFFFF', fontSize: getResponsiveSize(14), fontWeight: 'bold' }}>
            Retry
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  // Main render
  return (
    <LinearGradient
      colors={isDark ? ['#1A1A1A', '#2A2A2A'] : ['#FFFFFF', '#F8F9FA']}
      style={{ flex: 1 }}
    >
      <StatusBar
        backgroundColor={statusBarBackground}
        barStyle={statusBarStyle}
      />

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: screenWidth * 0.04,
          paddingBottom: 15,
          paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + (-25) : 45,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? '#3A3A3A' : '#E5E7EB',
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: getResponsiveSize(40),
            height: getResponsiveSize(40),
            borderRadius: getResponsiveSize(20),
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? '#3A3A3A' : '#F3F4F6',
          }}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={getResponsiveSize(24)}
            color={isDark ? '#FFFFFF' : '#1F2937'}
          />
        </TouchableOpacity>
        <Text style={{
          fontSize: getResponsiveSize(20),
          fontWeight: 'bold',
          flex: 1,
          textAlign: 'center',
          color: isDark ? '#FFFFFF' : '#1F2937'
        }}>
          Profile
        </Text>
        <View style={{ width: getResponsiveSize(40), height: getResponsiveSize(40) }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
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
        <ProfileCard userData={userData} isDark={isDark} />

        {/* ActionGrid */}
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
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 5,
            }}
            onPress={() => setPersonalDetailsExpanded(!personalDetailsExpanded)}
            activeOpacity={0.7}
          >
            <Text style={{
              fontSize: getResponsiveSize(18),
              fontWeight: 'bold',
              color: isDark ? '#FFFFFF' : '#1F2937'
            }}>
              Personal Details
            </Text>
            <MaterialCommunityIcons
              name={personalDetailsExpanded ? "chevron-up" : "chevron-down"}
              size={getResponsiveSize(24)}
              color={isDark ? '#FFFFFF' : '#1F2937'}
              style={{ marginLeft: 10 }}
            />
          </TouchableOpacity>

          {personalDetailsExpanded && (
            <View style={{ marginTop: 15, overflow: 'hidden' }}>
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
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 5,
            }}
            onPress={() => setPrivacyTermsExpanded(!privacyTermsExpanded)}
            activeOpacity={0.7}
          >
            <Text style={{
              fontSize: getResponsiveSize(18),
              fontWeight: 'bold',
              color: isDark ? '#FFFFFF' : '#1F2937'
            }}>
              Privacy & Terms
            </Text>
            <MaterialCommunityIcons
              name={privacyTermsExpanded ? "chevron-up" : "chevron-down"}
              size={getResponsiveSize(24)}
              color={isDark ? '#FFFFFF' : '#1F2937'}
              style={{ marginLeft: 10 }}
            />
          </TouchableOpacity>

          {privacyTermsExpanded && (
            <View style={{ marginTop: 15, overflow: 'hidden' }}>
              <PrivacyTermsPage isDark={isDark} />
            </View>
          )}
        </View>

        {/* Circular Logout Button */}
        <TouchableOpacity
          style={{
            width: getResponsiveSize(50),
            height: getResponsiveSize(50),
            borderRadius: getResponsiveSize(25),
            marginLeft: screenWidth * 0.8,
            marginBottom: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? '#DC2626' : '#da5959ff',
            shadowColor: isDark ? '#DC2626' : '#EF4444',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 5,
          }}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="logout"
            size={getResponsiveSize(22)}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <Text style={{
          textAlign: 'center',
          fontSize: getResponsiveSize(12),
          marginBottom: 10,
          color: isDark ? '#666666' : '#9CA3AF'
        }}>
          MEDICARE+ v1.0.0
        </Text>
      </ScrollView>
    </LinearGradient >
  );
};

export default React.memo(ProfilePage);