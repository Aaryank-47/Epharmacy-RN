import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    FlatList,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    ToastAndroid,
    Animated,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useThemePalette } from '../../hooks/useThemePalette';
import { getItemsByCategory } from '../../api/medicinesApi';
import type { Medicine, SearchFilters } from '../../api/types';
import SearchHeader from '../commonPage/search/SearchHeader';
import FilterModal from '../commonPage/search/FilterModal';
import TopStores from '../commonPage/TopStores';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import ScrollToTopButton from '../commonPage/ScrollToTopButton';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 36) / 2; // 2 columns with padding

const CategoryProductsScreen: React.FC = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { categoryId } = route.params || {};
    const { isDark, textColor, accentColor, placeholderColor } = useThemePalette();
    const { addToCart, isInCart } = useCart();
    const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist();

    const [products, setProducts] = useState<Medicine[]>([]);
    const [showStores, setShowStores] = useState(true); // Default ON
    const flatListRef = useRef<FlatList>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<SearchFilters>({});
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
    const limit = 100;

    const handleScrollToTop = useCallback(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, []);

    const activeFilterCount = React.useMemo(() => {
        let count = 0;
        if (filters.minPrice !== undefined) count++;
        if (filters.maxPrice !== undefined) count++;
        if (filters.minRating !== undefined) count++;
        if (filters.minDiscount !== undefined) count++;
        if (filters.isTrending) count++;
        return count;
    }, [filters]);

    // --- Smooth Scroll Animations with Animated.event ---
    const scrollY = useRef(new Animated.Value(0)).current;
    const contentPaddingTop = useRef(new Animated.Value(220)).current; // Animated padding

    // TopStores interpolation - gradually hides from 30px to 110px scroll
    const storesAnimatedY = scrollY.interpolate({
        inputRange: [0, 30, 180],
        outputRange: [0, 0, -200],
        extrapolate: 'clamp',
    });

    // Filter interpolation - gradually hides from 100px to 160px scroll
    const filterAnimatedY = scrollY.interpolate({
        inputRange: [0, 100, 160],
        outputRange: [0, 0, -65],
        extrapolate: 'clamp',
    });

    const onScrollEvent = Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        {
            useNativeDriver: true,
        }
    );



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
    const fetchProducts = useCallback(async () => {
        if (!categoryId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await getItemsByCategory(categoryId, 1, limit, filters);
            const newItems = response.data?.result || [];

            setProducts(newItems);
        } catch (err: any) {
            console.error("Failed to fetch category products", err);
            if (err.response && err.response.status === 404) {
                setProducts([]);
            } else {
                setError("Failed to load products");
            }
        } finally {
            setLoading(false);
        }
    }, [categoryId, filters, limit]);

    // Animate padding when showStores changes
    // Animate padding when showStores changes
    useEffect(() => {
        Animated.timing(contentPaddingTop, {
            toValue: showStores ? 220 : 70, // 135px clears the FilterBar (60px + ~71px height)
            duration: 5, // Slower for smoother visual check
            useNativeDriver: false,
        }).start();
    }, [showStores, contentPaddingTop]);

    // Auto-hide stores when filters are active to focus on results
    useEffect(() => {
        if (activeFilterCount > 0) {
            setShowStores(false);
        }
    }, [activeFilterCount]);

    useEffect(() => {
        fetchProducts();
        // Reset scroll when fetching new products (e.g. filter applied)
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, [categoryId, filters, fetchProducts]);

    const handleApplyFilters = (newFilters: SearchFilters) => {
        setFilters(newFilters);
        // useEffect will trigger fetch
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
                }}
                onPress={() => handleProductPress(item)}
                activeOpacity={0.9}
            >
                {/* Image Section */}
                <View className="h-48 rounded-xl bg-gray-100 border border-gray-200 relative dark:bg-gray-800 dark:border-gray-700">
                    {imageUri ? (
                        <Image
                            source={{ uri: imageUri }}
                            className="w-full h-full rounded-xl"
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="w-full h-full justify-center items-center">
                            <Icon name="image-outline" size={32} color={placeholderColor} />
                        </View>
                    )}

                    {/* AD Badge */}
                    <View className="absolute top-2 left-2 bg-white/80 px-1.5 py-0.5 rounded">
                        <Text className="text-[10px] font-bold text-black">AD</Text>
                    </View>

                    {/* Wishlist Button */}
                    <TouchableOpacity
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 justify-center items-center"
                        onPress={() => handleToggleWishlist(item)}
                    >
                        <Icon
                            name={itemInWishlist ? "heart" : "heart-outline"}
                            size={18}
                            color={itemInWishlist ? "#EF4444" : "#4B5563"}
                        />
                    </TouchableOpacity>

                    {/* Rating Badge (Bottom Left of Image) */}
                    <View className="absolute bottom-2 left-2 bg-white/90 flex-row items-center px-1.5 py-0.5 rounded">
                        <Text className="text-[10px] font-bold text-black">{item.itemRatings || '4.0'}</Text>
                        <Icon name="star" size={10} color="#047857" style={{ marginLeft: 2 }} />
                        <View className="w-[1px] h-2 bg-gray-300 mx-1" />
                        <Text className="text-[10px] text-gray-500">{(item as any).views || '10'}k</Text>
                    </View>
                </View>

                {/* Content Section */}
                <View className="p-2">
                    {/* Brand / Name */}
                    <Text
                        className={`text-sm font-bold mb-0.5 ${isDark ? 'text-white' : 'text-black'}`}
                        numberOfLines={1}
                    >
                        {item.itemName?.split(' ')[0] || 'Brand'}
                    </Text>
                    <Text
                        className={`text-xs mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                        numberOfLines={1}
                    >
                        {item.itemName}
                    </Text>

                    {/* Price Row */}
                    <View className="flex-row items-center mb-1">
                        {hasDiscount && (
                            <>
                                <Icon name="arrow-down" size={12} color="#16A34A" />
                                <Text className="text-xs font-bold text-green-600 mr-1">{discount}%</Text>
                                <Text className="text-xs line-through text-gray-400 mr-1.5">₹{initialPrice}</Text>
                            </>
                        )}
                        <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                            ₹{Math.round(price)}
                        </Text>
                    </View>

                    {/* Deal Badge */}
                    {hasDiscount && (
                        <View className="bg-purple-100 px-1.5 py-0.5 self-start rounded mb-1.5 dark:bg-purple-900/40">
                            <Text className="text-[10px] font-bold text-purple-700 dark:text-purple-300">Top Discount of the Sale</Text>
                        </View>
                    )}
                    {/* Delivery Info */}
                    <Text className={`text-[10px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`} numberOfLines={1}>
                        Delivery by <Text className="font-bold">21st Jan</Text>
                    </Text>

                    {/* Add to Cart Button */}
                    <TouchableOpacity
                        className="absolute bottom-2 right-2 rounded-full justify-center items-center"
                        style={{
                            width: 32,
                            height: 32,
                            backgroundColor: itemInCart ? '#10B981' : accentColor,
                        }}
                        onPress={() => handleAddToCart(item)}
                        activeOpacity={0.8}
                    >
                        <Icon
                            name={itemInCart ? "checkmark" : "cart-outline"}
                            size={18}
                            color="#fff"
                        />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    const gradientColors = isDark ? ['#000000ff', '#191b1fff'] : ['#FFFFFF', '#F3F4F6'];

    return (
        <View style={{ flex: 1, backgroundColor: isDark ? '#181A20' : '#F3F4F6' }}>
            {/* Header - Always visible with high z-index */}
            <View style={{ zIndex: 10 }}>
                <SearchHeader
                    editable={false}
                    onSearchPress={() => navigation.navigate('Search')}
                    onBackPress={() => navigation.goBack()}
                    showCamera={true}
                    isDark={isDark}
                    textColor={textColor}
                    placeholderColor={placeholderColor}
                    onFilterPress={() => setIsFilterModalVisible(true)}
                    activeFilterCount={activeFilterCount}
                />
            </View>

            {/* Animated Filter Bar with Gradient Background */}
            {!loading && (
                <Animated.View
                    style={{
                        position: 'absolute',
                        top: 60,
                        zIndex: 2,
                        left: 0,
                        right: 0,
                        transform: [{ translateY: filterAnimatedY }],
                        overflow: 'hidden',
                    }}
                >
                    <LinearGradient
                        colors={gradientColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                    >
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 14 }}
                            style={{
                                borderBottomWidth: 1,
                                borderBottomColor: isDark ? '#2D3038' : '#E5E7EB',
                            }}
                        >
                            {/* Filter Icon Button */}
                            <TouchableOpacity
                                className="flex-row items-center px-4 py-2.5 mr-3 rounded-lg border"
                                style={{
                                    backgroundColor: isDark ? '#2D3038' : '#F3F4F6',
                                    borderColor: isDark ? '#3D4451' : '#E5E7EB',
                                }}
                            >
                                <Icon name="location-outline" size={18} color={isDark ? '#fff' : '#000'} />
                            </TouchableOpacity>

                            {/* Sort by */}
                            <TouchableOpacity
                                className="flex-row items-center px-4 py-2.5 mr-3 rounded-lg border"
                                style={{
                                    backgroundColor: isDark ? '#1E2028' : '#F3F4F6',
                                    borderColor: isDark ? '#2D3038' : '#E5E7EB',
                                }}
                            >
                                <Icon name="swap-vertical" size={16} color={isDark ? '#fff' : '#000'} style={{ marginRight: 5 }} />
                                <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>Sort by</Text>
                            </TouchableOpacity>

                            {/* Free Delivery */}
                            <TouchableOpacity
                                className="px-4 py-2.5 mr-3 rounded-lg border"
                                style={{
                                    backgroundColor: isDark ? '#1E2028' : '#F3F4F6',
                                    borderColor: isDark ? '#2D3038' : '#E5E7EB',
                                }}
                            >
                                <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>Free Delivery</Text>
                            </TouchableOpacity>

                            {/* Stores */}
                            <TouchableOpacity
                                className="px-4 py-2.5 mr-3 rounded-lg border"
                                style={{
                                    backgroundColor: showStores ? (isDark ? '#1E2028' : '#DBEAFE') : (isDark ? '#1E2028' : '#F3F4F6'),
                                    borderColor: showStores ? '#3B82F6' : (isDark ? '#2D3038' : '#E5E7EB'),
                                }}
                                onPress={() => setShowStores(!showStores)}
                            >
                                <Text
                                    className="text-sm font-medium"
                                    style={{ color: showStores ? '#3B82F6' : (isDark ? '#fff' : '#4B5563') }}
                                >
                                    Stores
                                </Text>
                            </TouchableOpacity>

                            {/* Fruits */}
                            <TouchableOpacity
                                className="px-4 py-2.5 mr-3 rounded-lg border"
                                style={{
                                    backgroundColor: isDark ? '#1E2028' : '#F3F4F6',
                                    borderColor: isDark ? '#2D3038' : '#E5E7EB',
                                }}
                            >
                                <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>Fruits</Text>
                            </TouchableOpacity>

                            {/* Vegetables */}
                            <TouchableOpacity
                                className="px-4 py-2.5 mr-3 rounded-lg border"
                                style={{
                                    backgroundColor: isDark ? '#1E2028' : '#F3F4F6',
                                    borderColor: isDark ? '#2D3038' : '#E5E7EB',
                                }}
                            >
                                <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>Vegetables</Text>
                            </TouchableOpacity>

                            {/* Snacks */}
                            <TouchableOpacity
                                className="px-4 py-2.5 mr-3 rounded-lg border"
                                style={{
                                    backgroundColor: isDark ? '#1E2028' : '#F3F4F6',
                                    borderColor: isDark ? '#2D3038' : '#E5E7EB',
                                }}
                            >
                                <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>Snacks</Text>
                            </TouchableOpacity>

                            {/* Discounts */}
                            <TouchableOpacity
                                className="px-4 py-2.5 mr-3 rounded-lg border"
                                style={{
                                    backgroundColor: isDark ? '#2D3038' : '#F3F4F6',
                                    borderColor: isDark ? '#3D4451' : '#E5E7EB',
                                }}
                            >
                                <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>Discounts</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </LinearGradient>
                </Animated.View>
            )
            }

            {/* Top Stores - Only show when filter is active */}
            {
                !loading && showStores && (
                    <Animated.View
                        style={{
                            position: 'absolute',
                            top: 125,
                            left: 0,
                            right: 0,
                            zIndex: 1,
                            backgroundColor: isDark ? '#181A20' : '#F3F4F6',
                            transform: [{ translateY: storesAnimatedY }],
                            overflow: 'hidden',
                        }}
                    >
                        <TopStores />
                    </Animated.View>
                )
            }

            {/* Content */}
            {
                loading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color={accentColor} />
                    </View>
                ) : error ? (
                    <View className="flex-1 justify-center items-center">
                        <Text style={{ color: placeholderColor }}>{error}</Text>
                        <TouchableOpacity
                            className="mt-4 px-4 py-2 bg-blue-500 rounded-lg"
                            onPress={() => fetchProducts()}
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
                        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 12 }}
                        contentContainerStyle={{
                            paddingBottom: 100,
                            paddingTop: contentPaddingTop as any
                        }}
                        showsVerticalScrollIndicator={false}
                        onScroll={onScrollEvent}
                        scrollEventThrottle={16}
                        ListEmptyComponent={
                            <View className="flex-1 justify-center items-center mt-20">
                                <Icon name="cube-outline" size={48} color={placeholderColor} />
                                <Text className="text-gray-500 mt-2">No products found for this category</Text>
                            </View>
                        }
                    />
                )
            }

            <FilterModal
                visible={isFilterModalVisible}
                onClose={() => setIsFilterModalVisible(false)}
                onApply={handleApplyFilters}
                initialFilters={filters}
            />

            {/* Scroll to Top Button */}
            <ScrollToTopButton
                scrollY={scrollY}
                onPress={handleScrollToTop}
                style={{ bottom: 90, right: 20 }} // Adjust position to not overlap with bottom content
            />
        </View >
    );
};


export default CategoryProductsScreen;
