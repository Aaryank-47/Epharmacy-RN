import React, { memo, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, Dimensions, Animated, StyleSheet, ToastAndroid, ListRenderItem } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useRecentlyViewedItems } from '../../../hooks/useRecentlyViewed';
import useThemePalette from '../../../hooks/useThemePalette';
import { useCart } from '../../../context/CartContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.46;
const CARD_MARGIN = 12;
const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN;

// ----------------------------------------------------------------------------
// MEMOIZED ITEM COMPONENT
// ----------------------------------------------------------------------------
interface ItemProps {
    item: any;
    isDark: boolean;
    accentColor: string;
    isInCart: boolean;
    onAddToCart: (item: any) => void;
    onPress: (id: string) => void;
}

const RecentlyViewedItem = memo<ItemProps>(({ item, isDark, accentColor, isInCart, onAddToCart, onPress }) => {
    return (
        <TouchableOpacity
            onPress={() => onPress(item._id)}
            activeOpacity={0.9}
            style={[
                styles.card,
                {
                    backgroundColor: isDark ? '#1E2028' : '#FFFFFF',
                    shadowColor: '#000',
                    shadowOpacity: isDark ? 0.3 : 0.04,
                    shadowRadius: 10,
                    elevation: 1.5,
                    borderWidth: isDark ? 1 : 0,
                    borderColor: isDark ? '#2D3038' : 'transparent',
                }
            ]}
        >
            {/* Image Container */}
            <View className="p-3">
                <View
                    style={{ backgroundColor: isDark ? '#2A2D38' : '#F3F4F6' }}
                    className="h-[140px] w-full rounded-[20px] items-center justify-center overflow-hidden"
                >
                    {item.itemImages && item.itemImages[0] ? (
                        <Image
                            source={{ uri: item.itemImages[0] }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    ) : (
                        <Icon name="image-outline" size={32} color={isDark ? '#555' : '#DDD'} />
                    )}

                    {/* Floating 'Add to Cart' Action */}
                    <TouchableOpacity
                        className="absolute bottom-2 right-2 w-8 h-8 rounded-full items-center justify-center shadow-sm"
                        style={{ backgroundColor: isInCart ? (isDark ? '#374151' : '#9CA3AF') : accentColor }}
                        onPress={() => onAddToCart(item)}
                    >
                        <Icon name={isInCart ? "checkmark" : "cart-outline"} size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Info Section */}
            <View className="px-3 pb-4">
                <Text
                    numberOfLines={1}
                    className="text-[10px] uppercase font-bold tracking-wider opacity-60 mb-1"
                    style={{ color: isDark ? '#AAA' : '#888' }}
                >
                    Recently Viewed
                </Text>

                <Text
                    className="text-sm font-bold mb-1 leading-5"
                    numberOfLines={2}
                    style={{ color: isDark ? '#FFF' : '#1A1A1A' }}
                >
                    {item.itemName}
                </Text>

                <Text
                    className="text-xs font-bold mb-1 leading-5"
                    numberOfLines={2}
                    style={{ color: isDark ? '#ffffffd8' : '#1A1A1A' }}
                >
                    {item.itemDescription}
                </Text>
                <View className="flex-row items-center mt-1">
                    {item.itemFinalPrice ? (
                        <Text
                            className="text-base font-extrabold"
                            style={{ color: accentColor }}
                        >
                            ₹{item.itemFinalPrice}
                        </Text>
                    ) : (
                        <Text className="text-sm text-gray-400">Out of Stock</Text>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}, (prev, next) => {
    return (
        prev.item._id === next.item._id &&
        prev.isInCart === next.isInCart &&
        prev.isDark === next.isDark &&
        prev.accentColor === next.accentColor
    );
});

// ----------------------------------------------------------------------------
// SKELETON LOADER (Memoized)
// ----------------------------------------------------------------------------
const RecentlyViewedSkeleton = memo(({ isDark }: { isDark: boolean }) => {
    const opacityValue = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(opacityValue, { toValue: 1, duration: 1000, useNativeDriver: true }),
                Animated.timing(opacityValue, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
            ])
        );
        anim.start();
        return () => anim.stop();
    }, [opacityValue]);

    return (
        <View className="mb-8 mt-2">
            <View className="px-5 mb-4">
                <Animated.View style={{ opacity: opacityValue }} className="h-6 w-40 bg-gray-200 dark:bg-neutral-800 rounded" />
            </View>
            <View className="flex-row px-5">
                {[1, 2, 3].map((i) => (
                    <View
                        key={i}
                        style={{ width: CARD_WIDTH, marginRight: 16 }}
                        className="rounded-[24px] overflow-hidden bg-white dark:bg-[#1E2028] p-3"
                    >
                        <Animated.View style={{ opacity: opacityValue }} className="h-[140px] w-full rounded-[20px] bg-gray-100 dark:bg-[#2A2D38] mb-3" />
                        <Animated.View style={{ opacity: opacityValue }} className="h-3 w-16 bg-gray-100 dark:bg-neutral-800 rounded mb-2" />
                        <Animated.View style={{ opacity: opacityValue }} className="h-4 w-full bg-gray-100 dark:bg-neutral-800 rounded mb-3" />
                        <Animated.View style={{ opacity: opacityValue }} className="h-5 w-20 bg-gray-100 dark:bg-neutral-800 rounded" />
                    </View>
                ))}
            </View>
        </View>
    );
});

