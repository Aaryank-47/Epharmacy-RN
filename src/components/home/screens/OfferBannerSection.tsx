import React, { useRef, useEffect, memo, useCallback, useMemo, useState } from 'react';
import { View, Text, Dimensions, TouchableOpacity, Image, Animated, StyleProp, ViewStyle, FlatList, Linking } from 'react-native';
import { useThemePalette } from '../../../hooks/useThemePalette';
import { useRunningAdvertisements } from '../../../hooks/useRunningAdvertisements';
import LinearGradient from 'react-native-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

// ----------------------------------------------------------------------------
// CONFIGURATION
// ----------------------------------------------------------------------------
const ITEM_WIDTH = screenWidth * 0.95; // Slightly wider for banner feel
const SPACING = 10;
const SNAP_INTERVAL = ITEM_WIDTH + SPACING * 2;
const AUTO_SCROLL_INTERVAL = 3000; // 3 seconds

// ----------------------------------------------------------------------------
// SHARED ANIMATION HOOK
// ----------------------------------------------------------------------------
const useSharedShimmer = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [shimmerAnim]);
  return shimmerAnim;
};

// ----------------------------------------------------------------------------
// COMPONENTS
// ----------------------------------------------------------------------------

interface SkeletonShimmerProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  animValue: Animated.Value;
}

const SkeletonShimmer = memo<SkeletonShimmerProps>(({ width, height, borderRadius = 8, style, animValue }) => {
  const opacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Animated.View
      style={[{ width: width as any, height, borderRadius, opacity }, style]}
      className="bg-gray-200 dark:bg-gray-700"
    />
  );
});

// Full width shimmer for banner
const OfferShimmerCard = memo(({ animValue }: { animValue: Animated.Value }) => (
  <View className="px-4 items-center">
    <SkeletonShimmer width={ITEM_WIDTH} height={180} borderRadius={24} animValue={animValue} />
  </View>
));

interface OfferItem {
  id: string;
  mediaUrl: string; // Image / GIF / Video URL
  link: string;
  type?: 'image' | 'video'; // Future support
}

interface OfferItemProps {
  item: OfferItem;
  index: number;
  scrollX: Animated.Value;
  isDark: boolean;
  onPress: (item: OfferItem) => void;
}

const OfferBannerItem = memo<OfferItemProps>(({ item, index, scrollX, isDark, onPress }) => {
  const inputRange = [(index - 1) * SNAP_INTERVAL, index * SNAP_INTERVAL, (index + 1) * SNAP_INTERVAL];

  const scale = scrollX.interpolate({
    inputRange,
    outputRange: [0.95, 1, 0.95],
    extrapolate: 'clamp',
  });

  const opacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.8, 1, 0.8],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={{ width: ITEM_WIDTH, marginHorizontal: SPACING, transform: [{ scale }], opacity }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onPress(item)}
        style={{
          height: 180, // Increased height for banner
          borderRadius: 24,
          overflow: 'hidden',
          backgroundColor: isDark ? '#1F2937' : '#E5E7EB', // Placeholder bg
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
        }}
      >
        <Image
          source={{ uri: item.mediaUrl }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="stretch" // Cover to fill the banner area
        />
      </TouchableOpacity>
    </Animated.View>
  );
});

// Pagination Dots Component (Updated for Progress Animation)
const PaginationDots = memo(({
  dataLength,
  scrollX,
  snapInterval,
  progress
}: {
  dataLength: number,
  scrollX: Animated.Value,
  snapInterval: number,
  progress: Animated.Value
}) => {
  const totalWidth = dataLength * snapInterval;
  const moduloScrollX = Animated.modulo(scrollX, totalWidth);

  return (
    <View className="flex-row justify-center items-center mt-2 h-2">
      {Array.from({ length: dataLength }).map((_, i) => {
        const inputRange = [(i - 1) * snapInterval, i * snapInterval, (i + 1) * snapInterval];

        // Active state interpolation
        const opacity = moduloScrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });

        const width = moduloScrollX.interpolate({
          inputRange,
          outputRange: [8, 24, 8], // Active dot is wider
          extrapolate: 'clamp',
        });



        return (
          <Animated.View
            key={i}
            style={{
              height: 4,
              width,
              borderRadius: 4,
              backgroundColor: '#E5E7EB', // Inactive/Background color
              marginHorizontal: 4,
              overflow: 'hidden', // Mask the filling bar
            }}
          >
            {/* Background inactive dot */}
            <Animated.View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: '#cf7393ff',
                opacity: opacity // Fades in/out based on position
              }}
            />

            {/* Filling Progress Bar - Only visible when active */}
            <Animated.View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                backgroundColor: '#cf7393ff', // Active Fill Color
                width: width, // Fill entire width
                opacity: opacity.interpolate({
                  inputRange: [0.99, 1], // Only visible when fully active
                  outputRange: [0, 1],
                  extrapolate: 'clamp'
                }),
                transform: [{
                  translateX: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-24, 0] // Slide in from left
                  })
                }]
              }}
            />
          </Animated.View>
        );
      })}
    </View>
  );
});

