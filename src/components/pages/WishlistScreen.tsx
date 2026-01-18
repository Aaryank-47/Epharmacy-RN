import React, { useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StatusBar, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemePalette } from '../../hooks/useThemePalette';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import LinearGradient from 'react-native-linear-gradient';
import Tabs from '../commonPage/Tab';

const { width } = Dimensions.get('window');

const WishlistScreen = () => {
    const navigation = useNavigation<any>();
    const { isDark, accentColor } = useThemePalette();
    const { wishlistItems, removeFromWishlist } = useWishlist();
    const { addToCart } = useCart();

    const handleAddToCart = useCallback((item: any) => {
        addToCart({
            id: item._id,
            name: item.itemName,
            price: item.itemFinalPrice,
            quantity: 1,
        });
        navigation.navigate('ShoppingBag');
    }, [addToCart, navigation]);

    const renderItem = useCallback(({ item }: { item: any }) => {
        // Mock color options for visual fidelity as per reference image
        const colors = ['#FCA5A5', '#FCD34D', '#111827'];

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
                className={`flex-row mb-5 rounded-[24px] p-3 shadow-sm ${isDark ? 'bg-[#1E2028]' : 'bg-white'}`}
                style={{
                    shadowColor: isDark ? '#000' : '#E5E7EB',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isDark ? 0.3 : 1,
                    shadowRadius: 16,
                    elevation: 1, // Subtle elevation for clean look
                }}
            >
                {/* Image Section */}
                <View className="relative">
                    <View className={`w-32 h-32 rounded-[20px] overflow-hidden ${isDark ? 'bg-[#2A2D35]' : 'bg-gray-100'}`}>
                        <Image
                            source={{ uri: item.image }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    </View>

                    {/* "Shop" Overlay Button */}
                    <TouchableOpacity
                        onPress={() => handleAddToCart(item)}
                        className="absolute -bottom-2 -right-2 flex-row items-center bg-[#F97316] pl-3 pr-4 py-2 rounded-tl-[20px] rounded-br-[20px] rounded-bl-[8px] rounded-tr-[8px] border-4 border-white dark:border-[#1E2028]"
                        activeOpacity={0.8}
                    >
                        <View className="bg-white/20 p-1 rounded-full mr-1.5">
                            <Ionicons name="bag-handle" size={14} color="white" />
                        </View>
                        <Text className="text-white font-bold text-xs tracking-wide">Shop</Text>
                    </TouchableOpacity>
                </View>

                {/* Content Section */}
                <View className="flex-1 ml-4 justify-between py-1">
                    <View>
                        <Text
                            numberOfLines={1}
                            className={`text-base font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}
                        >
                            {item.itemName}
                        </Text>
                        <Text
                            numberOfLines={1}
                            className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-400'}`}
                        >
                            {item.itemDescription || 'Bloom with elegance'}
                        </Text>

                        {/* Rating Stars */}
                        <View className="flex-row mb-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Ionicons key={star} name="star" size={12} color="#FBBF24" style={{ marginRight: 2 }} />
                            ))}
                        </View>
                    </View>

                    {/* Footer: Price + Actions */}
                    <View className="flex-row justify-between items-end">
                        <View>
                            <Text className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                ₹{item.itemFinalPrice}
                            </Text>
                        </View>

                        <View className="flex-row items-center">
                            {/* NEW: Cart Icon (Left of Heart) */}
                            <TouchableOpacity
                                onPress={() => handleAddToCart(item)}
                                className="mr-3 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-full"
                            >
                                <Ionicons name="cart-outline" size={18} color={isDark ? '#FFF' : '#374151'} />
                            </TouchableOpacity>

                            {/* Heart Logic: Filled because it IS in wishlist */}
                            <TouchableOpacity
                                onPress={() => removeFromWishlist(item._id)}
                                className="mr-2" // Reduced margin to bring dots closer
                            >
                                <Ionicons name="heart" size={22} color="#F97316" />
                            </TouchableOpacity>

                            {/* Color Options (Visual Mock) */}
                            <View className="flex-row -space-x-1">
                                {colors.map((color, index) => (
                                    <View
                                        key={index}
                                        style={{ backgroundColor: color }}
                                        className={`w-3 h-3 rounded-full border border-white ${index === 2 ? 'border-2 border-gray-300' : ''}`}
                                    />
                                ))}
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }, [isDark, navigation, handleAddToCart, removeFromWishlist]);

    return (
        <Tabs currentActiveTab="Profile" onNavigate={(screen) => navigation.navigate(screen as never)}>
            <View className={`flex-1 ${isDark ? 'bg-[#121212]' : 'bg-[#FAFAFA]'}`}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#121212' : '#FAFAFA'} />

                {/* Header */}
                <View className="flex-row justify-between items-center px-6 pt-4 pb-2">
                    <TouchableOpacity onPress={() => navigation.goBack()} className={`p-2 rounded-full ${isDark ? 'bg-[#2A2A2A]' : 'bg-white'}`}>
                        <Ionicons name="arrow-back" size={24} color={isDark ? 'white' : 'black'} />
                    </TouchableOpacity>
                    <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Favorites
                    </Text>
                    <View className="w-10" />
                </View>

                <View className="flex-1 px-5 pt-4">
                    {wishlistItems.length > 0 ? (
                        <FlatList
                            data={wishlistItems}
                            renderItem={renderItem}
                            keyExtractor={(item) => item._id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 100 }} // Increased padding for Tabs
                        />
                    ) : (
                        <View className="flex-1 justify-center items-center">
                            <View className={`w-24 h-24 rounded-full justify-center items-center mb-4 ${isDark ? 'bg-[#2A2A2A]' : 'bg-gray-100'}`}>
                                <Ionicons name="heart-outline" size={48} color="#9CA3AF" />
                            </View>
                            <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Your wishlist is empty
                            </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('HomeTabs')} className="mt-4">
                                <Text className="text-[#F97316] font-bold">Start Shopping</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Tabs>
    );
};

export default WishlistScreen;