interface RecentlyViewedSectionProps {
    transparentBackground?: boolean;
}

// ----------------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------------
const RecentlyViewedSection = ({ transparentBackground = false }: RecentlyViewedSectionProps) => {
    const navigation = useNavigation<any>();
    const { isDark, accentColor } = useThemePalette();
    const { addToCart, isInCart } = useCart();
    const { data: apiResponse, isLoading } = useRecentlyViewedItems();

    const recentlyViewedItems = useMemo(() => apiResponse?.data || [], [apiResponse]);

    const handleAddToCart = useCallback((item: any) => {
        if (isInCart(item._id)) {
            ToastAndroid.show('Item has already been added to the cart', ToastAndroid.SHORT);
            return;
        }

        addToCart({
            id: item._id,
            name: item.itemName,
            price: item.itemFinalPrice || 0,
            quantity: 1,
        });
        ToastAndroid.show('Item has been added to the cart', ToastAndroid.SHORT);
    }, [isInCart, addToCart]);

    const handlePress = useCallback((id: string) => {
        navigation.push('ProductDetail', { productId: id });
    }, [navigation]);

    const renderItem: ListRenderItem<any> = useCallback(({ item }) => (
        <RecentlyViewedItem
            item={item}
            isDark={isDark}
            accentColor={accentColor}
            isInCart={isInCart(item._id)}
            onAddToCart={handleAddToCart}
            onPress={handlePress}
        />
    ), [isDark, accentColor, isInCart, handleAddToCart, handlePress]);

    const getItemLayout = useCallback((_: any, index: number) => ({
        length: SNAP_INTERVAL,
        offset: SNAP_INTERVAL * index,
        index,
    }), []);

    if (isLoading) {
        return <RecentlyViewedSkeleton isDark={isDark} />;
    }

    if (recentlyViewedItems.length === 0) {
        return null;
    }

    const Header = () => (
        <View className="px-4 mb-2 flex-row items-center justify-between">
            <Text
                className="text-xl font-bold tracking-tight"
                style={{ color: isDark ? '#FFF' : '#1A1A1A' }}
            >
                Pick up where you left off
            </Text>
        </View>
    );

    const Carousel = () => (
        <FlatList
            data={recentlyViewedItems}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            snapToInterval={SNAP_INTERVAL}
            decelerationRate="fast"
            removeClippedSubviews={true}
            initialNumToRender={3}
            maxToRenderPerBatch={3}
            windowSize={5}
            getItemLayout={getItemLayout}
        />
    );

    if (transparentBackground) {
        return (
            <View className="mb-0 py-0">
                <Header />
                <Carousel />
            </View>
        );
    }

    return (
        <LinearGradient
            colors={isDark ? ['#2A2D35', '#121212'] : ['#F3F4F6', '#F3F4F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            className="mb-0 py-4"
        >
            <Header />
            <Carousel />
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        marginRight: CARD_MARGIN,
        borderRadius: 24,
        borderWidth: 1,
        shadowOffset: { width: 0, height: 8 },
    },
    listContent: {
        paddingHorizontal: 9,
        paddingBottom: 10,
        paddingTop: 10
    }
});

export default  React.memo( RecentlyViewedSection);
