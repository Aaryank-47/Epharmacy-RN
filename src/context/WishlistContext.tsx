
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Modal, Dimensions } from 'react-native';
import { useThemePalette } from '../hooks/useThemePalette';

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
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};

const TransparentToast = ({ message, visible }: { message: string, visible: boolean }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.sequence([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.delay(1000), // Short duration
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Animated.View style={[styles.toastContainer, { opacity: fadeAnim }]}>
            <View style={styles.toastContent}>
                <Text style={styles.toastText}>{message}</Text>
            </View>
        </Animated.View>
    );
};

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const showToast = (message: string) => {
        setToastMessage(message);
        setToastVisible(true);
        // Reset after animation
        setTimeout(() => setToastVisible(false), 2000);
    };

    const addToWishlist = (item: WishlistItem) => {
        if (!isInWishlist(item._id)) {
            setWishlistItems(prev => [...prev, item]);
            showToast('Added to wishlist');
        } else {
            showToast('Already in wishlist');
        }
    };

    const removeFromWishlist = (itemId: string) => {
        setWishlistItems(prev => prev.filter(item => item._id !== itemId));
    };

    const isInWishlist = (itemId: string) => {
        return wishlistItems.some(item => item._id === itemId);
    };

    return (
        <WishlistContext.Provider value={{ wishlistItems, addToWishlist, removeFromWishlist, isInWishlist }}>
            {children}
            <TransparentToast message={toastMessage} visible={toastVisible} />
        </WishlistContext.Provider>
    );
};

const styles = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        bottom: 100,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        pointerEvents: 'none',
    },
    toastContent: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        shadowColor: '#000',
        elevation: 2,
    },
    toastText: {
        color: '#FFFFFF', // Fully opaque white text
        fontSize: 12,
        fontWeight: '500',
    }
});
