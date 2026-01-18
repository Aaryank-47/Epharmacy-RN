import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ToastAndroid, Platform, Alert } from 'react-native';
import { getWishlist, addToWishlist as addToWishlistApi, removeWishlistItem as removeWishlistItemApi } from '../api/medicinesApi';

interface WishlistItem {
    _id: string;
    itemName: string;
    itemDescription?: string;
    image: string;
    itemImages?: string[]; // Added to match API response
    itemRatings?: number;
    itemFinalPrice: number;
    itemDiscount?: number;
    itemInitialPrice?: number;
}

interface WishlistContextType {
    wishlistItems: WishlistItem[];
    addToWishlist: (item: WishlistItem) => void;
    removeFromWishlist: (itemId: string) => void;
    isInWishlist: (itemId: string) => boolean;
    clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Load wishlist on mount
    useEffect(() => {
        const loadWishlist = async () => {
            try {
                setIsLoading(true);
                const response = await getWishlist();
                if (response.success && response.data?.items) {
                    // Map API items to WishlistItem structure
                    const mappedItems = response.data.items.map((item: any) => ({
                        ...item,
                        // API returns itemImages array, UI expects image string
                        image: item.itemImages && item.itemImages.length > 0 ? item.itemImages[0] : (item.image || ''),
                    }));
                    setWishlistItems(mappedItems as WishlistItem[]);
                }
            } catch (e) {
                console.error('Failed to load wishlist:', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadWishlist();
    }, []);

    const showToast = (message: string) => {
        if (Platform.OS === 'android') {
            ToastAndroid.show(message, ToastAndroid.SHORT);
        } else {
            Alert.alert('Wishlist', message);
        }
    };

    const addToWishlist = useCallback(async (item: WishlistItem) => {
        // Optimistic check
        if (wishlistItems.some(i => i._id === item._id)) {
            showToast('Already in wishlist');
            return;
        }

        try {
            // API Call
            await addToWishlistApi(item._id);


            const itemWithImage = {
                ...item,
                image: item.itemImages && item.itemImages.length > 0 ? item.itemImages[0] : (item.image || ''),
            };

            setWishlistItems(prev => [itemWithImage, ...prev]);
            showToast('Added to wishlist');
        } catch (error) {
            console.error("Failed to add to wishlist", error);
            showToast('Failed to add to wishlist');
        }
    }, [wishlistItems]);

    const removeFromWishlist = useCallback(async (itemId: string) => {
        try {
            await removeWishlistItemApi(itemId);
            // Ensure state is synced
            setWishlistItems(prev => prev.filter(item => item._id !== itemId));
        } catch (error) {
            console.error("Failed to remove item", error);
            showToast('Failed to remove item');
        }
    }, []);

    const isInWishlist = useCallback((itemId: string) => {
        return wishlistItems.some(item => item._id === itemId);
    }, [wishlistItems]);

    const clearWishlist = useCallback(async () => {
        setWishlistItems([]);
    }, []);

    return (
        <WishlistContext.Provider value={{
            wishlistItems,
            addToWishlist,
            removeFromWishlist,
            isInWishlist,
            clearWishlist
        }}>
            {children}
        </WishlistContext.Provider>
    );
};
