import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    FlatList,
    TouchableOpacity,
    Image,
    Dimensions,
    ToastAndroid,
    Platform,
    Animated,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useThemePalette } from '../../hooks/useThemePalette';
import { getItemsByCategory } from '../../api/medicinesApi';
import type { Medicine, SearchFilters } from '../../api/types';
import { SearchHeader } from '../commonPage/search/SearchComponents';
import FilterModal from '../commonPage/search/FilterModal';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import Tabs from '../commonPage/Tab';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

const CategoryProductsScreen: React.FC = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { categoryId, categoryName } = route.params || {};
    const { isDark, textColor, accentColor, placeholderColor } = useThemePalette();

    const { addToCart, isInCart } = useCart();
    const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist();

    const [products, setProducts] = useState<Medicine[]>([]);

    // --- Tab Bar Animation ---
    const translateY = useRef(new Animated.Value(0)).current;
    const scrollY = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef<FlatList>(null);

    const handleScrollToTop = useCallback(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, []);

    // --- Tab Bar Hiding Logic ---
    const lastScrollY = useRef(0);
    const isTabBarHidden = useRef(false);
    const TAB_BAR_HIDDEN_OFFSET = 100;

    const handleScrollRaw = useCallback((event: any) => {
        const currentY = event.nativeEvent.contentOffset.y;
        const dy = currentY - lastScrollY.current;

        // Detect if close to bottom
        const layoutHeight = event.nativeEvent.layoutMeasurement.height;
        const contentHeight = event.nativeEvent.contentSize.height;
        const isCloseToBottom = layoutHeight + currentY >= contentHeight - 20;

        if (isCloseToBottom) {
            if (isTabBarHidden.current) {
                isTabBarHidden.current = false;
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }).start();
            }
        } else if (currentY > 50) {
            if (dy > 10 && !isTabBarHidden.current) {
                isTabBarHidden.current = true;
                Animated.timing(translateY, {
                    toValue: TAB_BAR_HIDDEN_OFFSET,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            } else if (dy < -5 && isTabBarHidden.current) {
                isTabBarHidden.current = false;
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }).start();
            }
        } else if (currentY <= 50 && isTabBarHidden.current) {
            isTabBarHidden.current = false;
            Animated.timing(translateY, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
        lastScrollY.current = currentY;
    }, [translateY]);

    const onScrollEvent = useMemo(() => Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        {
            useNativeDriver: true,
            listener: handleScrollRaw,
        }
    ), [scrollY, handleScrollRaw]);

    const handleToggleWishlist = useCallback((item: Medicine) => {
        if (isInWishlist(item._id)) {
            removeFromWishlist(item._id);
        } else {
            addToWishlist({
                _id: item._id,
                itemName: item.itemName || '',
                itemDescription: item.itemDescription || '',
                image: (Array.isArray(item.itemImages) ? item.itemImages[0] : item.image) || '',
                itemFinalPrice: Math.round(item.itemInitialPrice ? (item.itemInitialPrice - (item.itemInitialPrice * (item.discount || 0) / 100)) : 0),
                itemRatings: item.itemRatings || 0,
                itemDiscount: item.discount || 0,
                itemInitialPrice: item.itemInitialPrice || 0
            });
        }
    }, [isInWishlist, removeFromWishlist, addToWishlist]);

    const handleAddToCart = useCallback((item: Medicine) => {
        if (isInCart(item._id)) {
            ToastAndroid.show('Item has already been added to the cart', ToastAndroid.SHORT);
            return;
        }

        const price = item.discount ? (item.itemInitialPrice || 0) - ((item.itemInitialPrice || 0) * item.discount / 100) : (item.itemInitialPrice || 0);

        addToCart({
            id: item._id,
            name: item.itemName || '',
            price: Math.round(price),
            quantity: 1,
        });
        ToastAndroid.show('Item has been added to the cart', ToastAndroid.SHORT);
    }, [isInCart, addToCart]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [filters, setFilters] = useState<SearchFilters>({});
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
    const limit = 14;

    const fetchProducts = useCallback(async (pageNum: number) => {
        if (!categoryId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await getItemsByCategory(categoryId, pageNum, limit, filters);
            const newItems = response.data?.result || [];

            setProducts(newItems);

            if (newItems.length < limit) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }
        } catch (err: any) {
            console.error("Failed to fetch category products", err);
            if (err.response && err.response.status === 404) {
                setProducts([]);
                setHasMore(false);
            } else {
                setError("Failed to load products");
            }
        } finally {
            setLoading(false);
        }
    }, [categoryId, filters, limit]);

    useEffect(() => {
        setPage(1);
        setHasMore(true);
        fetchProducts(1);
    }, [categoryId, filters, fetchProducts]);

    const handleApplyFilters = (newFilters: SearchFilters) => {
        setFilters(newFilters);
        // useEffect will trigger fetch
    };

    const handleNextPage = () => {
        if (!hasMore || loading) return;
        const nextPage = page + 1;
        setPage(nextPage);
        fetchProducts(nextPage);
    };

    const handlePrevPage = () => {
        if (page <= 1 || loading) return;
        const prevPage = page - 1;
        setPage(prevPage);
        setHasMore(true);
        fetchProducts(prevPage);
    };

    const handleProductPress = (item: Medicine) => {
        navigation.navigate('ProductDetail', { productId: item._id });
    };

    const renderProductItem = ({ item }: { item: Medicine }) => {
        const discount = item.discount || 0;
        const hasDiscount = discount > 0;
        const initialPrice = item.itemInitialPrice || 0;
        const price = hasDiscount ? initialPrice - (initialPrice * discount / 100) : initialPrice;

        const imageUri = Array.isArray(item.itemImages) && item.itemImages[0]
            ? item.itemImages[0]
            : (typeof item.image === 'string' ? item.image : null);

        const itemInCart = isInCart(item._id);
        const itemInWishlist = isInWishlist(item._id);

        return (
            <TouchableOpacity
                className="rounded-xl overflow-hidden mb-4"
                style={{
                    width: CARD_WIDTH,
                    backgroundColor: isDark ? '#1E2028' : '#FFFFFF',
                    borderWidth: 0.5,
                    borderColor: isDark ? '#2D3038' : '#E5E7EB',
                    ...Platform.select({
                        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
                        android: { elevation: 3 },
                    }),
                }}
                onPress={() => handleProductPress(item)}
                activeOpacity={0.9}
            >
                {/* Image Section */}
                <View
                    className="h-40 relative"
                    style={{
                        backgroundColor: isDark ? '#2A2D38' : '#f3f4f6',
                    }}
                >
                    {imageUri ? (
                        <Image
                            source={{ uri: imageUri }}
                            className="w-full h-full"
                            style={{ borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="w-full h-full justify-center items-center">
                            <Icon name="image-outline" size={32} color={placeholderColor} />
                        </View>
                    )}

                    {/* Discount Badge */}
                    {hasDiscount && (
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
                                elevation: 3,
                            }}
                        >
                            <Text className="text-white text-[10px] font-bold">
                                {`${discount}% OFF`}
                            </Text>
                        </LinearGradient>
                    )}

                    {/* Wishlist Icon */}
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={(e) => {
                            e?.stopPropagation?.();
                            handleToggleWishlist(item);
                        }}
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
                            elevation: 3,
                        }}
                    >
                        <Icon name={itemInWishlist ? "heart" : "heart-outline"} size={18} color="#EF4444" />
                    </TouchableOpacity>

                    {/* Rating Badge */}
                    <View className="absolute bottom-2 left-2 bg-white/90 flex-row items-center px-1.5 py-0.5 rounded">
                        <Text className="text-[10px] font-bold text-black">{item.itemRatings || '4.0'}</Text>
                        <Icon name="star" size={10} color="#047857" style={{ marginLeft: 2 }} />
                    </View>
                </View>

                {/* Content Section */}
                <View className="p-2.5">
                    {/* Brand / Name */}
                    <Text
                        className={`text-sm font-bold mb-0.5 ${isDark ? 'text-white' : 'text-black'}`}
                        numberOfLines={1}
                        style={{ letterSpacing: -0.2 }}
                    >
                        {item.itemName?.split(' ')[0] || 'Brand'}
                    </Text>
                    <Text
                        className={`text-[10px] mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                        numberOfLines={1}
                    >
                        {item.itemName}
                    </Text>

                    {/* Price & Add Row */}
                    <View className="flex-row items-end justify-between mt-auto">
                        <View style={{ flex: 1 }}>
                            <View className="flex-row items-baseline mb-0">
                                {hasDiscount && (
                                    <Text className="text-[10px] line-through text-gray-400 mr-1">₹{item.itemInitialPrice}</Text>
                                )}
                                <Text className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-black'}`}>
                                    ₹{Math.round(price)}
                                </Text>
                            </View>
                            {hasDiscount && (
                                <Text style={{ fontSize: 9, color: '#16A34A', fontWeight: '700' }}>
                                    Save ₹{Math.round(item.itemInitialPrice - price)}
                                </Text>
                            )}
                        </View>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => handleAddToCart(item)}
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: 17,
                                backgroundColor: itemInCart ? (isDark ? '#374151' : '#9CA3AF') : accentColor,
                                justifyContent: 'center',
                                alignItems: 'center',
                                elevation: 3,
                            }}
                        >
                            <Icon name={itemInCart ? "checkmark" : "cart-outline"} size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const gradientColors = isDark ? ['#060606ff', '#272a31ff'] : ['#FFFFFF', '#F3F4F6'];

    const renderPagination = () => {
        if (products.length === 0 && !loading) return null;

        return (
            <View className="flex-row justify-center items-center py-6 gap-x-6">
                <TouchableOpacity
                    onPress={handlePrevPage}
                    disabled={page <= 1 || loading}
                    style={{ opacity: page <= 1 || loading ? 0.3 : 1 }}
                    className="flex-row items-center bg-gray-200 dark:bg-gray-800 px-4 py-2 rounded-lg"
                >
                    <Icon name="chevron-back" size={18} color={isDark ? '#FFF' : '#000'} />
                    <Text className="ml-1 font-semibold" style={{ color: isDark ? '#FFF' : '#000' }}>Prev</Text>
                </TouchableOpacity>

                <Text className="font-bold text-lg" style={{ color: textColor }}>
                    {page}
                </Text>

                <TouchableOpacity
                    onPress={handleNextPage}
                    disabled={!hasMore || loading}
                    style={{ opacity: !hasMore || loading ? 0.3 : 1 }}
                    className="flex-row items-center bg-gray-200 dark:bg-gray-800 px-4 py-2 rounded-lg"
                >
                    <Text className="mr-1 font-semibold" style={{ color: isDark ? '#FFF' : '#000' }}>Next</Text>
                    <Icon name="chevron-forward" size={18} color={isDark ? '#FFF' : '#000'} />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <Tabs
            translateY={translateY}
            onNavigate={(screen) => navigation.navigate(screen)}
            currentActiveTab="Home"
            scrollY={scrollY}
            onScrollToTop={handleScrollToTop}
        >
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ flex: 1 }}
            >
                {/* Header */}
                <SearchHeader
                    editable={false}
                    onSearchPress={() => navigation.navigate('Search')}
                    onBackPress={() => navigation.goBack()}
                    showCamera={true}
                    isDark={isDark}
                    textColor={textColor}
                    placeholderColor={placeholderColor}
                    onFilterPress={() => setIsFilterModalVisible(true)}
                />
                <View className="px-4 py-2 border-b" style={{ borderBottomColor: isDark ? '#2D3038' : '#E5E7EB' }}>
                    <Text className="text-xl font-bold capitalize" style={{ color: textColor }}>
                        {categoryName || 'Products'}
                    </Text>
                </View>

                {/* Content */}
                {loading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color={accentColor} />
                    </View>
                ) : error ? (
                    <View className="flex-1 justify-center items-center">
                        <Text style={{ color: placeholderColor }}>{error}</Text>
                        <TouchableOpacity
                            className="mt-4 px-4 py-2 bg-blue-500 rounded-lg"
                            onPress={() => fetchProducts(page)}
                        >
                            <Text className="text-white">Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <Animated.FlatList
                        ref={flatListRef as any}
                        data={products}
                        keyExtractor={(item, index) => item._id || index.toString()}
                        renderItem={renderProductItem}
                        numColumns={2}
                        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        ListFooterComponent={renderPagination}
                        onScroll={onScrollEvent}
                        scrollEventThrottle={16}
                        ListEmptyComponent={
                            <View className="flex-1 justify-center items-center mt-20">
                                <Icon name="cube-outline" size={48} color={placeholderColor} />
                                <Text className="text-gray-500 mt-2">No products found for this category</Text>
                            </View>
                        }
                    />
                )}

                <FilterModal
                    visible={isFilterModalVisible}
                    onClose={() => setIsFilterModalVisible(false)}
                    onApply={handleApplyFilters}
                    initialFilters={filters}
                />
            </LinearGradient>
        </Tabs>
    );
};


export default CategoryProductsScreen;
