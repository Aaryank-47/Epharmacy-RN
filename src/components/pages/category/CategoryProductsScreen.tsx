import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    Animated,
    Platform,
    UIManager,
    LayoutAnimation,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useThemePalette } from '../../../hooks/useThemePalette';
import { getItemsByCategory } from '../../../api/medicinesApi';
import type { Medicine, SearchFilters } from '../../../api/types';
import { SearchHeader } from '../../commonPage/search/SearchComponents';
import FilterModal from '../../commonPage/search/FilterModal';
import TopStores from '../../commonPage/TopStores';
import ShareOverlay from '../../commonPage/ShareOverlay';
import { useCart } from '../../../context/CartContext';
import { useWishlist } from '../../../context/WishlistContext';
import ScrollToTopButton from '../../commonPage/ScrollToTopButton';
import Icon from 'react-native-vector-icons/Ionicons';
import { useProductShare } from '../../../hooks/useProductShare';
import ProductCard from './ProductCard';
import FilterBar from '../../commonPage/search/FilterBar';

const CategoryProductsScreen: React.FC = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { categoryId } = route.params || {};
    const { isDark, textColor, accentColor, placeholderColor } = useThemePalette();
    const { addToCart, isInCart } = useCart();
    const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist();
    const { shareProduct } = useProductShare();

    const [products, setProducts] = useState<Medicine[]>([]);
    const [showStores, setShowStores] = useState(true); // Default ON
    const flatListRef = useRef<Animated.FlatList<Medicine>>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<SearchFilters>({});
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
    const limit = 100;

    // --- Share Logic State ---
    const [selectedProductToShare, setSelectedProductToShare] = useState<Medicine | null>(null);
    const [showShareArcOverlay, setShowShareArcOverlay] = useState(false);

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

    // --- Smooth Scroll Animations ---
    const scrollY = useRef(new Animated.Value(0)).current;

    // Enable LayoutAnimation for Android
    useEffect(() => {
        if (Platform.OS === 'android') {
            if (UIManager.setLayoutAnimationEnabledExperimental) {
                UIManager.setLayoutAnimationEnabledExperimental(true);
            }
        }
    }, []);

    // Scroll Interpolations
    const storesAnimatedY = scrollY.interpolate({
        inputRange: [0, 30, 180],
        outputRange: [0, 0, -200],
        extrapolate: 'clamp',
    });

    const filterAnimatedY = scrollY.interpolate({
        inputRange: [0, 100, 160],
        outputRange: [0, 0, -65],
        extrapolate: 'clamp',
    });

    const onScrollEvent = Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true }
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
            // ToastAndroid.show('Item has already been added to the cart', ToastAndroid.SHORT);
            return;
        }

        const price = item.discount ? (item.itemInitialPrice || 0) - ((item.itemInitialPrice || 0) * item.discount / 100) : (item.itemInitialPrice || 0);

        addToCart({
            id: item._id,
            name: item.itemName || '',
            price: Math.round(price),
            quantity: 1,
        });
        // ToastAndroid.show('Item has been added to the cart', ToastAndroid.SHORT);
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

    const onSharePress = useCallback((item: Medicine) => {
        setSelectedProductToShare(item);
        setShowShareArcOverlay(true);
    }, []);

    const performShare = async (platform: string) => {
        if (selectedProductToShare) {
            setShowShareArcOverlay(false);
            await shareProduct(selectedProductToShare, platform);
        }
    };

    const renderProductItem = ({ item }: { item: Medicine }) => {
        return (
            <ProductCard
                item={item}
                onPress={handleProductPress}
                onAddToCart={handleAddToCart}
                onToggleWishlist={handleToggleWishlist}
                onShare={onSharePress}
                isInCart={isInCart(item._id)}
                isInWishlist={isInWishlist(item._id)}
            />
        );
    };

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

            {/* Animated Filter Bar */}
            {!loading && (
                <FilterBar
                    translateY={filterAnimatedY}
                    onFilterPress={() => setIsFilterModalVisible(true)}
                    showStores={showStores}
                    onToggleStores={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setShowStores(!showStores);
                    }}
                />
            )}

            {/* Top Stores - Persistent Render with Animation */}
            {
                !loading && (
                    <Animated.View
                        style={{
                            position: 'absolute',
                            top: 125,
                            left: 0,
                            right: 0,
                            zIndex: 1,
                            backgroundColor: isDark ? '#181A20' : '#F3F4F6',
                            transform: [
                                { translateY: storesAnimatedY },
                            ],
                            height: showStores ? 150 : 0,
                            opacity: showStores ? 1 : 0,
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
                            paddingTop: showStores ? 220 : 80 // Instant layout change, smoothed by LayoutAnimation
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

            {/* ARC Share Overlay */}
            {showShareArcOverlay && (
                <View style={{ ...StyleSheet.absoluteFillObject, zIndex: 999 }} pointerEvents="box-none">
                    <Animated.View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' }}>
                        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowShareArcOverlay(false)} />
                    </Animated.View>
                    <ShareOverlay
                        onClose={() => setShowShareArcOverlay(false)}
                        onShareWhatsapp={() => performShare('whatsapp')}
                        onShareInsta={() => performShare('instagram')}
                        onShareFB={() => performShare('facebook')}
                        onShareX={() => performShare('x')}
                        onShareTelegram={() => performShare('telegram')}
                    />
                </View>
            )}

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
