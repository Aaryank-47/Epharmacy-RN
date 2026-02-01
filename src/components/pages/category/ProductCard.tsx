import React from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Medicine } from '../../../api/types';
import { useThemePalette } from '../../../hooks/useThemePalette';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 36) / 2;

interface ProductCardProps {
    item: Medicine;
    onPress: (item: Medicine) => void;
    onAddToCart: (item: Medicine) => void;
    onToggleWishlist: (item: Medicine) => void;
    onShare: (item: Medicine) => void;
    isInCart: boolean;
    isInWishlist: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
    item,
    onPress,
    onAddToCart,
    onToggleWishlist,
    onShare,
    isInCart,
    isInWishlist
}) => {
    const { isDark, accentColor, placeholderColor } = useThemePalette();

    const discount = item.discount || 0;
    const hasDiscount = discount > 0;
    const initialPrice = item.itemInitialPrice || 0;
    const price = hasDiscount ? initialPrice - (initialPrice * discount / 100) : initialPrice;

    const imageUri = Array.isArray(item.itemImages) && item.itemImages[0]
        ? item.itemImages[0]
        : (typeof item.image === 'string' ? item.image : null);

    return (
        <TouchableOpacity
            className="rounded-xl overflow-hidden mb-4"
            style={{ width: CARD_WIDTH }}
            onPress={() => onPress(item)}
            activeOpacity={0.9}
        >
            {/* Image Section */}
            <View className="h-48 rounded-xl bg-gray-500 border border-gray-100 relative dark:bg-gray-800 dark:border-gray-700">
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

                {/* Share Button */}
                <TouchableOpacity
                    className="absolute top-2 left-2 w-7 h-7 rounded-full bg-white/90 justify-center items-center"
                    onPress={(e) => {
                        e.stopPropagation();
                        onShare(item);
                    }}
                >
                    <Icon name="share-social-outline" size={18} color="#4B5563" />
                </TouchableOpacity>

                {/* Wishlist Button */}
                <TouchableOpacity
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 justify-center items-center"
                    onPress={(e) => {
                        e?.stopPropagation?.();
                        onToggleWishlist(item);
                    }}
                >
                    <Icon
                        name={isInWishlist ? "heart" : "heart-outline"}
                        size={18}
                        color={isInWishlist ? "#EF4444" : "#4B5563"}
                    />
                </TouchableOpacity>

                {/* Rating Badge */}
                <View className="absolute bottom-2 left-2 bg-white/90 flex-row items-center px-1.5 py-0.5 rounded">
                    <Text className="text-[10px] font-bold text-black">{item.itemRatings || '4.0'}</Text>
                    <Icon name="star" size={10} color="#047857" style={{ marginLeft: 2 }} />
                    <View className="w-[1px] h-2 bg-gray-300 mx-1" />
                    <Text className="text-[10px] text-gray-500">{(item as any).views || '10'}k</Text>
                </View>
            </View>

            {/* Content Section */}
            <View className="p-2">
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

                {hasDiscount && (
                    <View className="bg-purple-100 px-1.5 py-0.5 self-start rounded mb-1.5 dark:bg-purple-900/40">
                        <Text className="text-[10px] font-bold text-purple-700 dark:text-purple-300">Top Discount of the Sale</Text>
                    </View>
                )}

                <Text className={`text-[10px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`} numberOfLines={1}>
                    Delivery by <Text className="font-bold">21st Jan</Text>
                </Text>

                <TouchableOpacity
                    className="absolute bottom-2 right-2 rounded-full justify-center items-center"
                    style={{
                        width: 32,
                        height: 32,
                        backgroundColor: isInCart ? '#10B981' : accentColor,
                        borderWidth: 1.5,
                        borderColor: '#FFFFFF',
                        elevation: 3,
                    }}
                    onPress={() => onAddToCart(item)}
                    activeOpacity={0.8}
                >
                    <Icon
                        name={isInCart ? "checkmark" : "cart-outline"}
                        size={18}
                        color="#fff"
                    />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

export default React.memo(ProductCard);
