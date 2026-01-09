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
  const fetchData = useCallback(async (): Promise<void> => {
    try {
      setRefreshKey((prev) => prev + 1);
      await queryClient.resetQueries();
      await new Promise<void>((resolve) => setTimeout(resolve, 1500));
    } catch (error) {
      console.error('[HomePage] Error:', error);
    }
  }, [queryClient]);

  // Initial load
  useEffect(() => {
    fetchData().then(() => setLoading(false));
  }, [fetchData]);

  // Refresh control hook
  const { isRefreshing, handleRefresh } = useRefreshControl({
    onRefresh: [fetchData],
    minRefreshTime: 1500,
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
        <Tabs translateY={translateY} onNavigate={handleNavigate}>
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

          {/* Scroll To Top Button */}
          <ScrollToTopButton scrollY={scrollY} onPress={handleScrollToTop} />

          {/* Floating AI Doctor Button */}
          <AiChatSupport />
        </Tabs>
      )}
    </>
  );
};

export default Home;