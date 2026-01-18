import React, { memo, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTrendingProducts } from '../../../hooks/useTrendingProducts';
import { useNavigation } from '@react-navigation/native';
import {
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    Image,
    FlatList,
    Animated,
    ToastAndroid,
    ListRenderItem,
    Platform
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useThemePalette } from '../../../hooks/useThemePalette';
import { useCart } from '../../../context/CartContext';
import { useWishlist } from '../../../context/WishlistContext';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = (screenWidth - 28) / 2;
const CARD_SPACING = 12; // Right margin
const FULL_CARD_WIDTH = CARD_WIDTH + CARD_SPACING;

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
// SHARED ANIMATION HOOK
// ============================================================================
const useSharedShimmer = () => {
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

    return shimmerAnim;
};

// ============================================================================
// SKELETON SHIMMER COMPONENT (Driven by Shared Value)
// ============================================================================

interface SkeletonShimmerProps {
    width: number | string;
    height: number;
    borderRadius?: number;
    isDark: boolean;
    animValue: Animated.Value; // passed from parent
    style?: any;
}

const SkeletonShimmer = memo<SkeletonShimmerProps>(
    ({ width, height, borderRadius = 8, isDark, animValue, style }) => {
        const opacity = animValue.interpolate({
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
// TRENDING SKELETON CARD (Memoized)
// ============================================================================

const TrendingSkeletonCard = memo(({ isDark, animValue }: { isDark: boolean, animValue: Animated.Value }) => (
    <View
        style={{
            width: CARD_WIDTH,
            borderRadius: 10,
            backgroundColor: isDark ? '#1E2028' : '#FFFFFF',
            marginRight: 12,
            marginBottom: 8,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: isDark ? '#2D3038' : '#E5E7EB',
        }}
    >
        {/* Image Placeholder */}
        <View style={{ height: 140, width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#2A2D38' : '#F3F4F6' }}>
            <SkeletonShimmer width={100} height={100} borderRadius={8} isDark={isDark} animValue={animValue} />
        </View>

        {/* Content Area */}
        <View style={{ padding: 14 }}>
            <SkeletonShimmer width="90%" height={14} borderRadius={4} isDark={isDark} animValue={animValue} style={{ marginBottom: 6 }} />
            <SkeletonShimmer width="60%" height={14} borderRadius={4} isDark={isDark} animValue={animValue} style={{ marginBottom: 10 }} />

            <SkeletonShimmer width={80} height={16} borderRadius={4} isDark={isDark} animValue={animValue} style={{ marginBottom: 12 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }}>
                <View>
                    <SkeletonShimmer width={60} height={20} borderRadius={4} isDark={isDark} animValue={animValue} />
                    <SkeletonShimmer width={40} height={12} borderRadius={4} isDark={isDark} animValue={animValue} style={{ marginTop: 4 }} />
                </View>
                <SkeletonShimmer width={38} height={38} borderRadius={12} isDark={isDark} animValue={animValue} />
            </View>
        </View>
    </View>
));

TrendingSkeletonCard.displayName = 'TrendingSkeletonCard';

// ============================================================================
// PREMIUM PRODUCT CARD (Memoized)
// ============================================================================

interface TrendingProductCardProps {
    item: TrendingProduct;
    accentColor: string;
    onPress: (item: TrendingProduct) => void;
    onAddToCart: (item: TrendingProduct) => void;
    isDark: boolean;
    isInCart: boolean;
    onToggleWishlist: (item: TrendingProduct) => void;
    isInWishlist: boolean;
}

const TrendingProductCard = memo<TrendingProductCardProps>(
    ({ item, accentColor, onPress, onAddToCart, isDark, isInCart, onToggleWishlist, isInWishlist }) => (
        <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => onPress(item)}
            className="mr-3 mb-2"
            style={{
                width: CARD_WIDTH,
                borderRadius: 12,
                backgroundColor: isDark ? '#1E2028' : '#FFFFFF',
                overflow: 'hidden',
                marginRight: 12,
                marginBottom: 8,
                borderWidth: 0.5,
                borderColor: isDark ? '#2D3038' : '#E5E7EB',
                ...Platform.select({
                    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
                    android: { elevation: 4 },
                }),
            }}
        >
            {/* Image Container - Full Width */}
            <View className="relative" style={{ height: 140 }}>
                <Image
                    source={{ uri: item.image || '' }}
                    style={{
                        width: '100%',
                        height: '100%',
                        borderTopLeftRadius: 12,
                        borderTopRightRadius: 12,
                    }}
                    resizeMode="cover"
                />

                {/* Discount Badge */}
                {!!item.itemDiscount && item.itemDiscount > 0 && (
                    <LinearGradient
                        colors={['#44ef4fff', '#1ac352ff']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 8,
                            shadowColor: '#44ef47ff',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                            elevation: 3,
                        }}
                    >
                        <Text className="text-white text-[10px] font-bold">
                            {`${String(item.itemDiscount)}% OFF`}
                        </Text>
                    </LinearGradient>
                )}

                {/* Wishlist Icon */}
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => onToggleWishlist(item)}
                    style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
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
                    <Icon name={isInWishlist ? "heart" : "heart-outline"} size={18} color="#EF4444" />
                </TouchableOpacity>
            </View>

            <View className="px-2.5 py-2">
                <Text
                    className="font-bold text-gray-900 dark:text-white mb-1"
                    numberOfLines={1}
                    style={{ fontSize: 13, letterSpacing: -0.2 }}
                >
                    {item.itemName || 'Product'}
                </Text>

                {item.itemDescription && (
                    <Text
                        className="text-gray-500 dark:text-gray-400 mb-1.5"
                        numberOfLines={2}
                        style={{ fontSize: 10, lineHeight: 14 }}
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
                            {!!item.itemInitialPrice && item.itemInitialPrice > 0 && (
                                <Text
                                    className="text-gray-400 dark:text-gray-500 line-through ml-1"
                                    style={{ fontSize: 10 }}
                                >
                                    ₹{String(item.itemInitialPrice)}
                                </Text>
                            )}
                        </View>
                        {!!item.itemInitialPrice && item.itemInitialPrice > 0 && item.itemFinalPrice >= 0 && (
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

                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => onAddToCart(item)}
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 20,
                            backgroundColor: isInCart ? (isDark ? '#374151' : '#9CA3AF') : accentColor,
                            justifyContent: 'center',
                            alignItems: 'center',
                            shadowColor: isInCart ? 'transparent' : accentColor,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                            elevation: 3,
                        }}
                    >
                        <Icon name={isInCart ? "checkmark" : "cart-outline"} size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    ), (prev, next) => (
        prev.item._id === next.item._id &&
        prev.isDark === next.isDark &&
        prev.isInCart === next.isInCart &&
        prev.isInWishlist === next.isInWishlist &&
        prev.accentColor === next.accentColor
    )
);

TrendingProductCard.displayName = 'TrendingProductCard';

// ============================================================================
// MAIN TRENDING SECTION
// ============================================================================

const TrendingSection: React.FC = () => {
    const navigation = useNavigation<any>();
    const { isDark, accentColor } = useThemePalette();
    const { addToCart, isInCart } = useCart();
    const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist();

    const { data: trendingProducts, isLoading } = useTrendingProducts();
    const sharedShimmer = useSharedShimmer();

    const handleProductPress = useCallback((item: TrendingProduct) => {
        if (item._id) {
            navigation.navigate('ProductDetail', { productId: item._id });
        }
    }, [navigation]);

    const handleToggleWishlist = useCallback((item: TrendingProduct) => {
        if (isInWishlist(item._id)) {
            removeFromWishlist(item._id);
        } else {
            addToWishlist({
                _id: item._id,
                itemName: item.itemName,
                itemDescription: item.itemDescription,
                image: item.image,
                itemFinalPrice: item.itemFinalPrice,
                itemRatings: item.itemRatings,
                itemDiscount: item.itemDiscount,
                itemInitialPrice: item.itemInitialPrice
            });
        }
    }, [isInWishlist, removeFromWishlist, addToWishlist]);

    const handleAddToCart = useCallback((item: TrendingProduct) => {
        if (isInCart(item._id)) {
            ToastAndroid.show('Item has already been added to the cart', ToastAndroid.SHORT);
            return;
        }

        addToCart({
            id: item._id,
            name: item.itemName,
            price: item.itemFinalPrice,
            quantity: 1,
        });
        ToastAndroid.show('Item has been added to the cart', ToastAndroid.SHORT);
    }, [isInCart, addToCart]);

    const renderItem: ListRenderItem<TrendingProduct> = useCallback(({ item }) => (
        <TrendingProductCard
            item={item}
            accentColor={accentColor}
            isDark={isDark}
            onPress={handleProductPress}
            onAddToCart={handleAddToCart}
            isInCart={isInCart(item._id)}
            onToggleWishlist={handleToggleWishlist}
            isInWishlist={isInWishlist(item._id)}
        />
    ), [accentColor, isDark, handleProductPress, handleAddToCart, isInCart, handleToggleWishlist, isInWishlist]);

    const getItemLayout = useCallback((_: any, index: number) => ({
        length: FULL_CARD_WIDTH,
        offset: FULL_CARD_WIDTH * index,
        index,
    }), []);

    // Skeleton list data
    const skeletonData = useMemo(() => [1, 2, 3, 4], []);

    // Split data into two rows
    const firstRow = useMemo(() => Array.isArray(trendingProducts) ? trendingProducts.slice(0, 10) : [], [trendingProducts]);
    const secondRow = useMemo(() => Array.isArray(trendingProducts) ? trendingProducts.slice(10) : [], [trendingProducts]);

    return (
        <LinearGradient
            colors={isDark ? ['#181A20', '#2A2D35'] : ['#ffffff', '#F3F4F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ paddingVertical: 16, marginTop: 0 }}
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

            <View>
                {isLoading || !trendingProducts || !Array.isArray(trendingProducts) || trendingProducts.length === 0 ? (
                    <View className="mb-2">
                        <FlatList
                            horizontal
                            data={skeletonData}
                            keyExtractor={(item) => `skeleton-${item}`}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 10 }}
                            renderItem={() => (
                                <TrendingSkeletonCard isDark={isDark} animValue={sharedShimmer} />
                            )}
                        />
                    </View>
                ) : (
                    <View className="mb-2">
                        {/* First Row: First 10 items */}
                        <FlatList
                            horizontal
                            data={firstRow}
                            keyExtractor={(item) => item._id}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 10 }}
                            renderItem={renderItem}
                            initialNumToRender={3}
                            maxToRenderPerBatch={3}
                            windowSize={3}
                            removeClippedSubviews={Platform.OS === 'android'}
                            getItemLayout={getItemLayout}
                        />

                        {/* Second Row: Remaining items */}
                        {secondRow.length > 0 && (
                            <FlatList
                                horizontal
                                data={secondRow}
                                keyExtractor={(item) => item._id}
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 10, marginTop: 12 }}
                                renderItem={renderItem}
                                initialNumToRender={3}
                                maxToRenderPerBatch={3}
                                windowSize={3}
                                removeClippedSubviews={Platform.OS === 'android'}
                                getItemLayout={getItemLayout}
                            />
                        )}
                    </View>
                )}
            </View>
        </LinearGradient>
    );
};

export default memo(TrendingSection);
