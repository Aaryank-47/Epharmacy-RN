import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemePalette } from '../../../hooks/useThemePalette';
import { useDealsOfTheDay } from '../../../hooks/useDealsOfTheDay';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

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

// ============================================================================
// DEAL OF DAY SECTION
// ============================================================================
const DealOfDaySection: React.FC = () => {
  const navigation = useNavigation();
  const { isDark, accentColor } = useThemePalette();

  const { data: deals, isLoading, error } = useDealsOfTheDay();

  // Persistent shimmer logic
  const showShimmer = isLoading || error || !deals || deals.length === 0;

  const renderShimmerPlaceholders = () => (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={[1, 2, 3, 4]}
      keyExtractor={(_, i) => `shimmer-${i}`}
      contentContainerStyle={{ paddingHorizontal: 12 }}
      renderItem={() => (
        <View 
          className="mr-3 bg-white dark:bg-[#1A1C23] rounded-xl p-2 border border-gray-100 dark:border-gray-800"
          style={{ width: screenWidth * 0.46 }}
        >
          {/* Image */}
          <SkeletonShimmer width="100%" height={120} borderRadius={8} />
          
          {/* Title */}
          <SkeletonShimmer width="80%" height={14} borderRadius={4} style={{ marginTop: 12 }} />
          
          {/* Price & Icon Row */}
          <View className="flex-row justify-between items-center mt-3">
             <View>
                <SkeletonShimmer width={60} height={16} borderRadius={4} />
                <SkeletonShimmer width={40} height={10} borderRadius={4} style={{ marginTop: 4 }} />
             </View>
             <SkeletonShimmer width={32} height={32} borderRadius={16} />
          </View>
        </View>
      )}
    />
  );

  const handleProductPress = (item: any) => {
    console.log('Product selected:', item.title);
    // navigation.navigate('ProductDetail', { productId: item._id, product: item });
  };

  return (
    <LinearGradient
      colors={isDark ? ['#181A20', '#2A2D35'] : ['#FFFFFF', '#F3F4F6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="mt-0 py-6"
    >
      {/* Header */}
      <View className="mx-4 flex-row justify-between items-center mb-4">
        <View className="flex-row items-center">
          <Text className="text-xl font-bold text-gray-900 dark:text-white italic tracking-tighter">
            DEAL OF THE DAY
          </Text>
          {/* Timer Badge */}
          <View className="ml-3 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-800">
            <Text className="text-xs font-bold text-red-600 dark:text-red-400">
              Ends in 12:00:00
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => console.log('View all deals')}>
          <Text style={{ color: accentColor }} className="text-sm font-bold">
            View All
          </Text>
        </TouchableOpacity>
      </View>

      {showShimmer ? (
        renderShimmerPlaceholders()
      ) : (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={deals} // Ensure backend sends 10-12 items or slice here if needed: deals.slice(0, 12)
          keyExtractor={(item) => item._id || item.itemName}
          contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={() => handleProductPress(item)}
              className="mx-1.5 bg-white dark:bg-[#1A1C23] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden"
              style={{
                width: screenWidth * 0.46, // ~2 cards per frame
                elevation: 3,
              }}
            >
              {/* Image Area - Compact & Clean */}
              <View className="h-32 w-full bg-white p-2 justify-center items-center relative border-b border-gray-100 dark:border-gray-800">
                <Image
                  source={{ uri: (item.itemImages && item.itemImages[0]) || item.imageUrl }}
                  className="w-full h-full"
                  resizeMode="contain"
                />
                
                {/* Discount Badge - Minimalist */}
                {item.itemDiscount && (
                  <View className="absolute top-2 left-2 bg-red-600 px-1.5 py-0.5 rounded text-center">
                    <Text className="text-white text-[10px] font-bold">
                      -{item.itemDiscount}%
                    </Text>
                  </View>
                )}
              </View>

              {/* Content Area */}
              <View className="p-3">
                {/* Title */}
                <Text
                  numberOfLines={1}
                  className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1"
                >
                  {item.itemName || item.title}
                </Text>
                
                {/* Price & Action Row */}
                <View className="flex-row items-center justify-between mt-1">
                  <View>
                    <Text className="text-base font-bold text-gray-900 dark:text-white">
                      ₹{item.itemFinalPrice || item.price || 0}
                    </Text>
                    {item.itemInitialPrice && (
                      <Text className="text-[10px] text-gray-400 line-through">
                        ₹{item.itemInitialPrice}
                      </Text>
                    )}
                  </View>



                  {/* Add Button - Cart Icon */}
                  <TouchableOpacity
                    style={{ backgroundColor: accentColor }}
                    className="w-10 h-10 rounded-full items-center justify-center shadow-sm"
                    onPress={() => handleProductPress(item)}
                  >
                    <Ionicons name="cart-outline" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </LinearGradient>
  );
};

export default DealOfDaySection;
