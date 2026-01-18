import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getItemFeed } from '../api/medicinesApi';
import { ItemFeedItem } from '../api/types';

import { useNavigation } from '@react-navigation/native';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { ToastAndroid } from 'react-native';
import { useCallback } from 'react';

export const useItemFeed = () => {
    const navigation = useNavigation<any>();
    const { addToCart, isInCart } = useCart();
    const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist();

    const query = useQuery({
        queryKey: ['itemFeed'],
        queryFn: async () => {
            const response = await getItemFeed();

            // Robust data extraction
            const data = response.data;

            if (data && Array.isArray(data.data)) {
                return data.data as ItemFeedItem[];
            }

            // Handle nested data structure backup
            if (Array.isArray(data)) {
                return data as ItemFeedItem[];
            }

            return [] as ItemFeedItem[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes for feed data
        gcTime: 1000 * 60 * 10, // 10 minutes cache
        retry: 2,
        retryDelay: 2000,
        refetchOnWindowFocus: false,
    });

    const chunkedItems = useMemo(() => {
        if (!query.data || query.data.length === 0) return [];
        const chunkSize = 4;
        const chunks = [];
        for (let i = 0; i < query.data.length; i += chunkSize) {
            chunks.push(query.data.slice(i, i + chunkSize));
        }
        return chunks;
    }, [query.data]);

    // --- Action Handlers (Moved from HomePage) ---

    const handleFeedPress = useCallback((item: ItemFeedItem) => {
        if (item._id) navigation.navigate('ProductDetail', { productId: item._id });
    }, [navigation]);

    const handleFeedToggleWishlist = useCallback((item: ItemFeedItem) => {
        if (isInWishlist(item._id)) {
            removeFromWishlist(item._id);
        } else {
            addToWishlist({
                _id: item._id,
                itemName: item.itemName || 'Unknown Item',
                itemDescription: item.itemDescription,
                image: item.image || '',
                itemFinalPrice: Number(item.itemFinalPrice) || 0,
                itemRatings: item.itemRatings,
                itemDiscount: item.itemDiscount,
                itemInitialPrice: Number(item.itemInitialPrice) || 0
            });
        }
    }, [isInWishlist, removeFromWishlist, addToWishlist]);

    const handleFeedAddToCart = useCallback((item: ItemFeedItem) => {
        if (isInCart(item._id)) return;
        addToCart({
            id: item._id,
            name: item.itemName,
            price: Number(item.itemFinalPrice) || 0,
            quantity: 1
        });
        ToastAndroid.show('Item added to cart', ToastAndroid.SHORT);
    }, [isInCart, addToCart]);

    return {
        ...query,
        chunkedItems,
        handleFeedPress,
        handleFeedToggleWishlist,
        handleFeedAddToCart,
        isInCart,       // Exporting these helpers can be useful too
        isInWishlist
    };
};
