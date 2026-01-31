import React, { useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, Image, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useCategories } from '../../../hooks/useCategories';
import { useThemePalette } from '../../../hooks/useThemePalette';
import { addCategoryToRecentlyViewed } from '../../../api/medicinesApi';

interface Category {
  _id: string;
  name: string;
  imageUrl?: string;
  image?: string;
}

const SkeletonShimmer = memo<{ width: number; height: number; borderRadius?: number }>(({ width, height, borderRadius = 8 }) => {
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

  const opacity = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] });

  return <Animated.View style={{ width, height, borderRadius, opacity }} className="bg-gray-200 dark:bg-gray-700" />;
});

const CategoryItem = memo<{ category: Category; itemWidth: number; isDark: boolean; onSelect: (id: string, name: string) => void }>(
  ({ category, itemWidth, isDark, onSelect }) => {
    const circleSize = itemWidth * 0.8;
    const circleRadius = circleSize / 2;

    return (
      <TouchableOpacity onPress={() => onSelect(category._id, category.name)} style={{ width: itemWidth, alignItems: 'center', justifyContent: 'flex-start' }}>
        <LinearGradient
          colors={isDark ? ['#2A2A2A', '#3A3A3A'] : ['#FFF', '#F4F4F6']}
          style={{ width: circleSize, height: circleSize, borderRadius: circleRadius, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: isDark ? '#374151' : '#E5E7EB' }}
        >
          <Image source={{ uri: category.imageUrl || category.image }} style={{ width: '100%', height: '100%', borderRadius: circleRadius }} resizeMode="cover" />
        </LinearGradient>
        <Text numberOfLines={1} className="mt-1.5 text-xs text-center font-medium" style={{ color: isDark ? '#E5E7EB' : '#1F2937', width: '100%', paddingHorizontal: 4 }}>
          {category.name}
        </Text>
      </TouchableOpacity>
    );
  }
);

const CategoriesSection: React.FC<{ visible?: boolean; onReady?: () => void }> = ({ visible = false, onReady }) => {
  const { isDark } = useThemePalette();
  const { width: screenWidth } = useWindowDimensions();
  const { data: items = [], isLoading, error } = useCategories();
  const itemWidth = useMemo(() => (screenWidth - 16) / 4, [screenWidth]);
  const showShimmer = isLoading || error || items.length === 0;

  useEffect(() => {
    if (!isLoading) {
      onReady?.();
    }
  }, [isLoading, onReady]);

  const navigation = useNavigation<any>();

  const handleSelectCategory = useCallback(async (categoryId: string, categoryName: string) => {
    try {
      await addCategoryToRecentlyViewed(categoryId);
    } catch { }

    navigation.navigate('CategoryProducts', { categoryId, categoryName });
  }, [navigation]);

  const gradientColors = useMemo(() => (isDark ? ['#2A2D35', '#181A20'] : ['#F3F4F6', '#FFFFFF']), [isDark]);

  if (!visible) return null;

  return (
    <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} className="mt-0">
      <Text className="ml-3 text-lg font-bold mb-2" style={{ color: isDark ? '#FFFFFF' : '#1F2937' }}>Categories</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 6, alignItems: 'center' }}>
        {showShimmer
          ? Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={{ width: itemWidth, alignItems: 'center' }}>
              <SkeletonShimmer width={itemWidth * 0.8} height={itemWidth * 0.8} borderRadius={(itemWidth * 0.8) / 2} />
              <SkeletonShimmer width={itemWidth * 0.6} height={12} borderRadius={6} />
            </View>
          ))
          : items.map((c, i) => <CategoryItem key={c._id || i} category={c} itemWidth={itemWidth} isDark={isDark} onSelect={handleSelectCategory} />)}
      </ScrollView>
    </LinearGradient>
  );
};

export default memo(CategoriesSection);
