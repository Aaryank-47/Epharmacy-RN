import React, { memo, useMemo, useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    Image,
    FlatList,
    Animated,
    Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useThemePalette } from '../../../hooks/useThemePalette';
import { useTrendingProducts } from '../../../hooks/useTrendingProducts';
import { addItemToRecentlyViewed } from '../../../api/medicinesApi';

const { width: screenWidth } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================

interface TrendingProduct {
    _id: string;
    itemName: string;
    itemDescription?: string;
    image: string;
    itemRatings: number;
    itemFinalPrice: number;
    itemDiscount: number;
    itemInitialPrice?: number;
}

// ============================================================================
// SKELETON SHIMMER COMPONENT
// ============================================================================

interface SkeletonShimmerProps {
    width: number | string;
    height: number;
    borderRadius?: number;
    isDark: boolean;
    style?: any;
}

const SkeletonShimmer = memo<SkeletonShimmerProps>(
    ({ width, height, borderRadius = 8, isDark, style }) => {
        const shimmerAnim = useRef(new Animated.Value(0)).current;

        useEffect(() => {
            const animation = Animated.loop(
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
            );
            animation.start();
            return () => animation.stop();
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
                        backgroundColor: isDark ? '#3A3A3A' : '#E5E7EB',
                        opacity,
                    },
                    style,
                ]}
            />
        );
    }
);

SkeletonShimmer.displayName = 'SkeletonShimmer';

// ============================================================================
// TRENDING SKELETON CARD
// ============================================================================

const TrendingSkeletonCard = memo(({ isDark }: { isDark: boolean }) => (
    <View
        style={{
            width: (screenWidth - 28) / 2,
            borderRadius: 10,
            backgroundColor: isDark ? '#1E2028' : '#FFFFFF',
            shadowColor: isDark ? '#000' : '#1F2937',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.3 : 0.08,
            shadowRadius: 12,
            elevation: 6,
            marginRight: 12,
            marginBottom: 8,
            overflow: 'hidden'
        }}
    >
        {/* Image Placeholder */}
        <View style={{ height: 140, width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#2A2D38' : '#F3F4F6' }}>
            <SkeletonShimmer width={100} height={100} borderRadius={8} isDark={isDark} />
        </View>

        {/* Content Area */}
        <View style={{ padding: 14 }}>
            <SkeletonShimmer width="90%" height={14} borderRadius={4} isDark={isDark} style={{ marginBottom: 6 }} />
            <SkeletonShimmer width="60%" height={14} borderRadius={4} isDark={isDark} style={{ marginBottom: 10 }} />

            <SkeletonShimmer width={80} height={16} borderRadius={4} isDark={isDark} style={{ marginBottom: 12 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }}>
                <View>
                    <SkeletonShimmer width={60} height={20} borderRadius={4} isDark={isDark} />
                    <SkeletonShimmer width={40} height={12} borderRadius={4} isDark={isDark} style={{ marginTop: 4 }} />
                </View>
                <SkeletonShimmer width={38} height={38} borderRadius={12} isDark={isDark} />
            </View>
        </View>
    </View>
));

TrendingSkeletonCard.displayName = 'TrendingSkeletonCard';

// ============================================================================
// PREMIUM PRODUCT CARD
// ============================================================================

interface TrendingProductCardProps {
    item: TrendingProduct;
    accentColor: string;
    onPress: () => void;
    isDark: boolean;
}

const TrendingProductCard = memo<TrendingProductCardProps>(
    ({ item, accentColor, onPress, isDark }) => (
        <TouchableOpacity
            activeOpacity={0.92}
            onPress={onPress}
            className="mr-3 mb-2"
            style={{
                width: (screenWidth - 28) / 2,
                borderRadius: 12,
                backgroundColor: isDark ? '#1E2028' : '#FFFFFF',
                shadowColor: isDark ? '#000' : '#1F2937',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.3 : 0.08,
                shadowRadius: 12,
                elevation: 6,
                overflow: 'hidden',
            }}
        >
            {/* Image Container - Full Width */}
            <View className="relative" style={{ height: 140 }}>
                <Image
                    source={{ uri: item.image }}
                    style={{
                        width: '100%',
                        height: '100%',
                        borderTopLeftRadius: 12,
                        borderTopRightRadius: 12,
                    }}
                    resizeMode="cover"
                />

                {/* Discount Badge - Modern Design */}
                {item.itemDiscount && item.itemDiscount > 0 && (
                    <LinearGradient
                        colors={['#44ef4fff', '#1ac352ff']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="absolute top-2 right-2 px-2 py-1 rounded-lg"
                        style={{
                            shadowColor: '#44ef47ff',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                            elevation: 3,
                            borderRadius: 8,
                        }}
                    >
                        <Text className="text-white text-[10px] font-bold">
                            {`${String(item.itemDiscount)}% OFF`}
                        </Text>
                    </LinearGradient>
                )}

                {/* Wishlist Icon - Top Left */}
                <TouchableOpacity
                    activeOpacity={0.7}
                    style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 3,
                        elevation: 3,
                    }}
                >
                    <Icon name="heart-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
            </View>

            {/* Content Area - Compact */}
            <View className="px-2.5 py-2">
                {/* Title */}
                <Text
                    className="font-bold text-gray-900 dark:text-white mb-1"
                    numberOfLines={1}
                    style={{
                        fontSize: 13,
                        letterSpacing: -0.2,
                    }}
                >
                    {item.itemName}
                </Text>

                {/* Description */}
                {item.itemDescription && (
                    <Text
                        className="text-gray-500 dark:text-gray-400 mb-1.5"
                        numberOfLines={2}
                        style={{
                            fontSize: 10,
                            lineHeight: 14,
                        }}
                    >
                        {item.itemDescription}
                    </Text>
                )}

                {/* Rating */}
                <View className="flex-row items-center mb-0">
                    <View className="flex-row items-center bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-md">
                        <Icon name="star" size={10} color="#F59E0B" />
                        <Text className="text-[10px] font-bold text-amber-700 dark:text-amber-400 ml-0.5">
                            {item.itemRatings || 0}
                        </Text>
                    </View>
                </View>

                {/* Price Section */}
                <View className="flex-row items-end justify-between">
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <View className="flex-row items-baseline">
                            <Text
                                className="font-extrabold text-gray-900 dark:text-white"
                                style={{ fontSize: 16, letterSpacing: -0.5 }}
                            >
                                ₹{String(item.itemFinalPrice || 0)}
                            </Text>
                            {item.itemInitialPrice && item.itemInitialPrice > 0 && (
                                <Text
                                    className="text-gray-400 dark:text-gray-500 line-through ml-1"
                                    style={{ fontSize: 10 }}
                                >
                                    ₹{String(item.itemInitialPrice)}
                                </Text>
                            )}
                        </View>
                        {item.itemInitialPrice && item.itemInitialPrice > 0 && item.itemFinalPrice >= 0 && (
                            <Text 
                                style={{ 
                                    fontSize: 11, 
                                    color: '#16A34A',
                                    fontWeight: '700',
                                    marginTop: 2,
                                }}
                            >
                                {`Save ₹${Math.abs(item.itemInitialPrice - item.itemFinalPrice)}`}
                            </Text>
                        )}
                    </View>

                    {/* Add to Cart Button */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            backgroundColor: accentColor,
                            justifyContent: 'center',
                            alignItems: 'center',
                            shadowColor: accentColor,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                            elevation: 3,
                        }}
                    >
                        <Icon name="cart-outline" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    )
);

