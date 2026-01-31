import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ToastAndroid, Platform, Alert } from 'react-native';
import { getWishlist, addToWishlist as addToWishlistApi, removeWishlistItem as removeWishlistItemApi } from '../api/medicinesApi';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { SOCKET_EVENTS } from '../services/socketEvents.types';

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
    const [_isLoading, setIsLoading] = useState(false);
    const [pendingOperations, setPendingOperations] = useState<Set<string>>(new Set());

    const loadWishlist = useCallback(async (force: boolean = false) => {
        // Skip if we have pending operations (optimistic updates in progress)
        if (!force && pendingOperations.size > 0) {
            console.log('Skipping wishlist reload due to pending operations');
            return;
        }

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
                console.log('Wishlist loaded:', mappedItems.length, 'items');
                setWishlistItems(mappedItems as WishlistItem[]);
            }
        } catch (e) {
            console.error('Failed to load wishlist:', e);
        } finally {
            setIsLoading(false);
        }
    }, [pendingOperations]);

    // Load wishlist on mount ONLY
    useEffect(() => {
        loadWishlist(true);
    }, []); // Empty dependency array - run only once on mount

    // Listen for wishlist updates from socket
    useSocketEvent(SOCKET_EVENTS.WISHLIST_UPDATE, () => {
        // Only reload if no pending operations
        loadWishlist(false);
    });

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

        // Optimistic update - add to UI immediately
        const itemWithImage = {
            ...item,
            image: item.itemImages && item.itemImages.length > 0 ? item.itemImages[0] : (item.image || ''),
        };
        setWishlistItems(prev => [itemWithImage, ...prev]);
        showToast('Added to wishlist');

        // Mark operation as pending
        setPendingOperations(prev => new Set(prev).add(item._id));

        try {
            // API Call in background
            const response = await addToWishlistApi(item._id);
            console.log("Add to wishlist response:", response);
            
            // Check if API returned failure
            if (!response.success) {
                console.error('API returned failure:', response);
                // Rollback optimistic update
                setWishlistItems(prev => prev.filter(i => i._id !== item._id));
                showToast('Item could not be added to wishlist');
            }
        } catch (error) {
            console.error("Failed to add to wishlist", error);
            // Rollback optimistic update on failure
            setWishlistItems(prev => prev.filter(i => i._id !== item._id));
            showToast('Failed to add to wishlist');
        } finally {
            // Remove from pending operations
            setPendingOperations(prev => {
                const newSet = new Set(prev);
                newSet.delete(item._id);
                return newSet;
            });
        }
    }, [wishlistItems]);

    const removeFromWishlist = useCallback(async (itemId: string) => {
        // Store item for potential rollback
        const itemToRemove = wishlistItems.find(item => item._id === itemId);
        
        // Optimistic update - remove from UI immediately
        setWishlistItems(prev => prev.filter(item => item._id !== itemId));
        
        // Mark operation as pending
        setPendingOperations(prev => new Set(prev).add(itemId));

        try {
            // API Call in background
            const response = await removeWishlistItemApi(itemId);
            console.log("Remove from wishlist response:", response);
            
            // Check if API returned failure
            if (!response.success) {
                console.error('API returned failure:', response);
                // Rollback optimistic update
                if (itemToRemove) {
                    setWishlistItems(prev => [itemToRemove, ...prev]);
                }
                showToast('Item could not be removed from wishlist');
            }
        } catch (error) {
            console.error("Failed to remove item", error);
            // Rollback optimistic update on failure
            if (itemToRemove) {
                setWishlistItems(prev => [itemToRemove, ...prev]);
            }
            showToast('Failed to remove item');
        } finally {
            // Remove from pending operations
            setPendingOperations(prev => {
                const newSet = new Set(prev);
                newSet.delete(itemId);
                return newSet;
            });
        }
    }, [wishlistItems]);

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
