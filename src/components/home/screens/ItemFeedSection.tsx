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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

import { useItemFeed } from '../../../hooks/useItemFeed';
import { useThemePalette } from '../../../hooks/useThemePalette';
import { addItemToRecentlyViewed } from '../../../api/medicinesApi';
import { ItemFeedItem } from '../../../api/types';

const { width: screenWidth } = Dimensions.get('window');

// ----------------------------------------------------------------------------
// LAYOUT CONFIGURATION
// ----------------------------------------------------------------------------
const PADDING_H = 12;
const GAP = 12;
const CARD_WIDTH = (screenWidth - (PADDING_H * 2) - GAP) / 2;
const CARD_HEIGHT = 265;

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
        style={{ width: CARD_WIDTH, height: CARD_HEIGHT, marginRight: GAP }}
        className={`rounded-2xl overflow-hidden ${isDark ? 'bg-[#1E2028]' : 'bg-white'}`}
    >
        <SkeletonBlock height={145} width="100%" borderRadius={0} isDark={isDark} />
        <View className="p-3 justify-between flex-1">
            <View>
                <SkeletonBlock height={12} width="40%" isDark={isDark} style={{ marginBottom: 8 }} />
                <SkeletonBlock height={16} width="90%" isDark={isDark} style={{ marginBottom: 6 }} />
            </View>
            <View className="flex-row justify-between items-center">
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
}

const ItemCard = memo<ItemCardProps>(({ item, isDark, accentColor, onPress }) => {
    const hasDiscount = item.itemDiscount && item.itemDiscount > 0;

    // "Force Sale" Logic: Treat higher price as original/strikethrough
    const p1 = Number(item.itemInitialPrice) || 0;
    const p2 = Number(item.itemFinalPrice) || 0;

    // Find distinct prices
    const distinct = p1 > 0 && p2 > 0 && p1 !== p2;

    // Always set higher as Strikethrough, Lower as Main
    const higherPrice = Math.max(p1, p2);
    const lowerPrice = (p1 > 0 && p2 > 0) ? Math.min(p1, p2) : Math.max(p1, p2);

    // Limit to max 2 decimals (e.g., 5.00 -> 5, 5.555 -> 5.56)
    const savings = parseFloat((higherPrice - lowerPrice).toFixed(2));
    const showSavings = distinct && savings > 0;

    return (
        <TouchableOpacity
            activeOpacity={0.92}
            onPress={onPress}
            className={`mr-3 rounded-2xl overflow-hidden ${isDark ? 'bg-[#1E2028] border border-[#2D3038]' : 'bg-white'
                }`}
            style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                ...Platform.select({
                    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
                    android: { elevation: 4 },
                }),
            }}
        >
            {/* IMAGE AREA */}
            <View
                className="w-full justify-center items-center bg-white relative p-3"
                style={{ height: 145 }}
            >
                {item.image ? (
                    <Image source={{ uri: item.image }} className="w-full h-full" resizeMode="contain" />
                ) : (
                    <Icon name="medkit" size={40} color={isDark ? '#4B5563' : '#E5E7EB'} />
                )}

                {/* Discount Pill */}
                {hasDiscount && (
                    <View className="absolute top-2.5 left-2.5 bg-[#3ab45aff] px-2 py-1 rounded-lg z-10 shadow-sm">
                        <Text className="text-white text-[9px] font-extrabold tracking-wide">
                            {item.itemDiscount}% OFF
                        </Text>
                    </View>
                )}

                {/* Wishlist Heart */}
                <TouchableOpacity
                    activeOpacity={0.7}
                    className={`absolute top-2.5 right-2.5 w-[30px] h-[30px] rounded-full items-center justify-center z-10 ${isDark ? 'bg-[#1E2028]/60' : 'bg-white/90'
                        } shadow-sm`}
                >
                    <Icon name="heart-outline" size={16} color={isDark ? '#FFFFFF' : '#EF4444'} />
                </TouchableOpacity>
            </View>

            {/* INFO AREA */}
            <View className="px-3 pt-3 pb-3 flex-1 flex-col justify-between">
                <View>
                    {/* Code & Rating Row */}
                    <View className="flex-row items-center justify-between mb-1">
                        <Text
                            className="text-[10px] font-bold text-gray-400 uppercase tracking-widest"
                            numberOfLines={1}
                        >
                            {item.code || 'PRODUCT'}
                        </Text>
                        <View className="flex-row items-center">
                            <Icon name="star" size={12} color="#FBBF24" />
                            <Text className="ml-1 text-[11px] font-bold text-gray-600 dark:text-gray-400">
                                {item.itemRatings ? item.itemRatings.toFixed(1) : '0.0'}
                            </Text>
                        </View>
                    </View>

                    {/* Title */}
                    <Text
                        className="text-[15px] font-bold text-gray-900 dark:text-white leading-5 mb-1"
                        numberOfLines={2}
                        style={{ letterSpacing: 0.1 }}
                    >
                        {item.itemName}
                    </Text>
                </View>

                {/* Price Section */}
                <View>
                    {/* Savings Text (ABOVE PRICE) */}
                    {showSavings && (
                        <Text className="text-[12px] font-bold text-green-600 mb-0 ml-0.5">
                            Save ₹{savings}
                        </Text>
                    )}

                    <View className="flex-row items-end justify-between">
                        <View className="flex-row items-baseline">
                            <Text className="text-[18px] font-extrabold text-gray-900 dark:text-white">
                                ₹{lowerPrice}
                            </Text>
                            {showSavings && (
                                <Text className="text-[11px] text-gray-400 line-through ml-1.5 font-medium">
                                    ₹{higherPrice}
                                </Text>
                            )}
                        </View>

                        <TouchableOpacity
                            activeOpacity={0.85}
                            className="w-9 h-9 rounded-full items-center justify-center shadow-sm"
                            style={{ backgroundColor: accentColor }}
                        >
                            <Icon name="bag-add-outline" size={20} color="#FFFFFF" />
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

const HorizontalRow = memo(({ items, isDark, accentColor, handlePress }: { items: ItemFeedItem[], isDark: boolean, accentColor: string, handlePress: (item: ItemFeedItem) => void }) => {
    return (
        <View className="mb-3">
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

const ItemFeedSection = () => {
    const navigation = useNavigation<any>();
    const { isDark, accentColor } = useThemePalette();
    const { data: items, isLoading } = useItemFeed();

    const handlePress = async (item: ItemFeedItem) => {
        if (item._id) {
            navigation.navigate('ProductDetail', { productId: item._id });
        }
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
            <View className="flex-row justify-between items-end px-4 mb-2 pt-2">
                <View>
                    <Text
                        className="text-xl font-bold text-gray-900 dark:text-white"
                        style={{ letterSpacing: -0.5 }}
                    >
                        Shop Now
                    </Text>
                    <Text className="text-xs text-gray-500 font-medium mt-0.5">
                        Curated just for you
                    </Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('AllProducts', { type: 'feed' })}>
                    <Text style={{ color: accentColor }} className="text-sm font-bold capitalize">
                        View All
                    </Text>
                </TouchableOpacity>
            </View>

            <View className="pb-4">
                {isLoading ? (
                    skeletonRows.map((row) => (
                        <View key={`skel-row-${row}`} className="mb-3">
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
                        />
                    ))
                )}
            </View>

            <View className="h-4" />
        </LinearGradient>
    );
};

export default ItemFeedSection;
