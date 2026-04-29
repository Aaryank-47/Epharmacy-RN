import React, { useCallback, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemePalette } from '../../hooks/useThemePalette';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import Tabs from '../commonPage/Tab';

const WishlistScreen = () => {
    const navigation = useNavigation<any>();
    const { isDark } = useThemePalette();
    const { wishlistItems, removeFromWishlist } = useWishlist();
    const { addToCart } = useCart();

    // Local state for Swipe-to-Delete Undo
    const [deletedItem, setDeletedItem] = useState<{ item: any, index: number } | null>(null);
    const [toastVisible, setToastVisible] = useState(false);
    const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const rowRefs = useRef<Map<string, Swipeable>>(new Map());

    const handleAddToCart = useCallback((item: any) => {
        addToCart({
            id: item._id,
            name: item.itemName,
            price: item.itemFinalPrice,
            quantity: 1,
        });
        navigation.navigate('ShoppingBag');
    }, [addToCart, navigation]);

    const handleDelete = useCallback((item: any) => {
        // 1. Close swipeable
        const rowItem = rowRefs.current.get(item._id);
        rowItem?.close();

        // 2. Clear previous timer if any
        if (deleteTimerRef.current) {
            clearTimeout(deleteTimerRef.current);
            // Force commit previous if exists
            if (deletedItem) {
                removeFromWishlist(deletedItem.item._id);
            }
        }

        // 3. Set pending delete
        setDeletedItem({ item, index: -1 });
        setToastVisible(true);

        // 4. Set Timer
        deleteTimerRef.current = setTimeout(() => {
            removeFromWishlist(item._id);
            setDeletedItem(null);
            setToastVisible(false);
            deleteTimerRef.current = null;
        }, 2000);

    }, [deletedItem, removeFromWishlist]);

    const handleUndo = useCallback(() => {
        if (deleteTimerRef.current) {
            clearTimeout(deleteTimerRef.current);
            deleteTimerRef.current = null;
        }
        setDeletedItem(null);
        setToastVisible(false);
    }, []);

    const renderItem = useCallback(({ item }: { item: any }) => {
        if (deletedItem?.item._id === item._id) return null; // Optimistically hide

        // Mock color options for visual fidelity as per reference image
        const colors = ['#FCA5A5', '#FCD34D', '#111827'];

        const renderRightActions = (progress: any, dragX: any, item: any) => {
            return (
                <TouchableOpacity
                    onPress={() => handleDelete(item)}
                    className="justify-center items-center mb-5 bg-red-600 rounded-r-[24px]"
                    style={{ width: 90 }}
                >
                    <View className="items-center">
                        <Ionicons name="trash-outline" size={26} color="white" />
                        <Text className="text-white text-[10px] font-bold mt-1">Remove</Text>
                    </View>
                </TouchableOpacity>
            );
        };

        return (
            <GestureHandlerRootView>
                <Swipeable
                    ref={ref => {
                        if (ref && item._id) {
                            rowRefs.current.set(item._id, ref);
                        }
                    }}
                    renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}
                    containerStyle={{ overflow: 'visible' }}
                >
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
                                    {(item.itemDiscount || 0) > 0 && (
                                        <Text className="text-xs font-bold text-green-600 dark:text-green-400 mb-0.5">
                                            {item.itemDiscount}% OFF
                                        </Text>
                                    )}
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

                                    {/* Trigger Delete on Press for explicit consistency or Swipe */}
                                    <TouchableOpacity
                                        onPress={() => handleDelete(item)} // Changed to trigger delete flow
                                        className="mr-2"
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
                </Swipeable>
            </GestureHandlerRootView>
        );
    }, [isDark, navigation, handleAddToCart, deletedItem, handleDelete]);

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
                            data={wishlistItems.filter(item => item._id !== deletedItem?.item._id)} // Hide locally
                            renderItem={renderItem}
                            keyExtractor={(item) => item._id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 100 }}
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


                {/* Custom Undo Toast */}
                {toastVisible && (
                    <View
                        className="absolute bottom-24 left-4 right-4 bg-[#1F2937] dark:bg-[#FAFAFA] rounded-2xl p-4 flex-row justify-between items-center shadow-2xl"
                        style={{
                            elevation: 10,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            zIndex: 100
                        }}
                    >
                        <View className="flex-row items-center flex-1 mr-4">
                            <View className="w-8 h-8 rounded-full bg-red-500/10 justify-center items-center mr-3">
                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            </View>
                            <Text className="text-white dark:text-gray-900 font-medium text-sm">
                                Item removed from wishlist
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={handleUndo}
                            className="bg-[#F97316] px-5 py-2 rounded-xl active:opacity-90"
                        >
                            <Text className="text-white font-bold text-xs tracking-wide">UNDO</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Tabs>
    );
};

export default WishlistScreen;
