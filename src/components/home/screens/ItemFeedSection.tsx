import React, { memo, useRef, useEffect, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    Image,
    FlatList,
    Animated,
    Platform,
    ToastAndroid,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

import { useItemFeed } from '../../../hooks/useItemFeed';
import { useThemePalette } from '../../../hooks/useThemePalette';
import { useCart } from '../../../context/CartContext';
import { useWishlist } from '../../../context/WishlistContext';
import { ItemFeedItem } from '../../../api/types';

const { width: screenWidth } = Dimensions.get('window');

// ----------------------------------------------------------------------------
// CONFIGURATION
// ----------------------------------------------------------------------------
const PADDING_H = 8;
const GAP = 10;
const CARD_WIDTH = (screenWidth - (PADDING_H * 2) - GAP) / 2;
const CARD_HEIGHT = 285;

// Shared Animation Hook for Performance (Single Driver)
const useSkeletonAnimation = () => {
    const opacity = useRef(new Animated.Value(0.3)).current;
    useEffect(() => {
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
            ])
        );
        anim.start();
        return () => anim.stop();
    }, [opacity]);
    return opacity;
};

// ----------------------------------------------------------------------------
// COMPONENTS
// ----------------------------------------------------------------------------

const SkeletonBlock = memo(({ width, height, borderRadius, style, isDark, opacity }: any) => (
    <Animated.View
        style={[{
            opacity,
            width: width || '100%',
            height: height || 20,
            backgroundColor: isDark ? '#2A2D35' : '#E5E7EB',
            borderRadius: borderRadius || 4
        }, style]}
    />
));

const FeedSkeletonCard = memo(({ isDark, opacity }: { isDark: boolean, opacity: Animated.Value }) => (
    <View style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        marginRight: GAP,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: isDark ? '#1E2028' : '#FFFFFF',
        borderWidth: 1,
        borderColor: isDark ? '#2D3038' : '#E5E7EB',
    }}>
        <SkeletonBlock height={135} width="100%" borderRadius={0} isDark={isDark} opacity={opacity} />
        <View style={{ padding: 12, justifyContent: 'space-between', flex: 1 }}>
            <View>
                <SkeletonBlock height={12} width="40%" isDark={isDark} style={{ marginBottom: 8 }} opacity={opacity} />
                <SkeletonBlock height={16} width="90%" isDark={isDark} style={{ marginBottom: 6 }} opacity={opacity} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <SkeletonBlock height={22} width="50%" isDark={isDark} opacity={opacity} />
                <SkeletonBlock height={32} width={32} borderRadius={16} isDark={isDark} opacity={opacity} />
            </View>
        </View>
    </View>
));

interface ItemCardProps {
    item: ItemFeedItem;
    isDark: boolean;
    accentColor: string;
    onPress: (item: ItemFeedItem) => void;
    onAddToCart: (item: ItemFeedItem) => void;
    isInCart: boolean;
    onToggleWishlist: (item: ItemFeedItem) => void;
    isInWishlist: boolean;
}

