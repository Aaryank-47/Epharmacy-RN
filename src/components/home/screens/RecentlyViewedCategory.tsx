import React, { useMemo, memo, useCallback, useRef, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, Dimensions, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../../AppNavigator';
import { useRecentlyViewedCategories, useAddToRecentlyViewedCategory } from '../../../hooks/useRecentlyViewed';
import useThemePalette from '../../../hooks/useThemePalette';
import { useSocketEvent } from '../../../hooks/useSocketEvent';
import { SOCKET_EVENTS } from '../../../services/socketEvents.types';

const { width } = Dimensions.get('window');

const ITEM_WIDTH = (width - 32) / 4;
const ITEM_MARGIN_RIGHT = 8;
const FULL_ITEM_WIDTH = ITEM_WIDTH + ITEM_MARGIN_RIGHT; // For getItemLayout

// ----------------------------------------------------------------------------
// MEMOIZED CATEGORY ITEM
// ----------------------------------------------------------------------------
interface CategoryItemProps {
    item: any;
    isDark: boolean;
    onPress: (categoryId: string, categoryName: string) => void;
}

const CategoryItem = memo<CategoryItemProps>(({ item, isDark, onPress }) => (
    <TouchableOpacity
        onPress={() => onPress(item._id, item.name)}
        style={{ width: ITEM_WIDTH, marginRight: ITEM_MARGIN_RIGHT }}
        className="items-center justify-start"
        activeOpacity={0.7}
    >
        <LinearGradient
            colors={isDark ? ['#2A2A2A', '#3A3A3A'] : ['#FFF', '#F4F4F6']}
            style={{
                width: ITEM_WIDTH * 0.8,
                height: ITEM_WIDTH * 0.8,
                borderRadius: (ITEM_WIDTH * 0.8) / 2,
            }}
            className="justify-center items-center overflow-hidden border border-gray-200 dark:border-gray-700"
        >
            {item.imageUrl ? (
                <Image
                    source={{ uri: item.imageUrl }}
                    style={{ borderRadius: (ITEM_WIDTH * 0.8) / 2 }}
                    className="w-full h-full"
                    resizeMode="cover"
                />
            ) : (
                <Icon name="image-outline" size={24} color={isDark ? '#555' : '#DDD'} />
            )}
        </LinearGradient>
        <Text
            numberOfLines={1}
            className="mt-1.5 text-xs text-center font-medium w-full px-1 text-gray-800 dark:text-gray-200"
        >
            {item.name}
        </Text>
    </TouchableOpacity>
), (prev, next) => (
    prev.item._id === next.item._id && prev.isDark === next.isDark
));

// ----------------------------------------------------------------------------
// MEMOIZED SKELETON LOADER
// ----------------------------------------------------------------------------
const CategorySkeleton = memo(({ isDark }: { isDark: boolean }) => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
            ])
        );
        anim.start();
        return () => anim.stop();
    }, [opacity]);

    const skeletonColor = isDark ? '#2A2A2A' : '#E5E7EB';

    return (
        <View className="mb-4 mt-2">
            <View className="px-5 mb-3">
                <View style={{ width: 140, height: 20, borderRadius: 4, backgroundColor: skeletonColor }} />
            </View>
            <View className="flex-row px-4">
                {[1, 2, 3, 4].map((i) => (
                    <View key={i} style={{ width: ITEM_WIDTH, marginRight: ITEM_MARGIN_RIGHT }} className="items-center">
                        <Animated.View
                            style={{
                                width: ITEM_WIDTH * 0.8,
                                height: ITEM_WIDTH * 0.8,
                                borderRadius: (ITEM_WIDTH * 0.8) / 2,
                                backgroundColor: skeletonColor,
                                opacity
                            }}
                        />
                        <Animated.View
                            style={{
                                width: ITEM_WIDTH * 0.6,
                                height: 12,
                                marginTop: 8,
                                borderRadius: 4,
                                backgroundColor: skeletonColor,
                                opacity
                            }}
                        />
                    </View>
                ))}
            </View>
        </View>
    );
});

interface RecentlyViewedCategoryProps {
    transparentBackground?: boolean;
}

// ----------------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------------
const RecentlyViewedCategory = ({ transparentBackground = false }: RecentlyViewedCategoryProps) => {
    const { isDark } = useThemePalette();
    const { data: apiResponse, isLoading } = useRecentlyViewedCategories();

    const queryClient = useQueryClient();

    // Real-time updates - Optimized with single callback O(1)
    const invalidateCategories = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['recentlyViewedCategories'] });
    }, [queryClient]);

    useSocketEvent(SOCKET_EVENTS.CATEGORY_VIEWED_UPDATE, invalidateCategories);
    useSocketEvent(SOCKET_EVENTS.CATEGORY_PRODUCT_UPDATED, invalidateCategories);
    useSocketEvent(SOCKET_EVENTS.CATEGORY_PRODUCT_DELETED, invalidateCategories);

    // Algorithmic Optimization: O(N) deduplication using Set vs O(N^2) filter/findIndex
    const categories = useMemo(() => {
        const rawData = apiResponse?.data || [];
        if (!rawData.length) return [];

        const seen = new Set();
        const uniqueData = [];
        // Forward loop to maintain backend order
        for (let i = 0; i < rawData.length; i++) {
            const item = rawData[i];
            if (item._id && !seen.has(item._id)) {
                seen.add(item._id);
                uniqueData.push(item);
            }
        }
        // Reverse to show newest first (left) to oldest (right)
        return uniqueData.reverse();
    }, [apiResponse]);

    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const addToRecentlyViewed = useAddToRecentlyViewedCategory();

    const handlePress = useCallback((categoryId: string, categoryName: string) => {
        // Navigate immediately for instant UX - O(1) operation
        navigation.navigate('CategoryProducts', { categoryId, categoryName });
        
        // Trigger mutation - automatically invalidates & refetches for real-time UI update
        addToRecentlyViewed.mutate(categoryId);
    }, [navigation, addToRecentlyViewed]);

    const renderItem = useCallback(({ item }: { item: any }) => (
        <CategoryItem
            item={item}
            isDark={isDark}
            onPress={handlePress}
        />
    ), [isDark, handlePress]);

    const getItemLayout = useCallback((_: any, index: number) => ({
        length: FULL_ITEM_WIDTH,
        offset: FULL_ITEM_WIDTH * index,
        index,
    }), []);

    if (isLoading) {
        return <CategorySkeleton isDark={isDark} />;
    }

    if (categories.length === 0) {
        return null;
    }

    const Header = () => (
        <View className="px-4 mb-3 flex-row items-center justify-between">
            <Text
                className="text-lg font-bold tracking-tight"
                style={{ color: isDark ? '#FFF' : '#1A1A1A' }}
            >
                Recently Viewed Categories
            </Text>
        </View>
    );

    const Carousel = () => (
        <FlatList
            data={categories}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 10 }}
            initialNumToRender={5}
            maxToRenderPerBatch={5}
            windowSize={5}
            removeClippedSubviews={true}
            getItemLayout={getItemLayout}
        />
    );

    if (transparentBackground) {
        return (
            <View className="mb-4 py-0">
                <Header />
                <Carousel />
            </View>
        );
    }

    return (
        <LinearGradient
            colors={isDark ? ['#121212', '#2A2D35'] : ['#F3F4F6', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            className="mb-4 py-3"
        >
            <Header />
            <Carousel />
        </LinearGradient>
    );
};

export default React.memo(RecentlyViewedCategory);
