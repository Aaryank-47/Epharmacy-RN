import React, { memo, useRef, useEffect, useMemo } from 'react';
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
import { ItemFeedItem } from '../../../api/types';

const { width: screenWidth } = Dimensions.get('window');

// ----------------------------------------------------------------------------
// LAYOUT CONFIGURATION
// ----------------------------------------------------------------------------
const PADDING_H = 12;
const GAP = 12;
const CARD_WIDTH = (screenWidth - (PADDING_H * 2) - GAP) / 2;
const CARD_HEIGHT = 290;

// ============================================================================
// DYNAMIC PULSING SKELETON
// ============================================================================

const SkeletonBlock = memo(({ width, height, borderRadius, style, isDark }: any) => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View
            style={[{
                opacity,
                width: width || '100%',
                height: height || 20,
                backgroundColor: isDark ? '#2A2D35' : '#E5E7EB',
                borderRadius: borderRadius || 4
            }, style]}
        />
    );
});

const FeedSkeletonCard = memo(({ isDark }: { isDark: boolean }) => (
    <View
        style={{
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            marginRight: GAP,
            borderRadius: 16,
            overflow: 'hidden',
            backgroundColor: isDark ? '#1E2028' : '#FFFFFF',
            borderWidth: 1,
            borderColor: isDark ? '#2D3038' : '#E5E7EB',
        }}
    >
        <SkeletonBlock height={135} width="100%" borderRadius={0} isDark={isDark} />
        <View style={{ padding: 12, justifyContent: 'space-between', flex: 1 }}>
            <View>
                <SkeletonBlock height={12} width="40%" isDark={isDark} style={{ marginBottom: 8 }} />
                <SkeletonBlock height={16} width="90%" isDark={isDark} style={{ marginBottom: 6 }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <SkeletonBlock height={22} width="50%" isDark={isDark} />
                <SkeletonBlock height={32} width={32} borderRadius={16} isDark={isDark} />
            </View>
        </View>
    </View>
));

// ============================================================================
// ITEM CARD (PREMIUM MODERN)
// ============================================================================

interface ItemCardProps {
    item: ItemFeedItem;
    isDark: boolean;
    accentColor: string;
    onPress: () => void;
    onAddToCart: () => void;
    isInCart: boolean;
}

const ItemCard = memo<ItemCardProps>(({ item, isDark, accentColor, onPress, onAddToCart, isInCart }) => {
    // ... logic ...
    const hasDiscount = item.itemDiscount && item.itemDiscount > 0;

    const p1 = Number(item.itemInitialPrice) || 0;
    const p2 = Number(item.itemFinalPrice) || 0;
    const distinct = p1 > 0 && p2 > 0 && p1 !== p2;
    const higherPrice = Math.max(p1, p2);
    const lowerPrice = (p1 > 0 && p2 > 0) ? Math.min(p1, p2) : Math.max(p1, p2);
    const savings = parseFloat((higherPrice - lowerPrice).toFixed(2));
    const showSavings = distinct && savings > 0;

    return (
        <TouchableOpacity
            activeOpacity={0.92}
            onPress={onPress}
            style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                marginRight: 12,
                borderRadius: 16,
                overflow: 'hidden',
                backgroundColor: isDark ? '#1E2028' : '#FFFFFF',
                borderWidth: 1,
                borderColor: isDark ? '#2D3038' : '#E5E7EB',
                ...Platform.select({
                    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
                    android: { elevation: 4 },
                }),
            }}
        >
            {/* IMAGE AREA */}
            <View
                style={{
                    width: '100%',
                    height: 135,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF',
                    position: 'relative',
                    padding: 12,
                }}
            >
                {item.image ? (
                    <Image
                        source={{ uri: item.image }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="contain"
                    />
                ) : (
                    <Icon name="medkit" size={40} color={isDark ? '#4B5563' : '#E5E7EB'} />
                )}

                {/* Discount Pill */}
                {hasDiscount && (
                    <View style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        backgroundColor: '#3ab45aff',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                        zIndex: 10,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 2,
                    }}>
                        <Text style={{
                            color: '#FFFFFF',
                            fontSize: 9,
                            fontWeight: '800',
                            letterSpacing: 0.5,
                        }}>
                            {item.itemDiscount}% OFF
                        </Text>
                    </View>
                )}

                {/* Wishlist Heart */}
                <TouchableOpacity
                    activeOpacity={0.7}
                    style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        width: 30,
                        height: 30,
                        borderRadius: 15,
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        backgroundColor: isDark ? 'rgba(30, 32, 40, 0.6)' : 'rgba(255, 255, 255, 0.9)',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 2,
                    }}
                >
                    <Icon name="heart-outline" size={16} color={isDark ? '#FFFFFF' : '#EF4444'} />
                </TouchableOpacity>
            </View>

            {/* INFO AREA */}
            <View style={{
                paddingHorizontal: 10,
                paddingTop: 10,
                paddingBottom: 10,
                flex: 1,
                flexDirection: 'column',
                justifyContent: 'space-between'
            }}>
                <View>
                    {/* Code & Rating Row */}
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 4
                    }}>
                        <Text
                            style={{
                                fontSize: 10,
                                fontWeight: '700',
                                color: isDark ? '#9CA3AF' : '#9CA3AF',
                                textTransform: 'uppercase',
                                letterSpacing: 1.5
                            }}
                            numberOfLines={1}
                        >
                            {item.code || 'PRODUCT'}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Icon name="star" size={12} color="#FBBF24" />
                            <Text style={{
                                marginLeft: 4,
                                fontSize: 11,
                                fontWeight: '700',
                                color: isDark ? '#9CA3AF' : '#4B5563'
                            }}>
                                {item.itemRatings ? item.itemRatings.toFixed(1) : '0.0'}
                            </Text>
                        </View>
                    </View>

                    {/* Title */}
                    <Text
                        numberOfLines={2}
                        style={{
                            fontSize: 14,
                            fontWeight: '700',
                            color: isDark ? '#FFFFFF' : '#111827',
                            lineHeight: 18,
                            marginBottom: 3,
                            letterSpacing: 0.1
                        }}
                    >
                        {item.itemName}
                    </Text>
                </View>

                {/* Price Section */}
                <View>
                    {showSavings && (
                        <Text style={{
                            fontSize: 11,
                            fontWeight: '700',
                            color: isDark ? '#10B981' : '#059669',
                            marginBottom: 3,
                            marginLeft: 0
                        }}>
                            Save ₹{savings}
                        </Text>
                    )}

                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between'
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                            <Text style={{
                                fontSize: 17,
                                fontWeight: '800',
                                color: isDark ? '#FFFFFF' : '#111827'
                            }}>
                                ₹{lowerPrice}
                            </Text>
                            {showSavings && (
                                <Text style={{
                                    fontSize: 11,
                                    color: '#9CA3AF',
                                    textDecorationLine: 'line-through',
                                    marginLeft: 5,
                                    fontWeight: '500'
                                }}>
                                    ₹{higherPrice}
                                </Text>
                            )}
                        </View>

                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={onAddToCart}
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: isInCart ? (isDark ? '#374151' : '#9CA3AF') : accentColor,
                                shadowColor: isInCart ? 'transparent' : '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 2,
                                elevation: 2,
                            }}
                        >
                            <Icon name={isInCart ? "checkmark" : "add"} size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
});

