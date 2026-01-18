import React, { useCallback, useState, useMemo, useRef } from 'react';
import { View, Animated, StyleSheet, ListRenderItem } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';

import type { RootStackParamList } from '../../../AppNavigator';

import Tabs from '../commonPage/Tab';
import HeaderScreen from '../home/screens/HeaderSection';
import HeroSection from '../home/screens/HeroSection';
import CategoriesSection from './screens/CategoriesSection';
import TrendingSection from './screens/TrendingSection';
import DealOfDaySection from './screens/DealOfDaySection';
import OfferBannerSection from './screens/OfferBannerSection';
import { FeedRow, FeedHeader, FeedSkeleton } from './screens/ItemFeedSection';
import RecentlyViewedSection from './screens/RecentlyViewedSection';

import { useItemFeed } from '../../hooks/useItemFeed';
import { useThemePalette } from '../../hooks/useThemePalette';


// --- Constants ---
const SCROLL_EVENT_THROTTLE = 16;
const TAB_BAR_HIDDEN_OFFSET = 100;

enum SectionType {
  HERO = 'HERO',
  CATEGORIES = 'CATEGORIES',
  DEALS = 'DEALS',
  OFFER = 'OFFER',
  TRENDING = 'TRENDING',
  FEED_HEADER = 'FEED_HEADER',
  FEED_SKELETON = 'FEED_SKELETON',
  FEED_ROW = 'FEED_ROW',
  RECENT = 'RECENT',
}

interface SectionItem {
  id: string;
  type: SectionType;
}

const SECTIONS_DATA: SectionItem[] = [
  { id: 'section-hero', type: SectionType.HERO },
  { id: 'section-categories', type: SectionType.CATEGORIES },
  { id: 'section-deals', type: SectionType.DEALS },
  { id: 'section-offer', type: SectionType.OFFER },
  { id: 'section-trending', type: SectionType.TRENDING },
];


