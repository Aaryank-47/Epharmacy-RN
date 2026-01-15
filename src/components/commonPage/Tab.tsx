/**
 * BOTTOM TABS NAVIGATION COMPONENT
 * Proper Bottom Navigation that works like standard mobile apps
 * - Always stays at bottom
 * - Content scrolls above it
 * - Works with any page layout
 */

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  Animated,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { useThemePalette } from '../../hooks/useThemePalette';
import { getUserProfile } from '../../api/authApi';
import { useCart } from '../../context/CartContext';
import ExploreOverlay from './ExploreOverlay';
import AiChatSupport from '../AiChatSupport';
import QROptionsBottomSheet from '../qr/QROptionsBottomSheet';
import ScrollToTopButton from './ScrollToTopButton';


// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

interface TabConfig {
  readonly name: string;
  readonly screenName: string;
  readonly icon: string;
  readonly iconOutline: string;
  readonly isProfile?: boolean;
}

interface UserData {
  readonly name: string;
  readonly profileImage: string | null;
}

interface AsyncStorageError {
  readonly code: string;
  readonly message: string;
}

// Query keys for React Query
const QUERY_KEYS = {
  userData: ['userData'],
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getInitials = (name: string): string => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

/**
 * Load user data from localStorage first, then fetch fresh data from API
 */
const fetchUserDataFromStorage = async (): Promise<UserData> => {
  try {
    // Try multiple localStorage sources for initial data
    const sources = await Promise.all([
      AsyncStorage.getItem('auth_user'),
      AsyncStorage.getItem('jwtToken'),
      AsyncStorage.getItem('userProfile'),
    ]);

    const [authUserData, jwtData, userProfileData] = sources;

    // Check userProfile first
    if (userProfileData) {
      try {
        const profile = JSON.parse(userProfileData);
        return {
          name: profile.name || 'User',
          profileImage: Array.isArray(profile.profileImage)
            ? profile.profileImage[0]
            : profile.profileImage || profile.avatar || null,
        };
      } catch (parseError) {
      }
    }

    // Check auth_user
    if (authUserData) {
      try {
        const user = JSON.parse(authUserData);
        return {
          name: user.name || 'User',
          profileImage: user.avatar || user.profileImage?.[0] || null,
        };
      } catch (parseError) {
      }
    }

    // Check jwtToken
    if (jwtData) {
      try {
        const parsedData = JSON.parse(jwtData);
        if (parsedData.user) {
          return {
            name: parsedData.user.name || 'User',
            profileImage: parsedData.user.profileImage?.[0] || null,
          };
        }
      } catch (parseError) {
      }
    }

    return { name: 'User', profileImage: null };
  } catch (error) {
    const err = error as AsyncStorageError;
    return { name: 'User', profileImage: null };
  }
};

/**
 * Fetch latest user data from API
 */
const fetchUserDataFromAPI = async (): Promise<UserData> => {
  try {
    const response = await getUserProfile();

    if (response.success && response.data) {
      const apiData = response.data;
      // Save updated data to localStorage for next time
      const updatedProfile = {
        name: apiData.name,
        profileImage: apiData.profileImage,
        avatar: apiData.profileImage?.[0] || null,
      };
      await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));

      return {
        name: apiData.name || 'User',
        profileImage: Array.isArray(apiData.profileImage)
          ? apiData.profileImage[0]
          : apiData.profileImage || null,
      };
    }

    return { name: 'User', profileImage: null };
  } catch (error) {
    // Return localStorage data as fallback
    return fetchUserDataFromStorage();
  }
};

// ============================================================================
// PROFILE TAB ICON COMPONENT
// ============================================================================

interface ProfileTabIconProps {
  readonly isActive: boolean;
  readonly userData: UserData;
  readonly size?: number;
  readonly isDark?: boolean;
}

