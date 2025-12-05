import React, { memo, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    Image,
    FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useThemePalette } from '../../../hooks/useThemePalette';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
        imageUrl: 'https://assets.indiadesire.com/images/amazon%20pharmacy%20offers.jpg'
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
        imageUrl: 'https://m.media-amazon.com/images/I/61D9+2tVbBL._AC_UL480_FMwebp_QL65_.jpg'
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
        imageUrl: 'https://m.media-amazon.com/images/I/71w+2+2+1+L._AC_UL480_FMwebp_QL65_.jpg'
    },
    {
        _id: '10', title: 'Glucometer Kit', price: 1500, originalPrice: 2200, discount: 32, rating: 4.7,
        imageUrl: 'https://m.media-amazon.com/images/I/71+2+2+1+L._AC_UL480_FMwebp_QL65_.jpg'
    },
    {
        _id: '11', title: 'Whey Protein 1kg', price: 299, originalPrice: 3500, discount: 28, rating: 4.9,
        imageUrl: 'https://m.media-amazon.com/images/I/61s7s+eR+JL._AC_UL480_FMwebp_QL65_.jpg'
    },
    {
        _id: '12', title: 'First Aid Kit Box', price: 50, originalPrice: 1200, discount: 29, rating: 4.5,
        imageUrl: 'https://m.media-amazon.com/images/I/71w+2+2+1+L._AC_UL480_FMwebp_QL65_.jpg'
    },
    {
        _id: '13', title: 'Glucometer Kit', price: 500, originalPrice: 2200, discount: 32, rating: 4.7,
        imageUrl: 'https://m.media-amazon.com/images/I/71+2+2+1+L._AC_UL480_FMwebp_QL65_.jpg'
    },
];

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
                        <Ionicons name="cart-outline" size={22} color="#FFFFFF" />
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
            <View>
                {/* Split data into chunks of 8 */}
                {Array.from({ length: Math.ceil(MOCK_TRENDING_DATA.length / 8) }, (_, rowIndex) => {
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
                })}
            </View>
        </LinearGradient>
    );
};

export default TrendingSection;
