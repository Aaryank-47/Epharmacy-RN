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
  Platform,
  Image,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { useThemePalette } from '../../hooks/useThemePalette';


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
 * Load user data from storage with fallback mechanism
 */
const fetchUserDataFromStorage = async (): Promise<UserData> => {
  try {
    // Primary source: auth_user
    const authUserData = await AsyncStorage.getItem('auth_user');
    if (authUserData) {
      try {
        const user = JSON.parse(authUserData);
        console.log('[UserData] Loaded from auth_user:', { name: user.name });
        return {
          name: user.name || 'User',
          profileImage: user.avatar || null,
        };
      } catch (parseError) {
        console.error('[UserData] Failed to parse auth_user:', parseError);
      }
    }

    // Secondary source: jwtToken
    const jwtData = await AsyncStorage.getItem('jwtToken');
    if (jwtData) {
      try {
        const parsedData = JSON.parse(jwtData);
        if (parsedData.user) {
          console.log('[UserData] Loaded from jwtToken:', { name: parsedData.user.name });
          return {
            name: parsedData.user.name || 'User',
            profileImage: parsedData.user.profileImage?.[0] || null,
          };
        }
      } catch (parseError) {
        console.error('[UserData] Failed to parse jwtToken:', parseError);
      }
    }

    console.warn('[UserData] No user data found in storage');
    return { name: 'User', profileImage: null };
  } catch (error) {
    const err = error as AsyncStorageError;
    console.error('[UserData] Storage access error:', err.message);
    return { name: 'User', profileImage: null };
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
            console.error('[ProfileTabIcon] Image loading error');
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
  isLoading = false,
  translateY = new Animated.Value(0),
}) => {
  const { isDark, accentColor } = useThemePalette();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

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
        setActiveTab(tab.name);
        if (tab.screenName) {
          onNavigate(tab.screenName);
        }
      } catch (error) {
        console.error('[TabBar] Navigation error:', error);
      }
    },
    [setActiveTab, onNavigate, isLoading]
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
  readonly onError?: (error: Error) => void;
  readonly translateY?: Animated.Value | Animated.AnimatedInterpolation<string | number>;
}

const Tabs = memo<TabsProps>(({
  children,
  tabs = [
    {
      name: 'Store',
      screenName: 'HomeTabs',
      icon: 'storefront',
      iconOutline: 'storefront-outline',
    },
    {
      name: 'Wish List',
      screenName: 'Wishlist',
      icon: 'heart',
      iconOutline: 'heart-outline',
    },
    {
      name: 'Home',
      screenName: 'HomeTabs',
      icon: 'home',
      iconOutline: 'home-outline',
    },
    {
      name: 'History',
      screenName: 'HistoryPage',
      icon: 'time',
      iconOutline: 'time-outline',
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
  onNavigate = () => {},
  onError = () => {},
  translateY,
}) => {
  const { surfaceColor } = useThemePalette();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState(currentActiveTab);
  const [userData, setUserData] = useState<UserData>({ name: 'User', profileImage: null });

  // React Query for user data
  const queryResult = useQuery({
    queryKey: QUERY_KEYS.userData,
    queryFn: fetchUserDataFromStorage,
    staleTime: 0, // Always refetch when data is requested
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Refetch user data when screen is focused
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userData });
    }, [queryClient])
  );

  useEffect(() => {
    if (queryResult.data) {
      setUserData(queryResult.data);
      console.log('[Tabs] User data loaded:', { name: queryResult.data.name });
    }
  }, [queryResult.data]);

  useEffect(() => {
    if (queryResult.error) {
      console.error('[Tabs] Failed to load user data:', queryResult.error);
      onError(queryResult.error as Error);
    }
  }, [queryResult.error, onError]);

  const isLoadingUserData = queryResult.isLoading;

  const state = useMemo(
    () => ({
      routes: tabs.map((tab) => ({ name: tab.name })),
    }),
    [tabs]
  );

  const handleTabChange = useCallback((tabName: string) => {
    try {
      setActiveTab(tabName);
      console.log('[Tabs] Tab changed to:', tabName);
    } catch (error) {
      console.error('[Tabs] Error changing tab:', error);
      onError(error as Error);
    }
  }, [onError]);

  const handleNavigate = useCallback((screenName: string) => {
    try {
      onNavigate(screenName);
    } catch (error) {
      console.error('[Tabs] Navigation error:', error);
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
        isLoading={isLoadingUserData}
        translateY={translateY}
      />
    </View>
  );
});

export default Tabs;