TrendingProductCard.displayName = 'TrendingProductCard';

// ============================================================================
// MAIN TRENDING SECTION
// ============================================================================

const TrendingSection: React.FC = () => {
    const navigation = useNavigation<any>();
    const { isDark, accentColor } = useThemePalette();
    
    // React Query for trending products
    const { data: trendingProducts, isLoading } = useTrendingProducts();

    const handleProductPress = async (item: TrendingProduct) => {
        const itemId = item._id;
        console.log('[TrendingSection] Product selected:', item.itemName, '| ID:', itemId);
        
        if (itemId) {
            try {
                await addItemToRecentlyViewed(itemId);
                console.log('[TrendingSection] Added to recently viewed:', itemId);
            } catch (error) {
                console.error('[TrendingSection] Error adding to recently viewed:', error);
            }
        }
        // navigation.navigate('ProductDetail', { productId: itemId, product: item });
    };

    return (
        <LinearGradient
            colors={isDark ? ['#181A20', '#2A2D35'] : ['#ffffff', '#F3F4F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            className="py-4 mt-0"
        >
            {/* Header */}
            <View className="flex-row justify-between items-center px-4 mb-5">
                <View>
                    <Text className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                        Trending Products
                    </Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                        AI Personalized recommendations
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => navigation.navigate('AllProducts', { type: 'trending' })}
                >
                    <Text style={{ color: isDark ? '#ffffff' : '#000000' }} className="text-sm font-bold">View All</Text>
                </TouchableOpacity>
            </View>

            {/* Multiple Rows or Loading Skeleton */}
            <View>
                {isLoading || !trendingProducts || trendingProducts.length === 0 ? (
                    // Render Skeletons
                    Array.from({ length: 2 }).map((_, rowIndex) => (
                        <View key={`skeleton-row-${rowIndex}`} className="mb-2">
                            <FlatList
                                horizontal
                                data={[1, 2, 3, 4]}
                                keyExtractor={(_, idx) => `skeleton-${rowIndex}-${idx}`}
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 10 }}
                                renderItem={() => (
                                    <TrendingSkeletonCard isDark={isDark} />
                                )}
                            />
                        </View>
                    ))
                ) : (
                    // Render Real Data from API
                    <View className="mb-2">
                        <FlatList
                            horizontal
                            data={trendingProducts}
                            keyExtractor={(item) => item._id}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 10 }}
                            renderItem={({ item }) => (
                                <TrendingProductCard
                                    item={item}
                                    accentColor={accentColor}
                                    isDark={isDark}
                                    onPress={() => handleProductPress(item)}
                                />
                            )}
                        />
                    </View>
                )}
            </View>
        </LinearGradient>
    );
};

export default TrendingSection;
