import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  useColorScheme,
  Animated,
  Image,
  StyleProp,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useCategories } from '../../../hooks/useCategories';
import { useNavigation } from '@react-navigation/native';
import { useThemePalette } from '../../../hooks/useThemePalette';
import { addCategoryToRecentlyViewed } from '../../../api/medicinesApi';


// Shimmer Skeleton Component
interface SkeletonShimmerProps {
  width: number;
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
          width,
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

interface Category {
  _id: string;
  name: string;
  imageUrl?: string;
  image?: string;
}

const CategoriesSection: React.FC = () => {
  const { isDark, accentColor } = useThemePalette();
  const navigation = useNavigation();
  const { width: screenWidth } = useWindowDimensions();

  const { data: items, isLoading, error } = useCategories();

  // Show shimmer if loading OR if we have an error (retry logic handles refetching) OR if data is empty
  // The user wants to keep showing shimmer until data is found
  const showShimmer = isLoading || error || !items || items.length === 0;

  // Calculate Item Width for 4 items per row
  // Padding Horizontal = 8 (left) + 8 (right) = 16
  const ITEM_WIDTH = (screenWidth - 16) / 4;

  const handleSelectCategory = async (categoryId: string, categoryName: string) => {
    // Navigate to category page or filter
    console.log('Selected category:', categoryName);
    try {
      await addCategoryToRecentlyViewed(categoryId);
      console.log('[CategoriesSection] Added to recently viewed:', categoryId);
    } catch (error) {
      console.error('[CategoriesSection] Error adding to recently viewed:', error);
    }
    // navigation.navigate('Category', { name: categoryName });
  };

  const renderList = (list: Category[]) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 8,
        paddingVertical: 6,
        alignItems: 'center',
      }}
    >
      {list.map((c, i) => (
        <TouchableOpacity
          key={c._id || c.name || i}
          onPress={() => handleSelectCategory(c._id, c.name)}
          style={{ 
            width: ITEM_WIDTH,
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}
        >
          <LinearGradient
            colors={isDark ? ['#2A2A2A', '#3A3A3A'] : ['#FFF', '#F4F4F6']}
            style={{
              width: ITEM_WIDTH * 0.8,
              height: ITEM_WIDTH * 0.8,
              borderRadius: (ITEM_WIDTH * 0.8) / 2,
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: isDark ? '#374151' : '#E5E7EB',
            }}
          >
            <Image
              source={{ uri: c.imageUrl || c.image }}
              style={{ width: '100%', height: '100%', borderRadius: (ITEM_WIDTH * 0.8) / 2 }}
              resizeMode="cover"
            />
          </LinearGradient>
          <Text
            numberOfLines={1}
            className="mt-1.5 text-xs text-center font-medium"
            style={{ 
              color: isDark ? '#E5E7EB' : '#1F2937',
              width: '100%',
              paddingHorizontal: 4,
            }}
          >
            {c.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderShimmerPlaceholders = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 8,
        paddingVertical: 6,
        alignItems: 'center',
      }}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <View
          key={i}
          style={{ 
            width: ITEM_WIDTH,
            alignItems: 'center',
          }}
        >
          <SkeletonShimmer 
            width={ITEM_WIDTH * 0.8} 
            height={ITEM_WIDTH * 0.8} 
            borderRadius={(ITEM_WIDTH * 0.8) / 2} 
          />
          <SkeletonShimmer
            width={ITEM_WIDTH * 0.6}
            height={12}
            borderRadius={6}
            style={{ marginTop: 8 }}
          />
        </View>
      ))}
    </ScrollView>
  );

  return (
    <LinearGradient
      colors={isDark ? ['#2A2D35', '#181A20'] : ['#F3F4F6', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="mt-0"
    >
      <Text 
        className="ml-3 text-lg font-bold mb-2"
        style={{ color: isDark ? '#FFFFFF' : '#1F2937' }}
      >
        Categories
      </Text>
      
      {showShimmer ? renderShimmerPlaceholders() : renderList(items)}
    </LinearGradient>
  );
};

export default CategoriesSection;