const ProfileTabIcon = memo<ProfileTabIconProps>(({
  isActive,
  userData,
  size = 32,
  isDark = false
}) => {
  if (!userData) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#CCCCCC',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontWeight: 'bold', color: 'white', fontSize: size * 0.4 }}>
          ?
        </Text>
      </View>
    );
  }

  const borderColor = isActive ? '#f472b6' : '#D1D5DB';
  const bgColor = isActive ? '#f472b6' : '#D1D5DB';

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderColor,
        borderWidth: isActive ? 2 : 1,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {userData.profileImage ? (
        <Image
          source={{ uri: userData.profileImage }}
          style={{
            width: size - 4,
            height: size - 4,
            borderRadius: (size - 4) / 2,
          }}
          onError={() => {
          }}
        />
      ) : (
        <View
          style={{
            backgroundColor: bgColor,
            width: size,
            height: size,
            borderRadius: size / 2,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontWeight: 'bold',
              color: 'white',
              fontSize: size * 0.4,
              textAlign: 'center',
            }}
          >
            {getInitials(userData.name)}
          </Text>
        </View>
      )}
    </View>
  );
});

// ============================================================================
// BOTTOM TAB BAR COMPONENT
// ============================================================================

interface TabBarProps {
  readonly tabs: readonly TabConfig[];
  readonly state: { readonly routes: readonly { readonly name: string }[] };
  readonly activeTab: string;
  readonly setActiveTab: (tab: string) => void;
  readonly userData: UserData;
  readonly onNavigate: (screenName: string) => void;
  readonly onTabReselect?: (tabName: string) => void;
  readonly isLoading?: boolean;
  readonly translateY?: Animated.Value | Animated.AnimatedInterpolation<string | number>;
}

