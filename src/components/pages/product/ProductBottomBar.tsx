import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Product } from '../../../hooks/useProductDetail';

interface ProductBottomBarProps {
    product: Product;
    quantity: number;
    bottomBarTranslateY: Animated.Value;
    scaleValue: Animated.Value;
    onAddToCart: () => void;
    isDark: boolean;
}

const ProductBottomBar: React.FC<ProductBottomBarProps> = memo(({
    product,
    bottomBarTranslateY,
    scaleValue,
    onAddToCart,
    quantity,
    isDark
}) => {
    return (
        <Animated.View
            className="absolute bottom-4 left-2 right-2"
            style={{ transform: [{ translateY: bottomBarTranslateY }] }}
        >
            <View
                className="flex-row items-center justify-between p-3 pl-6 rounded-[24px] shadow-xl w-full"
                style={{
                    backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                    borderWidth: isDark ? 2 : 0,
                    borderColor: isDark ? '#374151' : 'transparent',
                }}
            >
                {/* Price Section */}
                <View>
                    <Text className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-0.5">
                        Final Price
                    </Text>
                    <Text className="text-2xl font-bold text-neutral-900 dark:text-white">
                        ₹{product.finalPrice * quantity}
                    </Text>
                </View>

                {/* Buy Now - Animated */}
                <View className="flex-row items-center gap-3">
                    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
                        <TouchableOpacity
                            className="flex-row items-center justify-center h-12 px-6 rounded-full bg-[#40C057] shadow-lg shadow-green-500/40"
                            activeOpacity={0.9}
                            onPress={onAddToCart} // Assuming logic: Buy Now adds to cart & goes to checkout, or just adds to cart
                        >
                            <Text className="text-white font-bold text-base mr-2 tracking-wide">Buy Now</Text>
                            <Icon name="arrow-forward" size={18} color="#fff" />
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </View>
        </Animated.View>
    );
});

export default ProductBottomBar;
