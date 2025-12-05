import React, { useRef, useEffect } from 'react';
import { View, Text, FlatList, Dimensions, TouchableOpacity, Image, Animated, StyleProp, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemePalette } from '../../../hooks/useThemePalette';
import { useRunningAdvertisements } from '../../../hooks/useRunningAdvertisements';
import LinearGradient from 'react-native-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

// ============================================================================
// SKELETON SHIMMER COMPONENT (Generic - Matches CategoriesSection)
// ============================================================================
interface SkeletonShimmerProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

const SkeletonShimmer: React.FC<SkeletonShimmerProps> = ({
  width,
  height,
  borderRadius = 8,
  style,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
      className="bg-gray-200 dark:bg-gray-700"
    />
  );
};

const OfferBannerSection: React.FC = () => {
  const { isDark, accentColor } = useThemePalette();
  const navigation = useNavigation();
  const scrollX = useRef(new Animated.Value(0)).current;

  const { data: ads, isLoading, error } = useRunningAdvertisements();

  // Fallback mock data
  const staticOffers = [
    { 
      _id: 'static-1',
      title: 'Diabetes Care', 
      description: 'Flat 40% OFF', 
      imageUrl: 'https://static.vecteezy.com/system/resources/previews/002/217/707/non_2x/medicine-trendy-banner-vector.jpg', 
      bgColor: ['#FF9A9E', '#FAD0C4'] 
    },
    { 
      _id: 'static-2',
      title: 'Multivitamins', 
      description: 'Buy 1 Get 1 Free', 
      imageUrl: 'https://5.imimg.com/data5/SELLER/Default/2023/5/307797715/FU/EL/RC/90163806/condom-3-500x500.jpg', 
      bgColor: ['#A1C4FD', '#C2E9FB'] 
    },
    { 
      _id: 'static-3',
      title: 'Skin Care', 
      description: 'Up to 50% OFF', 
      imageUrl: 'https://img.freepik.com/free-vector/beauty-skin-care-cosmetic-product-ads-flyer_1419-2256.jpg', 
      bgColor: ['#a8edea', '#fed6e3'] 
    },
  ];

  const displayAds = (ads && (ads as any[]).length > 0) ? ads : staticOffers;
  
  // Show shimmer if loading or error or no data yet (persistent shimmer)
  const showShimmer = isLoading || (!ads && !error);

  const renderShimmerPlaceholders = () => (
    <View className="px-4">
      <View 
        className="rounded-3xl p-4 flex-row justify-between items-center border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1A1C23]"
        style={{ width: screenWidth * 0.9, height: 160 }}
      >
        <View className="flex-1 pr-4">
          <SkeletonShimmer width="80%" height={24} borderRadius={4} style={{ marginBottom: 12 }} />
          <SkeletonShimmer width="60%" height={16} borderRadius={4} style={{ marginBottom: 20 }} />
          <SkeletonShimmer width={100} height={32} borderRadius={16} />
        </View>
        <SkeletonShimmer width={100} height={100} borderRadius={8} />
      </View>
    </View>
  );

  const ITEM_WIDTH = screenWidth * 0.94;
  const SPACING = 10;
  const SNAP_INTERVAL = ITEM_WIDTH + SPACING * 2; // Total width of one item including margins

  return (
    <LinearGradient
      colors={isDark ? ['#2A2D35', '#181A20'] : ['#F3F4F6', '#ffffff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="mt-0 py-6"
    >
      {/* Header */}
      <View className="mx-4 flex-row justify-between items-center mb-6">
        <Text className="text-xl font-bold text-gray-900 dark:text-white italic tracking-tighter">
          SPECIAL OFFERS
        </Text>
        <TouchableOpacity onPress={() => console.log('See all offers')}>
          <Text style={{ color: accentColor }} className="text-sm font-bold">
            See All
          </Text>
        </TouchableOpacity>
      </View>
      
      {showShimmer ? (
        renderShimmerPlaceholders()
      ) : (
        <Animated.FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={displayAds}
          keyExtractor={(item, i) => item._id || i.toString()}
          contentContainerStyle={{ 
            paddingHorizontal: (screenWidth - ITEM_WIDTH) / 2 - SPACING, // Center the first item
            paddingBottom: 10
          }}
          snapToInterval={SNAP_INTERVAL}
          decelerationRate="fast"
          snapToAlignment="start"
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          renderItem={({ item, index }) => {
            // Determine gradient colors
            const gradientColors = isDark 
              ? ['#2e2c2cff', '#1a1c20ff'] 
              : (item.bgColor || (index % 2 === 0 ? ['#FF9A9E', '#FAD0C4'] : ['#A1C4FD', '#C2E9FB']));

            // Animation Interpolation
            const inputRange = [
              (index - 1) * SNAP_INTERVAL,
              index * SNAP_INTERVAL,
              (index + 1) * SNAP_INTERVAL,
            ];

            const scale = scrollX.interpolate({
              inputRange,
              outputRange: [0.92, 1, 0.92],
              extrapolate: 'clamp',
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.7, 1, 0.7],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                style={{
                  width: ITEM_WIDTH,
                  marginHorizontal: SPACING,
                  transform: [{ scale }],
                  opacity,
                }}
              >
                <LinearGradient
                  colors={gradientColors}
                  className="rounded-3xl p-5 flex-row justify-between items-center shadow-lg"
                  style={{
                    height: 150,
                    borderRadius: 24, // Explicit radius
                    overflow: 'hidden', // Ensure clipping
                    borderWidth: isDark ? 1 : 0,
                    borderColor: isDark ? '#374151' : 'transparent',
                    elevation: 8, // Higher elevation for pop effect
                    shadowColor: isDark ? '#000' : '#888',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                  }}
                >
                  <View className="flex-1 pr-2 justify-center">
                    <Text 
                      className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
                      numberOfLines={2}
                      style={{ textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 }}
                    >
                      {item.title}
                    </Text>
                    <Text 
                      className={`text-base font-medium mb-5 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}
                      numberOfLines={2}
                    >
                      {item.description || item.offerText || ''}
                    </Text>
                    
                    <TouchableOpacity
                      className={`self-start px-6 py-3 rounded-full shadow-md ${isDark ? 'bg-[#cf7393ff]' : 'bg-[#22C55E]'}`}
                      onPress={() => console.log('Shop offer:', item.title)}
                      activeOpacity={0.8}
                    >
                      <Text className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Shop Now
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Image
                    source={{ uri: item.imageUrl }}
                    className="w-36 h-36 rounded-2xl"
                    resizeMode="contain"
                  />
                </LinearGradient>
              </Animated.View>
            );
          }}
        />
      )}
    </LinearGradient>
  );
};

export default OfferBannerSection;