const Home: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const { isDark, accentColor } = useThemePalette();

  // --- Animation State ---
  const scrollY = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const isTabBarHidden = useRef(false);
  const flatListRef = useRef<Animated.FlatList>(null);

  // --- Feed Logic ---
  const {
    data: feedItems,
    isLoading: isFeedLoading,
    chunkedItems,
    handleFeedPress,
    handleFeedToggleWishlist,
    handleFeedAddToCart,
    isInCart,
    isInWishlist
  } = useItemFeed();

  // --- Local State ---
  const [isRefreshingState, setIsRefreshingState] = useState(false);
  const lastTapRef = useRef<number>(0);

  // --- Handlers ---
  const handleNavigate = useCallback((screenName: string) => {
    navigation.navigate(screenName as keyof RootStackParamList);
  }, [navigation]);

  const handleScrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const handleScrollRaw = useCallback((event: any) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const dy = currentY - lastScrollY.current;

    // Detect if close to bottom
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;
    const contentHeight = event.nativeEvent.contentSize.height;
    const isCloseToBottom = layoutHeight + currentY >= contentHeight - 20;

    //--------------------------------- Tab Bar Hiding-------------------------------------------------------
    if (isCloseToBottom) {

      if (isTabBarHidden.current) {
        isTabBarHidden.current = false;
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
    } else if (currentY > 50) {
      if (dy > 10 && !isTabBarHidden.current) {
        isTabBarHidden.current = true;
        Animated.timing(translateY, {
          toValue: TAB_BAR_HIDDEN_OFFSET,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else if (dy < -5 && isTabBarHidden.current) {
        isTabBarHidden.current = false;
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
    } else if (currentY <= 50 && isTabBarHidden.current) {
      isTabBarHidden.current = false;
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
    lastScrollY.current = currentY;
  }, [translateY]);

  const onScrollEvent = useMemo(() => Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: handleScrollRaw,
    }
  ), [scrollY, handleScrollRaw]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshingState(true);
    await queryClient.resetQueries();
    await new Promise<void>((resolve) => setTimeout(resolve, 1000));
    setIsRefreshingState(false);
  }, [queryClient]);

  const handleTabReselect = useCallback((tabName: string) => {
    if (tabName !== 'Home') return;
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 350;
    // @ts-ignore
    const currentScrollY = scrollY._value || 0;

    if (currentScrollY > 100) {
      handleScrollToTop();
    } else {
      if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
        handleRefresh();
      } else {
        handleScrollToTop();
      }
    }
    lastTapRef.current = now;
  }, [handleRefresh, scrollY, handleScrollToTop]);

  // --- Flattened Data Source ---
  const flatData = useMemo(() => {
    const staticBeforeFeed = SECTIONS_DATA;
    const recentSection = { id: 'section-recent', type: SectionType.RECENT };

    let feedSections: any[] = [];

    feedSections.push({ id: 'feed-header', type: SectionType.FEED_HEADER });

    if (isFeedLoading) {
      feedSections.push({ id: 'feed-skeleton', type: SectionType.FEED_SKELETON });
    } else {
      // Map chunks to rows
      if (chunkedItems && chunkedItems.length > 0) {
        const rows = chunkedItems.map((row, index) => ({
          id: `feed-row-${index}`,
          type: SectionType.FEED_ROW,
          data: row
        }));
        feedSections = [...feedSections, ...rows];
      }
    }

    return [...staticBeforeFeed, ...feedSections, recentSection];
  }, [chunkedItems, isFeedLoading]);

  // --- Render Item ---
  const renderItem = useCallback<ListRenderItem<any>>(({ item }) => {
    switch (item.type) {
      case SectionType.HERO:
        return <HeroSection navigation={navigation} />;
      case SectionType.CATEGORIES:
        return <CategoriesSection />;
      case SectionType.DEALS:
        return <DealOfDaySection />;
      case SectionType.OFFER:
        return <OfferBannerSection />;
      case SectionType.TRENDING:
        return <TrendingSection />;

      // Virtualized Feed
      case SectionType.FEED_HEADER:
        return <FeedHeader isDark={isDark} accentColor={accentColor} navigation={navigation} />;

      case SectionType.FEED_SKELETON:
        return <FeedSkeleton isDark={isDark} opacity={new Animated.Value(0.5)} />;

      case SectionType.FEED_ROW:
        return (
          <FeedRow
            items={item.data}
            isDark={isDark}
            accentColor={accentColor}
            handlePress={handleFeedPress}
            handleAddToCart={handleFeedAddToCart}
            checkIsInCart={isInCart}
            handleToggleWishlist={handleFeedToggleWishlist}
            checkIsInWishlist={isInWishlist}
          />
        );

      case SectionType.RECENT:
        return <RecentlyViewedSection />;
      default:
        return null;
    }
  }, [navigation, isDark, accentColor, handleFeedPress, handleFeedAddToCart, isInCart, handleFeedToggleWishlist, isInWishlist]);

  const keyExtractor = useCallback((item: any) => item.id, []);
  const contentContainerStyle = useMemo(() => ({ paddingBottom: 10 }), []);

  return (
    <Tabs
      translateY={translateY}
      onNavigate={handleNavigate}
      onTabReselect={handleTabReselect}
      scrollY={scrollY}
      onScrollToTop={handleScrollToTop}
    >
      <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F3F4F6' }]}>
        <HeaderScreen />
        <Animated.FlatList
          ref={flatListRef}
          data={flatData}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          onScroll={onScrollEvent}
          scrollEventThrottle={SCROLL_EVENT_THROTTLE}
          contentContainerStyle={contentContainerStyle}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          initialNumToRender={5}
          maxToRenderPerBatch={2}
          updateCellsBatchingPeriod={30}
          windowSize={11}
          refreshing={isRefreshingState}
          onRefresh={handleRefresh}
        />
      </View>
    </Tabs>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default React.memo(Home);