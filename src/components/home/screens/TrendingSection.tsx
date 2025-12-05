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

const { width: screenWidth } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================

interface TrendingProduct {
    _id: string;
    title: string;
    price: number;
    originalPrice?: number;
    rating: number;
    imageUrl: string;
    discount?: number;
}

// ============================================================================
// MOCK DATA (10 Items)
// ============================================================================

const MOCK_TRENDING_DATA: TrendingProduct[] = [
    {
        _id: '1', title: 'Blood Pressure Monitor', price: 1299, originalPrice: 1999, discount: 35, rating: 4.5,
        imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5vNDXiKdpsCwanXiHh89FU5JpvuYczaelDg&s'
    },
    {
        _id: '2', title: 'Accu-Chek Active Strips', price: 499, originalPrice: 650, discount: 23, rating: 4.8,
        imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqyCvpaCHA8mRtH3FKaRSRPqWQHN-LoTcK2nx1PxPWA2Ra5PFId2XXlGJQGE0j-nFWDIM&usqp=CAU'
    },
    {
        _id: '3', title: 'Cerelac Baby Food', price: 899, originalPrice: 950, discount: 5, rating: 4.7,
        imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqyCvpaCHA8mRtH3FKaRSRPqWQHN-LoTcK2nx1PxPWA2Ra5PFId2XXlGJQGE0j-nFWDIM&usqp=CAU'
    },
    {
        _id: '4', title: 'Omron Digital Thermometer', price: 299, originalPrice: 450, discount: 33, rating: 4.4,
        imageUrl: 'https://m.media-amazon.com/images/I/61+9X-1-IWL._AC_UF1000,1000_QL80_.jpg'
    },
    {
        _id: '5', title: 'N95 Face Masks (Pack of 5)', price: 199, originalPrice: 499, discount: 60, rating: 4.2,
        imageUrl: 'https://m.media-amazon.com/images/I/71p-M3N2fVL._AC_UL480_FMwebp_QL65_.jpg'
    },
    {
        _id: '6', title: 'Hand Sanitizer 500ml', price: 250, originalPrice: 300, discount: 16, rating: 4.3,
        imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5vNDXiKdpsCwanXiHh89FU5JpvuYczaelDg&s'
    },
    {
        _id: '7', title: 'Vitamin C Tablets', price: 350, originalPrice: 500, discount: 30, rating: 4.6,
        imageUrl: 'https://m.media-amazon.com/images/I/71r3+J3tVzL._AC_UL480_FMwebp_QL65_.jpg'
    },
    {
        _id: '8', title: 'Whey Protein 1kg', price: 2499, originalPrice: 3500, discount: 28, rating: 4.9,
        imageUrl: 'https://m.media-amazon.com/images/I/61s7s+eR+JL._AC_UL480_FMwebp_QL65_.jpg'
    },
    {
        _id: '9', title: 'First Aid Kit Box', price: 850, originalPrice: 1200, discount: 29, rating: 4.5,
        imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5vNDXiKdpsCwanXiHh89FU5JpvuYczaelDg&s'
    },
    {
        _id: '10', title: 'Glucometer Kit', price: 1500, originalPrice: 2200, discount: 32, rating: 4.7,
        imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqyCvpaCHA8mRtH3FKaRSRPqWQHN-LoTcK2nx1PxPWA2Ra5PFId2XXlGJQGE0j-nFWDIM&usqp=CAU'
    },
    {
        _id: '11', title: 'Whey Protein 1kg', price: 299, originalPrice: 3500, discount: 28, rating: 4.9,
        imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqyCvpaCHA8mRtH3FKaRSRPqWQHN-LoTcK2nx1PxPWA2Ra5PFId2XXlGJQGE0j-nFWDIM&usqp=CAU'
    },
    {
        _id: '12', title: 'First Aid Kit Box', price: 50, originalPrice: 1200, discount: 29, rating: 4.5,
        imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5vNDXiKdpsCwanXiHh89FU5JpvuYczaelDg&s'
    },
    {
        _id: '13', title: 'Glucometer Kit', price: 500, originalPrice: 2200, discount: 32, rating: 4.7,
        imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqyCvpaCHA8mRtH3FKaRSRPqWQHN-LoTcK2nx1PxPWA2Ra5PFId2XXlGJQGE0j-nFWDIM&usqp=CAU'
    },
];

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
                borderRadius: 10,
                backgroundColor: isDark ? '#1E2028' : '#FFFFFF',
                shadowColor: isDark ? '#000' : '#1F2937',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.3 : 0.08,
                shadowRadius: 12,
                elevation: 6,
            }}
        >
            {/* Image Container with Gradient Overlay */}
            <View className="relative" style={{ height: 140 }}>
                <LinearGradient
                    colors={isDark ? ['#2A2D38', '#1E2028'] : ['#F9FAFB', '#F3F4F6']}
                    className="absolute inset-0 rounded-t-[20px]"
                />

                <View className="h-full w-full p-3 justify-center items-center">
                    <Image
                        source={{ uri: item.imageUrl }}
                        className="w-full h-full"
                        resizeMode="contain"
                    />
                </View>

                {/* Discount Badge - Modern Design */}
                {item.discount && (
                    <LinearGradient
                        colors={['#44ef4fff', '#1ac352ff']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="absolute top-3 right-3 px-2.5 py-1 rounded-lg"
                        style={{
                            shadowColor: '#44ef47ff',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                            elevation: 3,
                            borderRadius: 10,
                        }}
                    >
                        <Text className="text-white text-[10px] font-bold">
                            {item.discount}% OFF
                        </Text>
                    </LinearGradient>
                )}

                {/* Wishlist Icon - Premium Style */}
                <TouchableOpacity
                    className="absolute top-3 left-3 w-9 h-9 rounded-full justify-center items-center"
                    style={{
                        backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.95)',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 2,
                    }}
                >
                    <Icon
                        name="heart-outline"
                        size={18}
                        color={isDark ? '#FFF' : '#EF4444'}
                    />
                </TouchableOpacity>
            </View>

            {/* Content Area - Enhanced Spacing */}
            <View className="px-3.5 py-3 pb-3.5">
                {/* Title - Better Typography */}
                <Text
                    className="font-bold text-gray-900 dark:text-white mb-1.5 leading-[18px]"
                    numberOfLines={2}
                    style={{
                        fontSize: 13.5,
                        minHeight: 36,
                        letterSpacing: -0.2,
                    }}
                >
                    {item.title}
                </Text>

                {/* Rating with Better Design */}
                <View className="flex-row items-center mb-2.5">
                    <View className="flex-row items-center bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-md">
                        <Icon name="star" size={11} color="#F59E0B" />
                        <Text className="text-[11px] font-bold text-amber-700 dark:text-amber-400 ml-1">
                            {item.rating}
                        </Text>
                    </View>
                    <Text className="text-[10px] text-gray-400 dark:text-gray-500 ml-1.5">
                        (85 reviews)
                    </Text>
                </View>

                {/* Price Section - Enhanced Layout */}
                <View className="flex-row items-end justify-between">
                    <View>
                        <View className="flex-row items-baseline">
                            <Text
                                className="font-extrabold text-gray-900 dark:text-white"
                                style={{ fontSize: 18, letterSpacing: -0.5 }}
                            >
                                ₹{item.price}
                            </Text>
                            {item.originalPrice && (
                                <Text
                                    className="text-gray-400 dark:text-gray-500 line-through ml-1.5"
                                    style={{ fontSize: 11 }}
                                >
                                    ₹{item.originalPrice}
                                </Text>
                            )}
                        </View>
                        {item.originalPrice && (
                            <Text className="text-[9px] text-green-600 dark:text-green-400 font-semibold mt-0.5">
                                Save ₹{item.originalPrice - item.price}
                            </Text>
                        )}
                    </View>

                    {/* Add to Cart Button - Premium Gradient */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 12,
                            backgroundColor: accentColor,
                            justifyContent: 'center',
                            alignItems: 'center',
                            shadowColor: accentColor,
                            shadowOffset: { width: 0, height: 3 },
                            shadowOpacity: 0.3,
                            shadowRadius: 6,
                            elevation: 4,
                        }}
                    >
                        <Icon name="cart-outline" size={22} color="#FFFFFF" />
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
    const [isLoading, setIsLoading] = useState(true);

    // Simulate loading delay
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);


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
                        Most popular choices this week
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => navigation.navigate('AllProducts', { type: 'trending' })}
                >
                    <Text style={{ color: isDark ? '#ffffff' : '#000000' }} className="text-sm font-bold">View All</Text>
                </TouchableOpacity>
            </View>

            {/* Multiple Rows - Each Row Scrolls Independently */}
            {/* Multiple Rows or Loading Skeleton */}
            <View>
                {isLoading ? (
                    // Render Skeletons
                    Array.from({ length: 2 }).map((_, rowIndex) => (
                        <View key={`skeleton-row-${rowIndex}`} className="mb-2">
                            <FlatList
                                horizontal
                                data={[1, 2, 3, 4]} // 4 dummy items per row for visual filling
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
                    // Render Real Data chunks of 8
                    Array.from({ length: Math.ceil(MOCK_TRENDING_DATA.length / 8) }, (_, rowIndex) => {
                        const rowData = MOCK_TRENDING_DATA.slice(rowIndex * 8, (rowIndex + 1) * 8);
                        return (
                            <View key={`row-${rowIndex}`} className="mb-2">
                                <FlatList
                                    horizontal
                                    data={rowData}
                                    keyExtractor={(item) => item._id}
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 10 }}
                                    renderItem={({ item }) => (
                                        <TrendingProductCard
                                            item={item}
                                            accentColor={accentColor}
                                            isDark={isDark}
                                            onPress={() => navigation.navigate('ProductDetail', { productId: item._id, product: item })}
                                        />
                                    )}
                                />
                            </View>
                        );
                    })
                )}
            </View>
        </LinearGradient>
    );
};

export default TrendingSection;
