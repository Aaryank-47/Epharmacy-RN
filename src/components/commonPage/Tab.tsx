import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { View, Text, TouchableOpacity, Image, useWindowDimensions, Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { useThemePalette } from '../../hooks/useThemePalette';
import { useCart } from '../../context/CartContext';
import { useUserProfile } from '../../hooks/useUserProfile';
import ExploreOverlay from './ExploreOverlay';
import AiChatSupport from '../AiChatSupport';
import QROptionsBottomSheet from '../qr/QROptionsBottomSheet';
import ScrollToTopButton from './ScrollToTopButton';

interface TabConfig {
  readonly name: string;
  readonly screenName: string;
  readonly icon: string;
  readonly iconOutline: string;
  readonly isProfile?: boolean;
}

const getInitials = (name: string): string => {
  if (!name) return '?';
  return name.split(' ').map(w => w.charAt(0)).join('').substring(0, 2).toUpperCase();
};

const ProfileTabIcon = memo<{ isActive: boolean; userData: any; size?: number }>(({
  isActive, userData, size = 32
}) => {
  const borderColor = isActive ? '#f472b6' : '#D1D5DB';
  const bgColor = isActive ? '#f472b6' : '#D1D5DB';

  const profileImageUrl = useMemo(() => {
    if (!userData?.profileImage) return null;
    if (Array.isArray(userData.profileImage) && userData.profileImage.length > 0) return userData.profileImage[0];
    if (typeof userData.profileImage === 'string') return userData.profileImage;
    return null;
  }, [userData]);

  if (!userData) {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#CCCCCC', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontWeight: 'bold', color: 'white', fontSize: size * 0.4 }}>?</Text>
      </View>
    );
  }

  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, borderColor, borderWidth: isActive ? 2 : 1, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
      {profileImageUrl ? (
        <Image source={{ uri: profileImageUrl }} style={{ width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 }} />
      ) : (
        <View style={{ backgroundColor: bgColor, width: size, height: size, borderRadius: size / 2, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontWeight: 'bold', color: 'white', fontSize: size * 0.4, textAlign: 'center' }}>{getInitials(userData.name)}</Text>
        </View>
      )}
    </View>
  );
});

