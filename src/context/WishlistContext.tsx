import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ToastAndroid, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WishlistItem {
    _id: string;
    itemName: string;
    itemDescription?: string;
    image: string;
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

const STORAGE_KEY = '@wishlist_items';

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load wishlist on mount
    useEffect(() => {
        const loadWishlist = async () => {
            try {
                const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
                if (jsonValue != null) {
                    setWishlistItems(JSON.parse(jsonValue));
                }
            } catch (e) {
                console.error('Failed to load wishlist:', e);
            } finally {
                setIsLoaded(true);
            }
        };
        loadWishlist();
    }, []);

    // Save wishlist whenever it changes, but only after initial load
    useEffect(() => {
        if (!isLoaded) return;

        const saveWishlist = async () => {
            try {
                const jsonValue = JSON.stringify(wishlistItems);
                await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
            } catch (e) {
                console.error('Failed to save wishlist:', e);
            }
        };
        saveWishlist();
    }, [wishlistItems, isLoaded]);

    const showToast = (message: string) => {
        if (Platform.OS === 'android') {
            ToastAndroid.show(message, ToastAndroid.SHORT);
        } else {
            Alert.alert('Wishlist', message);
        }
    };

    const addToWishlist = useCallback((item: WishlistItem) => {
        setWishlistItems(prev => {
            if (prev.some(i => i._id === item._id)) {
                showToast('Already in wishlist');
                return prev;
            }
            showToast('Added to wishlist');
            return [...prev, item];
        });
    }, []);

    const removeFromWishlist = useCallback((itemId: string) => {
        setWishlistItems(prev => {
            const newItems = prev.filter(item => item._id !== itemId);
            if (newItems.length !== prev.length) {
                showToast('Removed from wishlist');
            }
            return newItems;
        });
    }, []);

    const isInWishlist = useCallback((itemId: string) => {
        return wishlistItems.some(item => item._id === itemId);
    }, [wishlistItems]);

    const clearWishlist = useCallback(async () => {
        try {
            await AsyncStorage.removeItem(STORAGE_KEY);
            setWishlistItems([]);
            showToast('Wishlist cleared');
        } catch (e) {
            console.error('Failed to clear wishlist:', e);
        }
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