// ----------------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------------
const OfferBannerSection: React.FC<{ visible?: boolean; onReady?: () => void }> = ({ visible = false, onReady }) => {
  const { isDark, accentColor } = useThemePalette();
  const scrollX = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current; // New progress value
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const isLoading = false; // Static for now, but keeping prop structure
  const shimmerAnim = useSharedShimmer();

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  const handlePress = useCallback((item: OfferItem) => {
    if (item.link) {
      Linking.openURL(item.link).catch(err => console.error("Couldn't load page", err));
    }
  }, []);

  // Base Data
  const baseOffers: OfferItem[] = useMemo(() => [
    {
      id: 'banner-1',
      mediaUrl: 'https://m.media-amazon.com/images/G/31/PHARMA-newCX/Header_750x300_SF-shopnow_header.jpg',
      link: 'https://example.com/offer1',
    },
    {
      id: 'banner-2',
      mediaUrl: 'https://marketplace.canva.com/EAGAPb6bH7I/2/0/1600w/canva-purple-and-white-line-modern-medical-care-banner-landscape-Wc2zRJZIjlM.jpg',
      link: 'https://example.com/offer2',
    },
    {
      id: 'banner-3',
      mediaUrl: 'https://static.vecteezy.com/system/resources/thumbnails/012/354/651/small/the-landing-page-of-the-medical-clinic-website-is-a-female-medical-worker-the-concept-of-medicine-and-health-illustration-in-a-flat-style-on-a-blue-background-vector.jpg',
      link: 'https://example.com/offer3',
    },
  ], []);

  // Infinite Data (Optimized: 50x copies instead of 1000x)
  const infiniteOffers = useMemo(() => {
    // 50 repeats is sufficient for "infinite" feel without memory bloat
    const repeated = [];
    for (let i = 0; i < 50; i++) {
      repeated.push(...baseOffers);
    }
    return repeated;
  }, [baseOffers]);

  // Animated Auto Scroll Logic
  const startProgressAnimation = useCallback(() => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: AUTO_SCROLL_INTERVAL,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setCurrentIndex((prev) => {
          const next = prev + 1;
          if (next >= infiniteOffers.length) {
            flatListRef.current?.scrollToIndex({
              index: 0,
              animated: false,
            });
            return 0;
          }
          flatListRef.current?.scrollToIndex({
            index: next,
            animated: true,
          });
          return next;
        });
      }
    });
  }, [progressAnim, infiniteOffers.length]);

  // Start animation whenever index changes, but wait for interactions first
  useEffect(() => {
    const task = requestAnimationFrame(() => {
      startProgressAnimation();
    });
    return () => {
      progressAnim.stopAnimation();
      cancelAnimationFrame(task);
    };
  }, [currentIndex, startProgressAnimation, progressAnim]);


  // Handle Manual Scroll to update current index
  const onMomentumScrollEnd = useCallback((event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SNAP_INTERVAL);
    setCurrentIndex(index);
  }, []);


  const onScroll = useMemo(() => Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false } // Layout property (scale/width) requires false or logic change, checked below
  ), [scrollX]);

  if (isLoading) {
    return (
      <View className="mt-0 py-6">
        <View className="mx-4 mb-4">
          <SkeletonShimmer width={150} height={24} borderRadius={4} animValue={shimmerAnim} />
        </View>
        <OfferShimmerCard animValue={shimmerAnim} />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={isDark ? ['#2A2D35', '#181A20'] : ['#F3F4F6', '#ffffff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="mt-0 py-0"
    >
      <View className="mx-4 flex-row justify-between items-center mb-4">
        <Text className="text-xl font-bold text-gray-900 dark:text-white  tracking-tighter">
          Special Offers
        </Text>
      </View>

      <Animated.FlatList
        ref={flatListRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        data={infiniteOffers}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={{
          paddingHorizontal: (screenWidth - ITEM_WIDTH) / 2 - SPACING,
          paddingBottom: 10
        }}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        snapToAlignment="center"
        onScroll={onScroll}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollBeginDrag={() => progressAnim.stopAnimation()}
        scrollEventThrottle={16}
        removeClippedSubviews={true}
        initialNumToRender={2} // Increased from 1
        maxToRenderPerBatch={2}
        windowSize={5}
        getItemLayout={(data, index) => (
          { length: SNAP_INTERVAL, offset: SNAP_INTERVAL * index, index }
        )}
        renderItem={({ item, index }) => (
          <OfferBannerItem
            item={item}
            index={index}
            scrollX={scrollX}
            isDark={isDark}
            onPress={handlePress}
          />
        )}
      />

      <PaginationDots
        dataLength={baseOffers.length}
        scrollX={scrollX}
        snapInterval={SNAP_INTERVAL}
        progress={progressAnim}
      />

    </LinearGradient>
  );
};

export default React.memo(OfferBannerSection);
