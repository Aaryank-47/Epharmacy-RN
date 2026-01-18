import React, { memo, useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemePalette } from '../../../hooks/useThemePalette';
import { getSimilarProducts, SimilarProductsResponse } from '../../../api/medicinesApi';
import SimilarProductCard from './SimilarProductCard';
import { useWishlist } from '../../../context/WishlistContext';

interface SimilarProductsProps {
    productId: string;
}

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = (screenWidth - 8) / 2.2; // Adjusted for roughly 2.2 cards visible per "screen" logic or specific width

const SimilarProducts: React.FC<SimilarProductsProps> = ({ productId }) => {
    const navigation = useNavigation<any>();
    const { isDark } = useThemePalette();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchSimilar = async () => {
            // Reset state when productId changes
            setLoading(true);
            try {
                const response = await getSimilarProducts(productId);
                if (isMounted && response.success && response.data?.items) {
                    setProducts(response.data.items);
                }
            } catch (error) {
                console.error("Failed to fetch similar products", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        if (productId) {
            fetchSimilar();
        }

        return () => { isMounted = false; };
    }, [productId]);

    const handleProductPress = useCallback((item: any) => {
        navigation.push('ProductDetail', { productId: item._id });
    }, [navigation]);

    const handleToggleWishlist = useCallback((item: any) => {
        if (isInWishlist(item._id)) {
            removeFromWishlist(item._id);
        } else {
            addToWishlist({
                _id: item._id,
                itemName: item.itemName,
                image: item.image,
                itemFinalPrice: item.itemFinalPrice,
                // Add other required fields if necessary
            } as any);
        }
    }, [isInWishlist, addToWishlist, removeFromWishlist]);


    const firstRow = useMemo(() => products.slice(0, 5), [products]);
    const secondRow = useMemo(() => products.slice(5), [products]);

    if (loading) {
        return (
            <View className="py-8 justify-center items-center">
                <ActivityIndicator size="small" color={isDark ? '#fff' : '#000'} />
            </View>
        );
    }

    if (products.length === 0) return null;

    return (
        <View className={`py-2 ${isDark ? 'bg-[#121212]' : 'bg-white'} mt-0`}>
            <View className="px-4 mb-4">
                <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Similar Products
                </Text>
            </View>

            {/* First Row: Max 5 Items */}
            <FlatList
                horizontal
                data={firstRow}
                renderItem={({ item }) => (
                    <SimilarProductCard
                        item={item}
                        width={CARD_WIDTH}
                        onPress={handleProductPress}
                        onToggleWishlist={handleToggleWishlist}
                        isInWishlist={isInWishlist(item._id)}
                    />
                )}
                keyExtractor={(item) => `row1-${item._id}`}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
            />

            {/* Second Row: Remaining Items (if any) */}
            {secondRow.length > 0 && (
                <FlatList
                    horizontal
                    data={secondRow}
                    renderItem={({ item }) => (
                        <SimilarProductCard
                            item={item}
                            width={CARD_WIDTH}
                            onPress={handleProductPress}
                            onToggleWishlist={handleToggleWishlist}
                            isInWishlist={isInWishlist(item._id)}
                        />
                    )}
                    keyExtractor={(item) => `row2-${item._id}`}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, marginTop: 4 }}
                />
            )}
        </View>
    );
};

export default memo(SimilarProducts);
