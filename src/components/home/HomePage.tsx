import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, Animated, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import LottieView from 'lottie-react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../../AppNavigator';
import { useRefreshControl } from '../../hooks/useRefreshControl';
import { RefreshControlWrapper } from '../RefreshControlWrapper';
import { useQueryClient } from '@tanstack/react-query';
import Tabs from '../commonPage/Tab';
import HeaderScreen from '../home/screens/HeaderSection';
import HeroSection from '../home/screens/HeroSection';
import CategoriesSection from './screens/CategoriesSection';
import TrendingSection from './screens/TrendingSection';
import DealOfDaySection from './screens/DealOfDaySection';
import OfferBannerSection from './screens/OfferBannerSection';
import ItemFeedSection from './screens/ItemFeedSection';
import RecentlyViewedSection from './screens/RecentlyViewedSection';
import ScrollToTopButton from '../commonPage/ScrollToTopButton';
import AiChatSupport from '../AiChatSupport';

const Home: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Scroll Animation Logic
  const scrollY = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current; // 0 = Visible, 100 = Hidden
  const lastScrollY = useRef(0);
  const isTabBarHidden = useRef(false);

  const handleScrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  // Unified Scroll Handler for Tab Bar & Button
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const dy = currentY - lastScrollY.current;


    if (currentY > 50) {
      if (dy > 10 && !isTabBarHidden.current) { // Lower threshold (10) for easier hide
        // Scrolling Down -> Hide
        isTabBarHidden.current = true;
        Animated.timing(translateY, {
          toValue: 100,
          duration: 200, // Faster hide (200ms)
          useNativeDriver: true,
        }).start();
      } else if (dy < -5 && isTabBarHidden.current) {
        // Scrolling Up -> Show
        isTabBarHidden.current = false;
        Animated.timing(translateY, {
          toValue: 0,
          duration: 150, // Instant show (150ms)
          useNativeDriver: true,
        }).start();
      }
    } else if (currentY <= 50 && isTabBarHidden.current) {
      // Near top -> Always Show
      isTabBarHidden.current = false;
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    lastScrollY.current = currentY;
  };

  // Fetch Data & Handle Refresh Logic
  const fetchData = useCallback(async (isRefresh = false): Promise<void> => {
    try {
      if (isRefresh) {
        setRefreshKey((prev) => prev + 1);
        // User wants to see shimmers ("semeres"), so we must clear data to trigger loading states
        await queryClient.resetQueries();
        // Add a delay so the shimmer and spinner are visible and smooth
        await new Promise<void>((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error('[HomePage] Error:', error);
    }
  }, [queryClient]);

  // Initial load
  useEffect(() => {
    // Immediate load without delay
    setLoading(false);
  }, []);

  // Refresh control hook
  const { isRefreshing, handleRefresh } = useRefreshControl({
    onRefresh: [() => fetchData(true)],
    minRefreshTime: 2000, // Increased to 2000ms for smoother loader visibility
  });

  // Handle tab navigation
  const handleNavigate = useCallback((screenName: string) => {
    try {
      console.log('[HomePage] Navigating to:', screenName);
      navigation.navigate(screenName as keyof RootStackParamList);
    } catch (error) {
      console.error('[HomePage] Navigation error:', error);
    }
  }, [navigation]);

  const lastTapRef = useRef<number>(0);

  // Handle Tab Reselect (Scroll to top or Refresh)
  const handleTabReselect = useCallback((tabName: string) => {
    if (tabName !== 'Home') return;

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    // Check if scrolled down OR double tap
    // @ts-ignore - _value is internal but often accessible, or use a listener
    const currentScrollY = (scrollY as any)._value || 0;

    if (currentScrollY > 100) {
      // Not at top -> Scroll to top
      handleScrollToTop();
    } else {
      // At top -> Check for double tap to refresh
      if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
        handleRefresh();
      } else {
        // Single tap at top -> Ensure exactly 0
        handleScrollToTop();
      }
    }

    lastTapRef.current = now;
  }, [handleRefresh, scrollY]);

  return (
    <>
      {loading ? (
        <View className="flex-1 justify-center items-center bg-white dark:bg-[#0F1419]">
          <LottieView
            source={require('../../assets/animations/Loading 48 _ Mortar & Pestle.json')}
            autoPlay
            loop
            style={{ width: 300, height: 300 }}
          />
        </View>
      ) : (
        <Tabs
          translateY={translateY}
          onNavigate={handleNavigate}
          onTabReselect={handleTabReselect}
          scrollY={scrollY}
          onScrollToTop={handleScrollToTop}
        >
          {/* Header */}
          <HeaderScreen />

          <RefreshControlWrapper
            ref={scrollViewRef}
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
            scrollViewProps={{
              onScroll: Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                {
                  useNativeDriver: true,
                  listener: handleScroll,
                }
              ),
              scrollEventThrottle: 16,
              contentContainerStyle: { paddingBottom: 100 },
              showsVerticalScrollIndicator: false,
              removeClippedSubviews: true, // Optimize offscreen rendering
            }}
          >
            {/* Main Content */}
            <View className="flex-1 bg-white dark:bg-gray-900">
              {/* Hero Section with Featured Products and Ads */}
              <HeroSection key={`hero-${refreshKey}`} navigation={navigation} />
              <CategoriesSection key={`cat-${refreshKey}`} />
              <DealOfDaySection key={`deal-${refreshKey}`} />
              <OfferBannerSection key={`offer-${refreshKey}`} />
              <TrendingSection key={`trend-${refreshKey}`} />
              <ItemFeedSection key={`feed-${refreshKey}`} />
              <RecentlyViewedSection key={`recent-${refreshKey}`} />
            </View>
          </RefreshControlWrapper>
        </Tabs>
      )}
    </>
  );
};

export default Home;