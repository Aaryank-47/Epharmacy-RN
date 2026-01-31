import React, { memo } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useThemePalette } from '../../../hooks/useThemePalette';

interface SimilarProductCardProps {
    item: any;
    onPress: (item: any) => void;
    onToggleWishlist: (item: any) => void;
    isInWishlist: boolean;
    width: number;
}

const SimilarProductCard: React.FC<SimilarProductCardProps> = ({
    item,
    onPress,
    onToggleWishlist,
    isInWishlist,
    width
}) => {
    const { isDark } = useThemePalette();

    const discount = item.itemDiscount || 0;
    const hasDiscount = discount > 0;

    return (
        <TouchableOpacity
            onPress={() => onPress(item)}
            activeOpacity={0.9}
            className="mb-3 mr-4 rounded-xl overflow-hidden border-0"
            style={{
                width,
                backgroundColor: isDark ? '#1E2028' : '#FFFFFF',
            }}
        >
            {/* Image Section */}
            <View className="h-40 rounded-xl bg-gray-100 border border-gray-200 relative dark:bg-gray-800 dark:border-gray-700">
                <Image
                    source={{ uri: item.image }}
                    className="w-full h-full rounded-xl"
                    resizeMode="cover"
                />

                {/* Wishlist Button */}
                <TouchableOpacity
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 justify-center items-center"
                    onPress={(e) => {
                        e?.stopPropagation?.();
                        onToggleWishlist(item);
                    }}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name={isInWishlist ? "heart" : "heart-outline"}
                        size={18}
                        color={isInWishlist ? "#EF4444" : "#4B5563"}
                    />
                </TouchableOpacity>

                {/* Rating Badge (Bottom Left of Image) */}
                <View className="absolute bottom-2 left-2 bg-white/90 flex-row items-center px-1.5 py-0.5 rounded">
                    <Text className="text-[10px] font-bold text-black">{item.itemRatings || '4.0'}</Text>
                    <Ionicons name="star" size={10} color="#047857" style={{ marginLeft: 2 }} />
                    <View className="w-[1px] h-2 bg-gray-300 mx-1" />
                    <Text className="text-[10px] text-gray-500">{item.views || '10'}k</Text>
                </View>
            </View>

            {/* Content Section */}
            <View className="p-2">
                {/* Brand / Name */}
                <Text
                    className={`text-sm font-bold mb-0.5 ${isDark ? 'text-white' : 'text-black'}`}
                    numberOfLines={1}
                >
                    {item.itemName.split(' ')[0] || 'Brand'}
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
                            <Ionicons name="arrow-down" size={12} color="#16A34A" />
                            <Text className="text-xs font-bold text-green-600 mr-1">{discount}%</Text>
                            <Text className="text-xs line-through text-gray-400 mr-1.5">₹{item.itemInitialPrice}</Text>
                        </>
                    )}
                    <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                        ₹{Math.round(item.itemFinalPrice)}
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
            </View>
        </TouchableOpacity>
    );
};

export default memo(SimilarProductCard);
