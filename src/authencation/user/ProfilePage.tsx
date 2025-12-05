import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
  useColorScheme,
  Alert,
  Animated,
  Easing,
  Image,
  StyleSheet,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../../AppNavigator';
import { getUserProfile } from '../../api/authApi';
import type { UserProfilePayload } from '../../api/types';
import ActionGrid from './ActionGrid';
import PrivacyTermsPage from './PrivacyTermsPage';

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
const COLORS = {
  primary: '#e16c61f1',
  primaryDark: '#d77b7bff',
  primarySculpture: '#cacaca6e',
  primaryLight: '#cfcfcfad',
  white: '#FFFFFF',
  black: '#1F2937',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  darkBg: '#2A2A2A',
  darkBgLight: '#3A3A3A',
};

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

const ContactItem: React.FC<ContactItemProps> = ({ icon, text, isDark }) => (
  <View className="flex-row items-center py-2.5">
    <MaterialCommunityIcons 
      name={icon} 
      size={getResponsiveSize(20)} 
      color={isDark ? COLORS.primaryDark : COLORS.primary} 
    />
    <Text className={`text-sm ml-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
      {text}
    </Text>
  </View>
);

const ProfilePage: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { logout } = useAuth();
  const isDark = useColorScheme() === 'dark';
  const [userData, setUserData] = useState<UserData>(initialUserData);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [personalDetailsExpanded, setPersonalDetailsExpanded] = useState<boolean>(true);

  // Fetch user profile data
    const fetchUserProfile = React.useCallback(async (): Promise<void> => {
      try {
        setLoading(true);
        setError('');
        const response = await getUserProfile();
        
        if (response.success && response.data) {
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
          setUserData(mappedUserData);
        } else {
          // Handle non-success response
          setError(response.message || 'Failed to load profile');
        }
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        
        // Check for JWT expiry errors
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
          // handleTokenExpiry is not provided by AuthContext in current implementation,
          // so fall back to logout to clear session and redirect to auth flow.
          logout();
          return;
        }
        
        // For non-JWT errors, show appropriate message based on status
        const errorMessage = err.response?.status === 500 
          ? 'Server error. Please try again later.' 
          : err.response?.data?.message || err.message || 'Network error. Please try again.';
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }, [logout]);
  
    useEffect(() => {
      fetchUserProfile();
    }, [fetchUserProfile]);

  const getInitials = (name: string): string => {
    if (!name) return '?';
    return name.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const formatAge = (age: number | null, dob: string | null): string => {
    if (age) return `${age} Years`;
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      const calculatedAge = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      return `${calculatedAge} Years`;
    }
    return 'Not specified';
  };

  const formatAddress = (address: Address): string => {
    if (!address || Object.keys(address).length === 0) return 'Not specified';
    const parts: string[] = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.country) parts.push(address.country);
    return parts.join(', ') || 'Not specified';
  };

  const handleLogout = (): void => {
    Alert.alert(
      '🔐 Secure Logout',
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
          onPress: () => {
            console.log('User logged out securely');
            logout();
          },
        },
      ],
      {
        cancelable: true,
        onDismiss: () => console.log('Alert dismissed'),
      }
    );
  };

  const ProfileCard: React.FC<ProfileCardProps> = () => {
    const [cardExpanded, setCardExpanded] = useState<boolean>(false);
    const profilePicScale = new Animated.Value(1);
    const cardBorderRadius = new Animated.Value(16);
    const contentTop = new Animated.Value(80);
  
    const animateCard = (expand: boolean): void => {
      // Separate native and layout animations to avoid conflicts
      const nativeAnimations = [
        Animated.timing(profilePicScale, { 
          toValue: expand ? 0.4 : 1, 
          duration: 500, 
          easing: Easing.out(Easing.ease), 
          useNativeDriver: true 
        }),
      ];
      
      const layoutAnimations = [
        Animated.timing(cardBorderRadius, { 
          toValue: expand ? 55 : 16, 
          duration: 500, 
          easing: Easing.out(Easing.ease), 
          useNativeDriver: false 
        }),
        Animated.timing(contentTop, { 
          toValue: expand ? 20 : 80, 
          duration: 500, 
          easing: Easing.out(Easing.ease), 
          useNativeDriver: false 
        }),
      ];
      
      // Run animations in parallel but separated by driver type
      Animated.parallel([
        Animated.parallel(nativeAnimations),
        Animated.parallel(layoutAnimations)
      ]).start();
      setCardExpanded(expand);
    };

    const socialIcons: string[] = ['instagram', 'twitter', 'github'];
    const profileImageUrl = userData.profileImage && userData.profileImage.length > 0 
      ? userData.profileImage[0] 
      : null;
    
    const userBio = `${userData.role || 'User'} at MEDICARE+ pharmacy. Total orders: ${userData.itemsPurchasedCount || 0}`;
  
    return (
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => animateCard(!cardExpanded)}
        style={[styles.cardContainer, { backgroundColor: isDark ? COLORS.darkBg : COLORS.white }]}
      >
        <Animated.View 
          style={[
            styles.profilePicContainer,
            { 
              transform: [{ scale: profilePicScale }],
              borderRadius: cardExpanded ? 20 : 50,
              borderColor: isDark ? '#c56161ff' : '#fff'
            }
          ]}
        >
          <View style={styles.profilePic}>
            {profileImageUrl ? (
              <Image 
                source={{ uri: profileImageUrl }}
                style={styles.profileImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarText}>{getInitials(userData.name)}</Text>
            )}
          </View>
        </Animated.View>
  
        <Animated.View 
          style={[
            styles.contentContainer,
            { top: contentTop, backgroundColor: isDark ? COLORS.primaryDark : COLORS.primary }
          ]}
        >
          <View style={styles.content}>
            <Text style={styles.userName}>{userData.name || 'User'}</Text>
            <Text style={styles.userBio}>{userBio}</Text>
          </View>
  
          <View style={styles.bottomContainer}>
            <View style={styles.socialLinks}>
              {socialIcons.map((icon) => (
                <TouchableOpacity key={icon}>
                  <MaterialCommunityIcons name={icon} size={getResponsiveSize(30)} color={COLORS.white} />
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={() => navigation.navigate('EditProfile', { userData, refreshProfile: fetchUserProfile })}
            >
              <Text style={styles.contactButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // Skeleton Loading Component
  const SkeletonLoader: React.FC = () => (
    <LinearGradient
      colors={isDark ? ['#1A1A1A', COLORS.darkBg] : [COLORS.white, '#F8F9FA']}
      style={styles.container}
    >
      <StatusBar 
        backgroundColor={isDark ? '#1A1A1A' : COLORS.white} 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
      />
      
      {/* Header Skeleton */}
      <View style={[styles.header, { borderBottomColor: isDark ? COLORS.darkBgLight : '#E5E7EB' }]}>
        <View style={[styles.skeletonButton, { backgroundColor: isDark ? COLORS.darkBgLight : COLORS.lightGray }]} />
        <View style={[styles.skeletonHeaderTitle, { backgroundColor: isDark ? COLORS.darkBgLight : COLORS.lightGray }]} />
        <View style={[styles.skeletonButton, { backgroundColor: isDark ? COLORS.darkBgLight : COLORS.lightGray }]} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card Skeleton */}
        <View style={[styles.cardContainer, { backgroundColor: isDark ? COLORS.darkBg : COLORS.white }]}>
          <View style={[styles.skeletonProfilePic, { backgroundColor: isDark ? COLORS.darkBgLight : COLORS.primarySculpture }]} />
          <View style={[styles.skeletonContentContainer, { backgroundColor: isDark ? COLORS.darkBgLight : COLORS.primarySculpture }]}>
            <View style={styles.skeletonContent}>
              <View style={[styles.skeletonUserName, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]} />
              <View style={[styles.skeletonUserBio, { backgroundColor: 'rgba(63, 60, 60, 0.46)' }]} />
            </View>
            <View style={styles.skeletonBottomContainer}>
              <View style={styles.skeletonSocialLinks}>
                {[1, 2, 3].map((i) => (
                  <View key={i} style={[styles.skeletonSocialIcon, { backgroundColor: 'rgba(109, 105, 105, 0.3)' }]} />
                ))}
              </View>
              <View style={[styles.skeletonContactButton, { backgroundColor: 'rgba(113, 104, 104, 0.4)' }]} />
            </View>
          </View>
        </View>

        {/* Personal Details Skeleton */}
        <View style={[styles.section, { backgroundColor: isDark ? COLORS.darkBg : COLORS.white }]}>
          <View style={[styles.skeletonSectionTitle, { backgroundColor: isDark ? COLORS.darkBgLight : COLORS.lightGray }]} />
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.skeletonContactItem}>
              <View style={[styles.skeletonIcon, { backgroundColor: isDark ? COLORS.darkBgLight : COLORS.lightGray }]} />
              <View style={[styles.skeletonContactText, { backgroundColor: isDark ? COLORS.darkBgLight : COLORS.lightGray }]} />
            </View>
          ))}
        </View>

        {/* Menu Items Skeleton */}
        <View style={styles.menuSection}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <View key={i} style={[styles.menuItem, { backgroundColor: isDark ? COLORS.darkBg : COLORS.white }]}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.skeletonMenuIcon, { backgroundColor: isDark ? COLORS.darkBgLight : COLORS.lightGray }]} />
                <View style={[styles.skeletonMenuText, { backgroundColor: isDark ? COLORS.darkBgLight : COLORS.lightGray }]} />
              </View>
              <View style={[styles.skeletonChevron, { backgroundColor: isDark ? COLORS.darkBgLight : COLORS.lightGray }]} />
            </View>
          ))}
        </View>

        {/* Logout Button Skeleton */}
        <View style={[styles.skeletonLogoutButton, { backgroundColor: isDark ? COLORS.darkBgLight : COLORS.lightGray }]} />
      </ScrollView>
    </LinearGradient>
  );

  // Loading screen
  if (loading) {
    return <SkeletonLoader />;
  }

  // Error screen
  if (error) {
    return (
      <LinearGradient
        colors={isDark ? ['#1A1A1A', COLORS.darkBg] : [COLORS.white, '#F8F9FA']}
        style={[styles.container, styles.centerItems]}
      >
        <MaterialCommunityIcons 
          name="alert-circle-outline" 
          size={getResponsiveSize(64)} 
          color={isDark ? '#EF4444' : '#DC2626'} 
        />
        <Text style={[styles.errorTitle, { color: isDark ? COLORS.white : COLORS.black }]}>
          Failed to Load Profile
        </Text>
        <Text style={[styles.errorText, { color: isDark ? '#CCCCCC' : '#6B7280' }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={styles.circularLogoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name="logout" 
            size={getResponsiveSize(22)} 
            color={COLORS.white} 
          />
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const contactItems = [
    { icon: 'email-outline', text: userData.email || 'Not specified' },
    { icon: 'phone-outline', text: userData.phone || 'Not specified' },
    { icon: 'map-marker-outline', text: formatAddress(userData.address) },
    { icon: 'cake-variant', text: formatAge(userData.age, userData.dob) },
    { icon: 'crown-outline', text: `Role: ${userData.role || 'User'}` },
  ];

  return (
    <LinearGradient
      colors={isDark ? ['#1A1A1A', COLORS.darkBg] : [COLORS.white, '#F8F9FA']}
      style={styles.container}
    >
      <StatusBar 
        backgroundColor={isDark ? '#1A1A1A' : COLORS.white} 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
      />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? COLORS.darkBgLight : '#E5E7EB' }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={[styles.headerButton, { backgroundColor: isDark ? COLORS.darkBgLight : COLORS.lightGray }]}
        >
          <MaterialCommunityIcons name="arrow-left" size={getResponsiveSize(24)} color={isDark ? COLORS.white : COLORS.black} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? COLORS.white : COLORS.black }]}>Profile</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ProfileCard userData={userData} isDark={isDark} />
        {/* ActionGrid  */}
        <ActionGrid isDark={isDark} navigation={navigation} />
        {/* Personal Details - Collapsible */}
        <View style={[styles.section, { backgroundColor: isDark ? COLORS.darkBg : COLORS.white }]}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => setPersonalDetailsExpanded(!personalDetailsExpanded)}
            activeOpacity={0.7}
          >
            <Text style={[styles.sectionTitle, { color: isDark ? COLORS.white : COLORS.black, marginBottom: 0 }]}>
              Personal Details
            </Text>
            <MaterialCommunityIcons 
              name={personalDetailsExpanded ? "chevron-up" : "chevron-down"} 
              size={getResponsiveSize(24)} 
              color={isDark ? COLORS.white : COLORS.black}
              style={[styles.chevronIcon, { 
                transform: [{ rotate: personalDetailsExpanded ? '0deg' : '0deg' }] 
              }]}
            />
          </TouchableOpacity>
          
          {personalDetailsExpanded && (
            <View style={styles.expandableContent}>
              {contactItems.map((item, index) => (
                <ContactItem key={index} icon={item.icon} text={item.text} isDark={isDark} />
              ))}
            </View>
          )}
        </View>

        {/* Privacy & Terms Page */}
        <PrivacyTermsPage isDark={isDark} />

        {/* Circular Logout Button */}
        <TouchableOpacity
          style={[
            styles.circularLogoutButton, 
            { 
              backgroundColor: isDark ? '#DC2626' : '#da5959ff',
              shadowColor: isDark ? '#DC2626' : '#EF4444',
            }
          ]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name="logout" 
            size={getResponsiveSize(22)} 
            color={COLORS.white} 
          />
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: isDark ? '#666666' : '#9CA3AF' }]}>MEDICARE+ v1.0.0</Text>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  // Common styles
  shadow: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  centerItems: { alignItems: 'center', justifyContent: 'center' },
  font: { fontFamily: Platform.OS === 'android' ? 'Roboto' : 'System' },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + (-25) : 45,
    paddingBottom: 15,
    paddingHorizontal: screenWidth * 0.04,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: getResponsiveSize(40),
    height: getResponsiveSize(40),
    borderRadius: getResponsiveSize(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: getResponsiveSize(20), fontWeight: 'bold', flex: 1, textAlign: 'center' },

  // Scroll View
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 30 },

  // Profile Card
  cardContainer: {
    margin: screenWidth * 0.04,
    height: getResponsiveSize(280),
    borderRadius: 32,
    padding: 3,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  profilePicContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: getResponsiveSize(100),
    height: getResponsiveSize(100),
    borderRadius: 50,
    borderWidth: 7,
    zIndex: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  profilePic: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: COLORS.primaryDark,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  avatarText: { color: COLORS.white, fontSize: getResponsiveSize(32), fontWeight: 'bold' },
  contentContainer: {
    position: 'absolute',
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 29,
    borderTopLeftRadius: 70,
    borderTopRightRadius: 30,
    backgroundColor: COLORS.primary,
    padding: getResponsiveSize(20),
    zIndex: 2,
  },
  content: { marginBottom: getResponsiveSize(20) },
  userName: { color: COLORS.white, fontSize: getResponsiveSize(25), fontWeight: 'bold', marginBottom: getResponsiveSize(5), marginTop: 10 },
  userBio: { color: COLORS.white, fontSize: getResponsiveSize(13), opacity: 0.9 },
  bottomContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  socialLinks: { flexDirection: 'row', gap: getResponsiveSize(15) },
  contactButton: { backgroundColor: COLORS.white, paddingHorizontal: getResponsiveSize(15), paddingVertical: getResponsiveSize(8), borderRadius: 20 },
  contactButtonText: { color: COLORS.primary, fontSize: getResponsiveSize(12), fontWeight: 'bold' },

  // Sections
  section: {
    marginHorizontal: screenWidth * 0.04,
    marginBottom: 20,
    padding: screenWidth * 0.05,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: { fontSize: getResponsiveSize(18), fontWeight: 'bold', marginBottom: 15 },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  chevronIcon: {
    marginLeft: 10,
  },
  expandableContent: {
    marginTop: 15,
    overflow: 'hidden',
  },

  // Menu
  menuSection: { marginHorizontal: screenWidth * 0.04, marginBottom: 20 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: screenWidth * 0.04,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },

  // Circular Logout Button
  circularLogoutButton: {
    width: getResponsiveSize(50),
    height: getResponsiveSize(50),
    borderRadius: getResponsiveSize(25),
    marginHorizontal: screenWidth * 0.8,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },

  // Loading and Error States
  errorTitle: { 
    fontSize: getResponsiveSize(20), 
    fontWeight: 'bold', 
    marginTop: 20, 
    textAlign: 'center' 
  },
  errorText: { 
    fontSize: getResponsiveSize(14), 
    marginTop: 10, 
    textAlign: 'center', 
    paddingHorizontal: 20 
  },

  // Version
  versionText: { textAlign: 'center', fontSize: getResponsiveSize(12), marginBottom: 10 },

  // Skeleton Styles
  skeletonButton: {
    width: getResponsiveSize(40),
    height: getResponsiveSize(40),
    borderRadius: getResponsiveSize(20),
    opacity: 0.7,
  },
  skeletonHeaderTitle: {
    width: getResponsiveSize(100),
    height: getResponsiveSize(20),
    borderRadius: 6,
    opacity: 0.7,
  },
  skeletonProfilePic: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: getResponsiveSize(100),
    height: getResponsiveSize(100),
    borderRadius: 50,
    opacity: 0.7,
  },
  skeletonContentContainer: {
    position: 'absolute',
    left: 3,
    right: 3,
    bottom: 3,
    height: getResponsiveSize(160),
    borderRadius: 29,
    borderTopLeftRadius: 70,
    borderTopRightRadius: 30,
    padding: getResponsiveSize(20),
  },
  skeletonContent: {
    marginBottom: getResponsiveSize(20),
    marginTop: 10,
  },
  skeletonUserName: {
    width: getResponsiveSize(150),
    height: getResponsiveSize(25),
    borderRadius: 6,
    marginBottom: getResponsiveSize(8),
  },
  skeletonUserBio: {
    width: getResponsiveSize(200),
    height: getResponsiveSize(14),
    borderRadius: 4,
  },
  skeletonBottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonSocialLinks: {
    flexDirection: 'row',
    gap: getResponsiveSize(15),
  },
  skeletonSocialIcon: {
    width: getResponsiveSize(30),
    height: getResponsiveSize(30),
    borderRadius: 15,
  },
  skeletonContactButton: {
    width: getResponsiveSize(80),
    height: getResponsiveSize(24),
    borderRadius: 12,
  },
  skeletonSectionTitle: {
    width: getResponsiveSize(120),
    height: getResponsiveSize(18),
    borderRadius: 6,
    marginBottom: 15,
    opacity: 0.7,
  },
  skeletonContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  skeletonIcon: {
    width: getResponsiveSize(20),
    height: getResponsiveSize(20),
    borderRadius: 10,
    marginRight: 15,
    opacity: 0.7,
  },
  skeletonContactText: {
    width: getResponsiveSize(180),
    height: getResponsiveSize(14),
    borderRadius: 4,
    opacity: 0.7,
  },
  skeletonMenuIcon: {
    width: getResponsiveSize(40),
    height: getResponsiveSize(40),
    borderRadius: getResponsiveSize(20),
    marginRight: 15,
    opacity: 0.7,
  },
  skeletonMenuText: {
    flex: 1,
    height: getResponsiveSize(16),
    borderRadius: 4,
    opacity: 0.7,
  },
  skeletonChevron: {
    width: getResponsiveSize(20),
    height: getResponsiveSize(20),
    borderRadius: 4,
    opacity: 0.7,
  },
  skeletonLogoutButton: {
    width: getResponsiveSize(50),
    height: getResponsiveSize(50),
    borderRadius: getResponsiveSize(25),
    marginHorizontal: screenWidth * 0.8,
    marginBottom: 20,
    opacity: 0.7,
  },
});

export default ProfilePage;