// ============================================================================
// ROW CONTAINER
// ============================================================================

const HorizontalRow = memo(({ items, isDark, accentColor, handlePress, handleAddToCart, checkIsInCart }: { items: ItemFeedItem[], isDark: boolean, accentColor: string, handlePress: (item: ItemFeedItem) => void, handleAddToCart: (item: ItemFeedItem) => void, checkIsInCart: (id: string) => boolean }) => {
    return (
        <View style={{ marginBottom: 12 }}>
            <FlatList
                horizontal
                data={items}
                keyExtractor={(item) => item._id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: PADDING_H, paddingVertical: 10 }}
                renderItem={({ item }) => (
                    <ItemCard
                        item={item}
                        isDark={isDark}
                        accentColor={accentColor}
                        onPress={() => handlePress(item)}
                        onAddToCart={() => handleAddToCart(item)}
                        isInCart={checkIsInCart(item._id)}
                    />
                )}
                snapToInterval={CARD_WIDTH + GAP}
                decelerationRate="fast"
            />
        </View>
    );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

import { useCart } from '../../../context/CartContext';

const ItemFeedSection = () => {
    const navigation = useNavigation<any>();
    const { isDark, accentColor } = useThemePalette();
    const { data: items, isLoading } = useItemFeed();
    const { addToCart, isInCart } = useCart();

    const handlePress = async (item: ItemFeedItem) => {
        if (item._id) {
            navigation.navigate('ProductDetail', { productId: item._id });
        }
    };

    const handleAddToCart = (item: ItemFeedItem) => {
        if (isInCart(item._id)) {
            ToastAndroid.show('Item has already been added to the cart', ToastAndroid.SHORT);
            return;
        }

        addToCart({
            id: item._id,
            name: item.itemName,
            price: Number(item.itemFinalPrice) || 0,
            quantity: 1,
        });
        ToastAndroid.show('Item has been added to the cart', ToastAndroid.SHORT);
    };

    const chunkedItems = useMemo(() => {
        if (!items || items.length === 0) return [];
        const chunkSize = 4;
        const chunks = [];
        for (let i = 0; i < items.length; i += chunkSize) {
            chunks.push(items.slice(i, i + chunkSize));
        }
        return chunks;
    }, [items]);

    const skeletonRows = [1, 2, 3];

    return (
        <LinearGradient
            colors={isDark ? ['#2A2D35', '#121212'] : ['#F3F4F6', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                paddingHorizontal: 16,
                marginBottom: 8,
                paddingTop: 8
            }}>
                <View>
                    <Text
                        style={{
                            fontSize: 20,
                            fontWeight: '700',
                            color: isDark ? '#FFFFFF' : '#111827',
                            letterSpacing: -0.5
                        }}
                    >
                        Shop Now
                    </Text>
                    <Text style={{
                        fontSize: 12,
                        color: isDark ? '#9CA3AF' : '#6B7280',
                        fontWeight: '500',
                        marginTop: 2
                    }}>
                        Curated just for you
                    </Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('AllProducts', { type: 'feed' })}>
                    <Text style={{
                        color: accentColor,
                        fontSize: 14,
                        fontWeight: '700',
                        textTransform: 'capitalize'
                    }}>
                        View All
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={{ paddingBottom: 16 }}>
                {isLoading ? (
                    skeletonRows.map((row) => (
                        <View key={`skel-row-${row}`} style={{ marginBottom: 12 }}>
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingHorizontal: PADDING_H }}
                                data={[1, 2, 3, 4]}
                                keyExtractor={(i, index) => `skel-item-${row}-${index}`}
                                renderItem={() => (
                                    <FeedSkeletonCard isDark={isDark} />
                                )}
                            />
                        </View>
                    ))
                ) : (
                    chunkedItems.map((rowItems, index) => (
                        <HorizontalRow
                            key={`feed-row-${index}`}
                            items={rowItems}
                            isDark={isDark}
                            accentColor={accentColor}
                            handlePress={handlePress}
                            handleAddToCart={handleAddToCart}
                            checkIsInCart={isInCart}
                        />
                    ))
                )}
            </View>

            <View style={{ height: 16 }} />
        </LinearGradient>
    );
};

export default ItemFeedSection;