const TabBar = memo<TabBarProps>(({
  state,
  tabs,
  activeTab,
  setActiveTab,
  userData,
  onNavigate,
  onTabReselect,
  isLoading = false,
  translateY = new Animated.Value(0),
}) => {
  const { isDark, accentColor } = useThemePalette();
  const { items } = useCart(); // Access cart items
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);

  const bottomInset = insets.bottom;

  const isTabActive = useCallback(
    (tab: TabConfig): boolean => activeTab === tab.name,
    [activeTab]
  );

  const getActiveColor = useCallback((isActive: boolean): string => {
    if (isActive) return accentColor;
    return isDark ? '#9CA3AF' : '#6B7280';
  }, [isDark, accentColor]);

  const handleTabPress = useCallback(
    (tab: TabConfig) => {
      if (isLoading) return;

      try {
        if (tab.name === activeTab) {
          onTabReselect?.(tab.name);
          return;
        }

        setActiveTab(tab.name);
        if (tab.screenName) {
          onNavigate(tab.screenName);
        }
      } catch (error) {
      }
    },
    [setActiveTab, onNavigate, isLoading, activeTab, onTabReselect]
  );

  // If we have a bottom inset (Gesture Nav), use standard height.
  // If no inset (Button Nav), reduce height to be more compact.
  const isGestureNav = bottomInset > 45;
  const TAB_CONTENT_HEIGHT = isGestureNav ? 20 : 69;

  const effectiveBottomPadding = isGestureNav ? bottomInset : 4;

  const tabBarHeight = TAB_CONTENT_HEIGHT + effectiveBottomPadding;

  const borderColor = isDark ? '#374151' : '#E5E7EB';

  // Gradient colors for tab bar
  const gradientColors = useMemo(() => {
    if (isDark) {
      return ['#0F1419', '#292929']; // Dark task bar to lighter dark
    }
    return ['#F3F4F6', '#F9FAFB']; // Light gray to lighter gray
  }, [isDark]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        transform: [{ translateY }],
        zIndex: 100,
      }}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          borderTopColor: borderColor,
          borderTopWidth: 0.3,
          paddingBottom: effectiveBottomPadding,
          paddingTop: 8,
          paddingHorizontal: screenWidth * 0.02,
          height: tabBarHeight,
          flexDirection: 'row',
          shadowOpacity: 0.06,
          shadowRadius: 3,
          elevation: 8,
        }}
      >
        {state.routes.map((route, index) => {
          const currentTab = tabs.find((tab) => tab.name === route.name);
          if (!currentTab) return null;

          const isActive = isTabActive(currentTab);
          const activeColor = getActiveColor(isActive);
          const iconName = isActive ? currentTab.icon : currentTab.iconOutline;

          return (
            <TouchableOpacity
              key={`${route.name}-${index}`}
              onPress={() => handleTabPress(currentTab)}
              activeOpacity={0.6}
              disabled={isLoading}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {currentTab.isProfile ? (
                <ProfileTabIcon
                  isActive={isActive}
                  userData={userData}
                  size={Math.min(screenWidth * 0.08, 32)}
                  isDark={isDark}
                />
              ) : (
                <Icon
                  name={iconName || 'circle'}
                  size={Math.min(screenWidth * 0.064, 26)}
                  color={activeColor}
                />
              )}

              {/* Cart Badge */}
              {currentTab.name === 'Cart' && cartItemCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: screenWidth * 0.05, // Adjust based on icon position
                    backgroundColor: '#EF4444',
                    borderRadius: 10,
                    minWidth: 18,
                    height: 18,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 4,
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </Text>
                </View>
              )}

              <Text
                style={{
                  marginTop: 3,
                  textAlign: 'center',
                  paddingHorizontal: 4,
                  color: activeColor,
                  fontSize: Math.min(screenWidth * 0.026, 11),
                  fontWeight: isActive ? '600' : '400',
                }}
                numberOfLines={1}
              >
                {currentTab.isProfile && userData.name ? userData.name.split(' ')[0] : route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </LinearGradient>
    </Animated.View>
  );
});

// ============================================================================
// MAIN TABS COMPONENT - WRAPPER STYLE
// ============================================================================

interface TabsProps {
  readonly children?: React.ReactNode;
  readonly tabs?: readonly TabConfig[];
  readonly currentActiveTab?: string;
  readonly onNavigate?: (screenName: string) => void;
  readonly onTabReselect?: (tabName: string) => void;
  readonly onError?: (error: Error) => void;
  readonly translateY?: Animated.Value | Animated.AnimatedInterpolation<string | number>;
  readonly scrollY?: Animated.Value;
  readonly onScrollToTop?: () => void;
}

const Tabs = memo<TabsProps>(({
  children,
  tabs = [
    {
      name: 'Home',
      screenName: 'HomeTabs',
      icon: 'home',
      iconOutline: 'home-outline',
    },
    {
      name: 'Cart',
      screenName: 'ShoppingBagScreen',
      icon: 'cart',
      iconOutline: 'cart-outline',
    },
    {
      name: 'Explore',
      screenName: 'ExplorePage',
      icon: 'compass',
      iconOutline: 'compass-outline',
    },
    {
      name: 'Store',
      screenName: 'HomeTabs',
      icon: 'storefront',
      iconOutline: 'storefront-outline',
    },
    {
      name: 'Profile',
      screenName: 'ProfilePage',
      icon: 'person',
      iconOutline: 'person-outline',
      isProfile: true,
    },
  ],
  currentActiveTab = 'Home',
  onNavigate = () => { },
  onTabReselect,
  onError = () => { },
  translateY,
  scrollY,
  onScrollToTop,
}) => {
  const { surfaceColor } = useThemePalette();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState(currentActiveTab);
  const [userData, setUserData] = useState<UserData>({ name: 'User', profileImage: null });
  const [showExploreOverlay, setShowExploreOverlay] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [showQRSheet, setShowQRSheet] = useState(false);

  const navigation = useNavigation();

  // First query: Get initial data from localStorage (fast)
  const localStorageQuery = useQuery({
    queryKey: ['userDataLocal'],
    queryFn: fetchUserDataFromStorage,
    staleTime: 0,
    gcTime: 0,
  });

  // Second query: Get latest data from API (may take time)
  const apiQuery = useQuery({
    queryKey: QUERY_KEYS.userData,
    queryFn: fetchUserDataFromAPI,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Refetch API data when screen is focused
  useFocusEffect(
    useCallback(() => {
      apiQuery.refetch();
      setActiveTab(currentActiveTab); // Force active tab to match the current page
    }, [apiQuery, currentActiveTab])
  );

  // Update userData: First show localStorage data, then update with API data when available
  useEffect(() => {
    // Show localStorage data immediately (if available)
    if (localStorageQuery.data) {
      setUserData(localStorageQuery.data);
    }
  }, [localStorageQuery.data]);

  useEffect(() => {
    // Update with API data when it arrives
    if (apiQuery.data) {
      setUserData(apiQuery.data);
    }
  }, [apiQuery.data]);

  useEffect(() => {
    if (apiQuery.error) {
      onError(apiQuery.error as Error);
    }
  }, [apiQuery.error, onError]);

  const isLoadingUserData = localStorageQuery.isLoading && apiQuery.isLoading;

  const state = useMemo(
    () => ({
      routes: tabs.map((tab) => ({ name: tab.name })),
    }),
    [tabs]
  );

  const handleTabChange = useCallback((tabName: string) => {
    try {
      if (tabName === 'Explore') {
        setShowExploreOverlay(prev => !prev);
      
        return;
      }

      setShowExploreOverlay(false); 
      setActiveTab(tabName);
    } catch (error) {
      onError(error as Error);
    }
  }, [onError]);

  const handleNavigate = useCallback((screenName: string) => {
    try {
      if (screenName === 'ExplorePage') {
        setShowExploreOverlay(true);
        return;
      }
      onNavigate(screenName);
    } catch (error) {
      onError(error as Error);
    }
  }, [onNavigate, onError]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: surfaceColor,
      }}
    >
      {/* Main content area with padding at bottom for tab bar */}
      <View
        style={{
          flex: 1,
        }}
      >
        {children}
      </View>

      {/* Bottom Tab Bar - Always at bottom */}
      <TabBar
        state={state}
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        userData={userData}
        onNavigate={handleNavigate}
        onTabReselect={onTabReselect}
        isLoading={isLoadingUserData}
        translateY={translateY}
      />

      {/* Explore Overlay & Dimming */}
      {showExploreOverlay && (
        <>
          <Animated.View
            style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor: 'rgba(0,0,0,0.7)', // Dimmed background
              zIndex: 101, // Above content, below Custom Tabs if needed, but here tabs are zIndex 100
            }}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setShowExploreOverlay(false)}
            />
          </Animated.View>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 102 }} pointerEvents="box-none">
            <ExploreOverlay
              onClose={() => setShowExploreOverlay(false)}
              onOpenAiChat={() => setShowAiChat(true)}
              onOpenScanner={() => setShowQRSheet(true)}
            />
          </View>
        </>
      )}

      {/* Scroll To Top Button - Hide when Explore Overlay is open */}
      {!showExploreOverlay && scrollY && onScrollToTop && (
        <ScrollToTopButton scrollY={scrollY} onPress={onScrollToTop} />
      )}

      {/* AI Chat Modal - Global access */}
      <AiChatSupport visible={showAiChat} onClose={() => setShowAiChat(false)} />

      {/* QR Options Bottom Sheet - Global access */}
      <QROptionsBottomSheet
        visible={showQRSheet}
        onClose={() => setShowQRSheet(false)}
        onScanQR={() => {
          setShowQRSheet(false);
          navigation.navigate('QRScannerScreen' as never);
        }}
        onUploadPDF={() => {
          setShowQRSheet(false);
          navigation.navigate('PDFUploadScreen' as never);
        }}
      />
    </View>
  );
});

export default Tabs;