const ItemCard = memo<ItemCardProps>(({ item, isDark, accentColor, onPress, onAddToCart, isInCart, onToggleWishlist, isInWishlist }) => {
    const hasDiscount = !!(item.itemDiscount && item.itemDiscount > 0);
    const p1 = Number(item.itemInitialPrice) || 0;
    const p2 = Number(item.itemFinalPrice) || 0;
    const distinct = p1 > 0 && p2 > 0 && p1 !== p2;
    // const higherPrice = Math.max(p1, p2); // Unused calculation optimization
    const lowerPrice = (p1 > 0 && p2 > 0) ? Math.min(p1, p2) : Math.max(p1, p2);
    const savings = parseFloat((Math.abs(p1 - p2)).toFixed(2));
    const showSavings = !!(distinct && savings > 0);

    return (
        <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => onPress(item)}
            style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                marginRight: 10,
                borderRadius: 16,
                overflow: 'hidden',
                backgroundColor: isDark ? '#1E2028' : '#FFFFFF',
                borderWidth: 0.5,
                borderColor: isDark ? '#2D3038' : '#E5E7EB',
                ...Platform.select({
                    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 10 },
                    android: { elevation: 0.7 },
                }),
            }}
        >
            <View style={{
                width: '100%',
                height: 135,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                position: 'relative',
                padding: 12,
            }}>
                {item.image ? (
                    <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                ) : (
                    <Icon name="medkit" size={40} color={isDark ? '#4B5563' : '#E5E7EB'} />
                )}

                {hasDiscount && (
                    <View style={{
                        position: 'absolute', top: 10, left: 10, backgroundColor: '#3ab45aff',
                        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, zIndex: 10,
                        elevation: 2,
                    }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 }}>
                            {item.itemDiscount}% OFF
                        </Text>
                    </View>
                )}

                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={(e) => {
                        e?.stopPropagation?.();
                        onToggleWishlist(item);
                    }}
                    style={{
                        position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16,
                        alignItems: 'center', justifyContent: 'center', zIndex: 10,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)', elevation: 2,
                    }}
                >
                    <Icon name={isInWishlist ? "heart" : "heart-outline"} size={16} color="#EF4444" />
                </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: 10, paddingTop: 10, paddingBottom: 10, flex: 1, flexDirection: 'column', justifyContent: 'space-between' }}>
                <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1.5 }} numberOfLines={1}>
                            {item.code || 'PRODUCT'}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Icon name="star" size={12} color="#FBBF24" />
                            <Text style={{ marginLeft: 4, fontSize: 11, fontWeight: '700', color: isDark ? '#9CA3AF' : '#4B5563' }}>
                                {item.itemRatings ? item.itemRatings.toFixed(1) : '0.0'}
                            </Text>
                        </View>
                    </View>

                    <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#FFFFFF' : '#111827', marginBottom: 2, letterSpacing: 0.1 }}>
                        {item.itemName}
                    </Text>

                    <Text numberOfLines={2} style={{ fontSize: 11, fontWeight: '400', color: isDark ? '#9CA3AF' : '#6B7280', lineHeight: 14, marginBottom: 6, height: 28 }}>
                        {item.itemDescription || 'No description available'}
                    </Text>
                </View>

                <View style={{ marginBottom: 4 }}>
                    {showSavings && (
                        <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#10B981' : '#059669', marginBottom: -2 }}>
                            Save ₹{savings}
                        </Text>
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                            <Text style={{ fontSize: 16, fontWeight: '800', color: isDark ? '#FFFFFF' : '#111827' }}>₹{lowerPrice}</Text>
                            {showSavings && (
                                <Text style={{ fontSize: 11, color: '#9CA3AF', textDecorationLine: 'line-through', marginLeft: 5, fontWeight: '500' }}>
                                    ₹{p1 > p2 ? p1 : p2}
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => onAddToCart(item)}
                            style={{
                                width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
                                backgroundColor: isInCart ? (isDark ? '#374151' : '#9CA3AF') : accentColor, elevation: 2,
                            }}
                        >
                            <Icon name={isInCart ? "checkmark" : "cart-outline"} size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}, (prev, next) => {
    return (
        prev.item._id === next.item._id &&
        prev.isInCart === next.isInCart &&
        prev.isInWishlist === next.isInWishlist &&
        prev.isDark === next.isDark &&
        prev.accentColor === next.accentColor
    );
});

// Exported for HomePage Virtualization
export const FeedRow = memo(({ items, isDark, accentColor, handlePress, handleAddToCart, checkIsInCart, handleToggleWishlist, checkIsInWishlist }: any) => {

    // Stable renderItem
    const renderItem = useCallback(({ item }: { item: ItemFeedItem }) => (
        <ItemCard
            item={item}
            isDark={isDark}
            accentColor={accentColor}
            onPress={handlePress}
            onAddToCart={handleAddToCart}
            isInCart={checkIsInCart(item._id)}
            onToggleWishlist={handleToggleWishlist}
            isInWishlist={checkIsInWishlist(item._id)}
        />
    ), [isDark, accentColor, handlePress, handleAddToCart, checkIsInCart, handleToggleWishlist, checkIsInWishlist]);

    // Constant Item Layout
    const getItemLayout = useCallback((_: any, index: number) => ({
        length: CARD_WIDTH + GAP,
        offset: (CARD_WIDTH + GAP) * index,
        index,
    }), []);

    return (
        <View
            style={{

                backgroundColor: isDark ? '#2A2D35' : '#F3F4F6',
            }}
        >
            <FlatList
                horizontal
                data={items}
                keyExtractor={(item) => item._id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: PADDING_H, paddingVertical: 10 }}
                renderItem={renderItem}
                getItemLayout={getItemLayout}
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                windowSize={3}
                removeClippedSubviews={Platform.OS === 'android'}
                snapToInterval={CARD_WIDTH + GAP}
                decelerationRate="fast"
            />
        </View>
    );
});

export const FeedHeader = memo(({ isDark, accentColor, navigation }: any) => (
    <View
        style={{
            backgroundColor: isDark ? '#2A2D35' : '#F3F4F6',
            paddingVertical: 0,
            marginTop: -10,
        }}
    >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 16, marginBottom: 8, paddingTop: 8 }}>
            <View>
                <Text style={{ fontSize: 20, fontWeight: '700', color: isDark ? '#FFFFFF' : '#111827', letterSpacing: -0.5 }}>Shop Now</Text>
                <Text style={{ fontSize: 12, color: isDark ? '#9CA3AF' : '#6B7280', fontWeight: '500', marginTop: 2 }}>Curated just for you</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('AllProducts', { type: 'feed' })}>
                <Text style={{ color: isDark ? '#FFFFFF' : '#000', fontSize: 13, fontWeight: '600', textTransform: 'capitalize' }}>View All</Text>
            </TouchableOpacity>
        </View>
    </View>
));