const TabBar = memo<{
  tabs: readonly TabConfig[];
  state: { readonly routes: readonly { readonly name: string }[] };
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userData: any;
  onNavigate: (screenName: string) => void;
  onTabReselect?: (tabName: string) => void;
  isLoading?: boolean;
  translateY?: Animated.Value | Animated.AnimatedInterpolation<string | number>;
}>(({ state, tabs, activeTab, setActiveTab, userData, onNavigate, onTabReselect, isLoading = false, translateY = new Animated.Value(0) }) => {
  const { isDark, accentColor } = useThemePalette();
  const { items } = useCart();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);
  const bottomInset = insets.bottom;
  const isGestureNav = bottomInset > 45;
  const tabContentHeight = isGestureNav ? 20 : 69;
  const effectiveBottomPadding = isGestureNav ? bottomInset : 4;
  const tabBarHeight = tabContentHeight + effectiveBottomPadding;
  const borderColor = isDark ? '#374151' : '#E5E7EB';
  const gradientColors = useMemo(() => isDark ? ['#0F1419', '#292929'] : ['#F3F4F6', '#F9FAFB'], [isDark]);

  const handleTabPress = useCallback((tab: TabConfig) => {
    if (isLoading) return;
    if (tab.name === activeTab) {
      onTabReselect?.(tab.name);
      return;
    }
    setActiveTab(tab.name);
    if (tab.screenName) onNavigate(tab.screenName);
  }, [setActiveTab, onNavigate, isLoading, activeTab, onTabReselect]);

  return (
    <Animated.View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, transform: [{ translateY }], zIndex: 100 }}>
      <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ borderTopColor: borderColor, borderTopWidth: 0.3, paddingBottom: effectiveBottomPadding, paddingTop: 8, paddingHorizontal: screenWidth * 0.02, height: tabBarHeight, flexDirection: 'row', shadowOpacity: 0.06, shadowRadius: 3, elevation: 8 }}>
        {state.routes.map((route, index) => {
          const currentTab = tabs.find(tab => tab.name === route.name);
          if (!currentTab) return null;
          const isActive = activeTab === currentTab.name;
          const activeColor = isActive ? accentColor : (isDark ? '#9CA3AF' : '#6B7280');
          const iconName = isActive ? currentTab.icon : currentTab.iconOutline;

          return (
            <TouchableOpacity key={`${route.name}-${index}`} onPress={() => handleTabPress(currentTab)} activeOpacity={0.6} disabled={isLoading} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              {currentTab.isProfile ? (
                <ProfileTabIcon isActive={isActive} userData={userData} size={Math.min(screenWidth * 0.08, 32)} />
              ) : (
                <Icon name={iconName || 'circle'} size={Math.min(screenWidth * 0.064, 26)} color={activeColor} />
              )}
              {currentTab.name === 'Cart' && cartItemCount > 0 && (
                <View style={{ position: 'absolute', top: -4, right: screenWidth * 0.05, backgroundColor: '#EF4444', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 }}>
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{cartItemCount > 99 ? '99+' : cartItemCount}</Text>
                </View>
              )}
              <Text style={{ marginTop: 3, textAlign: 'center', paddingHorizontal: 4, color: activeColor, fontSize: Math.min(screenWidth * 0.026, 11), fontWeight: isActive ? '600' : '400' }} numberOfLines={1}>
                {currentTab.isProfile && userData.name ? userData.name.split(' ')[0] : route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </LinearGradient>
    </Animated.View>
  );
});

const Tabs = memo<{
  children?: React.ReactNode;
  tabs?: readonly TabConfig[];
  currentActiveTab?: string;
  onNavigate?: (screenName: string) => void;
  onTabReselect?: (tabName: string) => void;
  onError?: (error: Error) => void;
  translateY?: Animated.Value | Animated.AnimatedInterpolation<string | number>;
  scrollY?: Animated.Value;
  onScrollToTop?: () => void;
}>(({ children, tabs = [
  { name: 'Home', screenName: 'HomeTabs', icon: 'home', iconOutline: 'home-outline' },
  { name: 'Cart', screenName: 'ShoppingBagScreen', icon: 'cart', iconOutline: 'cart-outline' },
  { name: 'Explore', screenName: 'ExplorePage', icon: 'compass', iconOutline: 'compass-outline' },
  { name: 'Store', screenName: 'HomeTabs', icon: 'storefront', iconOutline: 'storefront-outline' },
  { name: 'Profile', screenName: 'ProfilePage', icon: 'person', iconOutline: 'person-outline', isProfile: true },
], currentActiveTab = 'Home', onNavigate = () => { }, onTabReselect, onError = () => { }, translateY, scrollY, onScrollToTop }) => {
  const { surfaceColor } = useThemePalette();
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState(currentActiveTab);
  const [showExploreOverlay, setShowExploreOverlay] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [showQRSheet, setShowQRSheet] = useState(false);

  // Use global user profile hook for consistent data
  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile();

  // Local state for instant load (Stale-While-Revalidate pattern)
  const [localUserData, setLocalUserData] = useState<any>(null);

  // Load from AsyncStorage on mount to prevent "U" flash
  useEffect(() => {
    const loadLocalProfile = async () => {
      try {
        const storedProfile = await AsyncStorage.getItem('userProfile');
        if (storedProfile) {
          const parsed = JSON.parse(storedProfile);
          // Handle potential structure differences if stored differently
          // Verify if it has profileImage
          setLocalUserData(parsed);
        }
      } catch (e) {
        // Silent fail
      }
    };
    loadLocalProfile();
  }, []);

  // Update local storage when API data comes in (keep it fresh)
  useEffect(() => {
    if (userProfile) {
      AsyncStorage.setItem('userProfile', JSON.stringify(userProfile)).catch(() => { });
    }
  }, [userProfile]);

  const userData = useMemo(() => {
    // Priority: API Data > Local Cache > Default "User"
    if (userProfile) return userProfile;
    if (localUserData) return localUserData;
    return { name: 'User', profileImage: null };
  }, [userProfile, localUserData]);

  useFocusEffect(useCallback(() => {
    setActiveTab(currentActiveTab);
  }, [currentActiveTab]));

  const isLoadingUserData = isProfileLoading;
  const state = useMemo(() => ({ routes: tabs.map(tab => ({ name: tab.name })) }), [tabs]);

  const handleTabChange = useCallback((tabName: string) => {
    if (tabName === 'Explore') {
      setShowExploreOverlay(prev => !prev);
      return;
    }
    setShowExploreOverlay(false);
    setActiveTab(tabName);
  }, []);

  const handleNavigate = useCallback((screenName: string) => {
    if (screenName === 'ExplorePage') {
      setShowExploreOverlay(true);
      return;
    }
    onNavigate(screenName);
  }, [onNavigate]);

  return (
    <View style={{ flex: 1, backgroundColor: surfaceColor }}>
      <View style={{ flex: 1 }}>{children}</View>
      <TabBar state={state} tabs={tabs} activeTab={activeTab} setActiveTab={handleTabChange} userData={userData} onNavigate={handleNavigate} onTabReselect={onTabReselect} isLoading={isLoadingUserData} translateY={translateY} />
      {showExploreOverlay && (
        <>
          <Animated.View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 101 }}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowExploreOverlay(false)} />
          </Animated.View>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 102 }} pointerEvents="box-none">
            <ExploreOverlay onClose={() => setShowExploreOverlay(false)} onOpenAiChat={() => setShowAiChat(true)} onOpenScanner={() => setShowQRSheet(true)} />
          </View>
        </>
      )}
      {!showExploreOverlay && scrollY && onScrollToTop && <ScrollToTopButton scrollY={scrollY} onPress={onScrollToTop} />}
      <AiChatSupport visible={showAiChat} onClose={() => setShowAiChat(false)} />
      <QROptionsBottomSheet
        visible={showQRSheet}
        onClose={() => setShowQRSheet(false)}
        onScanQR={() => {
          setShowQRSheet(false);
          (navigation as any).navigate('QRScannerScreen');
        }}
        onTakePhoto={() => {
          setShowQRSheet(false);
          (navigation as any).navigate('PDFUploadScreen', { mode: 'camera' });
        }}
        onUploadGallery={() => {
          setShowQRSheet(false);
          (navigation as any).navigate('PDFUploadScreen', { mode: 'gallery' });
        }}
      />
    </View>
  );
});

export default Tabs;