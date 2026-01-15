import { useState, useRef, useEffect, useMemo, useContext } from 'react';
import { Animated, Dimensions, Easing, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { CartContext } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { getItemDetails, addItemToRecentlyViewed } from '../api/medicinesApi';
import { RootStackParamList } from '../../AppNavigator';

const { width: screenWidth } = Dimensions.get('window');

// Types
export interface Product {
    id: string;
    name: string;
    shortTitle: string;
    images: string[];
    units: string[];
    rating: number;
    reviews: number;
    price: number;
    finalPrice: number;
    discountPercent: number | string;
    gst: string;
    deliveryTime: string;
    description: string;
    benefits: string[];
    safetyAdvice: string[];
    sideEffects: string[];
    howToUse: string;
    ingredients: string[];
    precautions: string[];
    similar: SimilarProduct[];
}

export interface SimilarProduct {
    id: string;
    name: string;
    price: number;
    discount: number;
    image: string;
    rating: number;
}

type ProductDetailRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;
type ProductDetailNavProp = NativeStackNavigationProp<RootStackParamList>;

export const useProductDetail = () => {
    const navigation = useNavigation<ProductDetailNavProp>();
    const route = useRoute<ProductDetailRouteProp>();

    // @ts-ignore - CartContext type safety
    const { addToCart } = useContext(CartContext) || {};
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // Safely access productId with fallback
    const productId = route?.params?.productId;

    // Animation Refs
    const scaleValue = useRef(new Animated.Value(1)).current;
    const bottomBarTranslateY = useRef(new Animated.Value(0)).current;
    const scrollX = useRef(new Animated.Value(0)).current;
    const imageRef = useRef<FlatList>(null);

    // State
    const [activeImage, setActiveImage] = useState(0);
    const [selectedUnit, setSelectedUnit] = useState<string>('');
    const [quantity, setQuantity] = useState(1);
    const [showShareOptions, setShowShareOptions] = useState(false);
    const [showShareArcOverlay, setShowShareArcOverlay] = useState(false);

    // Buy Button Breathing Animation
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleValue, {
                    toValue: 1.05,
                    duration: 1000,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
                Animated.timing(scaleValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
            ]),
        ).start();
    }, [scaleValue]);

    // Track Recently Viewed
    useEffect(() => {
        if (productId) {
            addItemToRecentlyViewed(productId)
                .then(() => { })
                .catch(() => { });
        }
    }, [productId]);

    // Fetch Data
    const { data: apiResponse, isLoading, error } = useQuery({
        queryKey: ['product', productId],
        queryFn: () => getItemDetails(productId),
        enabled: !!productId,
    });

    const apiData = apiResponse?.data?.data;

    // Transform Data
    const product: Product | null = useMemo(() => {
        if (!apiData) return null;

        const unitList: string[] = [];
        if (apiData.units?.parent?.name) unitList.push(apiData.units.parent.name);
        if (apiData.units?.child?.name) unitList.push(apiData.units.child.name);
        if (unitList.length === 0) unitList.push('Standard Unit');

        return {
            id: apiData._id,
            name: apiData.itemName,
            shortTitle: apiData.otherInformation?.howToUse || apiData.itemDescription || '',
            images: apiData.itemImages?.length > 0 ? apiData.itemImages : ['https://via.placeholder.com/800x600.png?text=No+Image'],
            units: unitList,
            rating: apiData.itemRatings || 0,
            reviews: 0,
            price: apiData.itemInitialPrice,
            finalPrice: apiData.itemFinalPrice,
            discountPercent: apiData.itemDiscount,
            gst: `${apiData.gst?.rate || 0}%`,
            deliveryTime: apiData.deliveryTime || '2 - 4 days',
            description: apiData.itemDescription || 'No description available',
            benefits: apiData.otherInformation?.benefits || [],
            safetyAdvice: apiData.otherInformation?.safetyAdvice || [],
            sideEffects: apiData.otherInformation?.sideEffects || [],
            howToUse: apiData.otherInformation?.howToUse || '',
            ingredients: apiData.otherInformation?.ingredients || [],
            precautions: apiData.otherInformation?.precautions || [],
            similar: [], // Similar products would typically come from another API endpoint or be filtered
        };
    }, [apiData]);

    // Set default unit
    useEffect(() => {
        if (product && product.units.length > 0) {
            setSelectedUnit(product.units[0]);
        }
    }, [product]);

    // Handlers
    const handleToggleWishlist = () => {
        if (!product) return;
        if (isInWishlist(product.id)) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist({
                _id: product.id,
                itemName: product.name,
                itemDescription: product.description,
                image: product.images[0],
                itemFinalPrice: product.finalPrice,
                itemRatings: product.rating,
                itemDiscount: Number(product.discountPercent) || 0,
                itemInitialPrice: product.price
            });
        }
    };

    const handleAddToCart = () => {
        if (addToCart && product) {
            addToCart({
                id: product.id,
                name: product.name,
                price: product.finalPrice,
                quantity: quantity
            });
           // navigation.navigate('Cart');
        }
    };

    const handleShare = (platform: string) => {
        // Implement actual share logic here if needed
        setShowShareOptions(false);
    };

    // Scroll Handlers
    const handleScrollBeginDrag = () => {
        Animated.timing(bottomBarTranslateY, {
            toValue: 200,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.ease,
        }).start();
    };

    const handleScrollEnd = () => {
        Animated.timing(bottomBarTranslateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
        }).start();
    };

    return {
        // Data
        product,
        isLoading,
        error,
        isDark,
        insets,

        // State
        activeImage,
        setActiveImage,
        selectedUnit,
        setSelectedUnit,
        quantity,
        setQuantity,
        showShareOptions,
        setShowShareOptions,
        showShareArcOverlay,
        setShowShareArcOverlay,

        // Refs
        scaleValue,
        bottomBarTranslateY,
        scrollX,
        imageRef,

        // Handlers
        handleToggleWishlist,
        handleAddToCart,
        handleShare,
        isInWishlist,
        navigation,
        handleScrollBeginDrag,
        handleScrollEnd
    };
};