export const FeedSkeleton = memo(({ isDark, opacity }: any) => (
    <View style={{ paddingBottom: 16, backgroundColor: isDark ? '#2A2D35' : '#F3F4F6' }}>
        {[1, 2, 3].map((row) => (
            <View key={`skel-row-${row}`} style={{ marginBottom: 12 }}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: PADDING_H }}
                    data={[1, 2, 3, 4]}
                    keyExtractor={(i, idx) => `skel-${row}-${idx}`}
                    renderItem={() => <FeedSkeletonCard isDark={isDark} opacity={opacity} />}
                />
            </View>
        ))}
    </View>
));

// ----------------------------------------------------------------------------
// MAIN EXPORT
// ----------------------------------------------------------------------------

const ItemFeedSection = () => {
    const navigation = useNavigation<any>();
    const { isDark, accentColor } = useThemePalette();
    const { data: items, isLoading, chunkedItems } = useItemFeed();
    const { addToCart, isInCart } = useCart();
    const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist();

    const opacity = useSkeletonAnimation();

    const handlePress = useCallback((item: ItemFeedItem) => {
        if (item._id) navigation.navigate('ProductDetail', { productId: item._id });
    }, [navigation]);

    const handleToggleWishlist = useCallback((item: ItemFeedItem) => {
        if (isInWishlist(item._id)) {
            removeFromWishlist(item._id);
        } else {
            addToWishlist({
                _id: item._id, itemName: item.itemName || 'Unknown Item', itemDescription: item.itemDescription,
                image: item.image || '', itemFinalPrice: Number(item.itemFinalPrice) || 0,
                itemRatings: item.itemRatings, itemDiscount: item.itemDiscount, itemInitialPrice: Number(item.itemInitialPrice) || 0
            });
        }
    }, [isInWishlist, removeFromWishlist, addToWishlist]);

    const handleAddToCart = useCallback((item: ItemFeedItem) => {
        if (isInCart(item._id)) {
            ToastAndroid.show('Item already in cart', ToastAndroid.SHORT);
            return;
        }
        addToCart({ id: item._id, name: item.itemName, price: Number(item.itemFinalPrice) || 0, quantity: 1 });
        ToastAndroid.show('Item added to cart', ToastAndroid.SHORT);
    }, [isInCart, addToCart]);


    if (isLoading) {
        return (
            <LinearGradient colors={isDark ? ['#2A2D35', '#121212'] : ['#F3F4F6', '#FFFFFF']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
                <View style={{ paddingTop: 8, paddingHorizontal: 16, marginBottom: 8 }}>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: isDark ? '#FFFFFF' : '#111827' }}>Shop Now</Text>
                </View>
                <View style={{ paddingBottom: 16 }}>
                    {[1, 2, 3].map((row) => (
                        <View key={`skel-row-${row}`} style={{ marginBottom: 12 }}>
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingHorizontal: PADDING_H }}
                                data={[1, 2, 3, 4]}
                                keyExtractor={(i, idx) => `skel-${row}-${idx}`}
                                renderItem={() => <FeedSkeletonCard isDark={isDark} opacity={opacity} />}
                            />
                        </View>
                    ))}
                </View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={isDark ? ['#2A2D35', '#121212'] : ['#F3F4F6', '#FFFFFF']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 16, marginBottom: 8, paddingTop: 8 }}>
                <View>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: isDark ? '#FFFFFF' : '#111827', letterSpacing: -0.5 }}>Shop Now</Text>
                    <Text style={{ fontSize: 12, color: isDark ? '#9CA3AF' : '#6B7280', fontWeight: '500', marginTop: 2 }}>Curated just for you</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('AllProducts', { type: 'feed' })}>
                    <Text style={{ color: accentColor, fontSize: 14, fontWeight: '700', textTransform: 'capitalize' }}>View All</Text>
                </TouchableOpacity>
            </View>

            <View style={{ paddingBottom: 16 }}>
                {chunkedItems.map((rowItems, index) => (
                    <FeedRow
                        key={`feed-row-${index}`}
                        items={rowItems}
                        isDark={isDark}
                        accentColor={accentColor}
                        handlePress={handlePress}
                        handleAddToCart={handleAddToCart}
                        checkIsInCart={isInCart}
                        handleToggleWishlist={handleToggleWishlist}
                        checkIsInWishlist={isInWishlist}
                    />
                ))}
            </View>
            <View style={{ height: 16 }} />
        </LinearGradient>
    );
};

export default React.memo(ItemFeedSection);
