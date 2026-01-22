import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, ScrollView, Switch, Animated, PanResponder, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useThemePalette } from '../../../hooks/useThemePalette';
import type { SearchFilters } from '../../../api/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100; // Minimum swipe distance to trigger dismiss

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    onApply: (filters: SearchFilters) => void;
    initialFilters: SearchFilters;
}

const FilterModal: React.FC<FilterModalProps> = ({
    visible,
    onClose,
    onApply,
    initialFilters
}) => {
    const { isDark, textColor, accentColor, placeholderColor } = useThemePalette();

    // Local State for Filters
    const [minPrice, setMinPrice] = useState<string>('');
    const [maxPrice, setMaxPrice] = useState<string>('');
    const [minRating, setMinRating] = useState<number | undefined>(undefined);
    const [minDiscount, setMinDiscount] = useState<number | undefined>(undefined);
    const [isTrending, setIsTrending] = useState<boolean>(false);

    // Animation constants
    const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.8;
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    // Derived backdrop opacity based on translateY
    const backdropOpacityProp = translateY.interpolate({
        inputRange: [0, DRAWER_HEIGHT],
        outputRange: [0.5, 0],
        extrapolate: 'clamp',
    });

    // Pan responder for high-performance swipe-to-dismiss
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                // Respond to vertical swipes (downward) if dragging down more than sideways
                return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && gestureState.dy > 5;
            },
            onPanResponderMove: (evt, gestureState) => {
                // Directly control translateY with finger movement
                if (gestureState.dy > 0) {
                    translateY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (evt, gestureState) => {
                // Dismiss if swiped down significantly or with enough speed
                if (gestureState.dy > 120 || (gestureState.vy > 0.5 && gestureState.dy > 0)) {
                    handleDismiss();
                } else {
                    // Crisp snap back
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                        friction: 8,
                        tension: 40,
                    }).start();
                }
            },
            onPanResponderTerminate: () => {
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                }).start();
            },
        })
    ).current;

    useEffect(() => {
        if (visible) {
            // Reset local state to match initial props when opened
            setMinPrice(initialFilters.minPrice ? initialFilters.minPrice.toString() : '');
            setMaxPrice(initialFilters.maxPrice ? initialFilters.maxPrice.toString() : '');
            setMinRating(initialFilters.minRating);
            setMinDiscount(initialFilters.minDiscount);
            setIsTrending(initialFilters.isTrending || false);

            // Animate in from bottom
            Animated.spring(translateY, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }).start();
        } else {
            // Ensure hidden state
            translateY.setValue(SCREEN_HEIGHT);
        }
    }, [visible, initialFilters, translateY]);

    const handleDismiss = () => {
        // Crisp cleanup animation
        Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            onClose();
        });
    };

    const handleApply = () => {
        const filters: SearchFilters = {
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
            minRating,
            minDiscount,
            isTrending
        };
        onApply(filters);
        handleDismiss();
    };

    const handleReset = () => {
        setMinPrice('');
        setMaxPrice('');
        setMinRating(undefined);
        setMinDiscount(undefined);
        setIsTrending(false);
    };

    const renderSectionTitle = (title: string) => (
        <Text className="text-sm font-bold mb-2 mt-3" style={{ color: textColor }}>{title}</Text>
    );

    const renderPill = (label: string, isSelected: boolean, onPress: () => void) => (
        <TouchableOpacity
            onPress={onPress}
            style={{
                backgroundColor: isSelected ? accentColor : (isDark ? '#2D3038' : '#F3F4F6'),
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                marginRight: 8,
                borderWidth: 1,
                borderColor: isSelected ? accentColor : (isDark ? '#3D4048' : '#E5E7EB')
            }}
        >
            <Text
                className="text-xs"
                style={{
                    color: isSelected ? '#FFF' : textColor,
                    fontWeight: isSelected ? 'bold' : 'normal'
                }}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            animationType="none"
            transparent={true}
            onRequestClose={handleDismiss}
            statusBarTranslucent
        >
            <View className="flex-1">
                {/* Backdrop */}
                <Animated.View
                    className="absolute inset-0 bg-black"
                    style={{
                        opacity: backdropOpacityProp,
                    }}
                >
                    <TouchableOpacity
                        className="flex-1"
                        activeOpacity={1}
                        onPress={handleDismiss}
                    />
                </Animated.View>

                {/* Bottom Sheet Container */}
                <Animated.View
                    className="absolute bottom-0 left-0 right-0"
                    style={{
                        transform: [{ translateY }],
                        backgroundColor: isDark ? '#1E2028' : '#FFF',
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        maxHeight: SCREEN_HEIGHT * 0.8,
                    }}
                >
                    {/* Drag Handle & Intercept Area */}
                    <View
                        className="items-center pt-2 pb-1"
                        {...panResponder.panHandlers}
                    >
                        <View
                            className="w-12 h-1 rounded-full"
                            style={{ backgroundColor: isDark ? '#3D4048' : '#D1D5DB' }}
                        />

                        {/* Header Area: Title Left, Icons Right */}
                        <View className="w-full flex-row justify-between items-center px-5 py-3 mt-1">
                            <Text className="text-lg font-bold" style={{ color: textColor }}>Filters</Text>

                            <View className="flex-row items-center gap-x-2">
                                <TouchableOpacity
                                    onPress={handleReset}
                                    className="p-2 rounded-full"
                                    activeOpacity={0.6}
                                >
                                    <Icon name="reload-outline" size={20} color={textColor} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleApply}
                                    className="p-2 -mr-2 rounded-full"
                                    activeOpacity={0.6}
                                >
                                    <Icon name="checkmark" size={26} color={accentColor} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <View className="h-[0.5px] w-full" style={{ backgroundColor: isDark ? '#2D3038' : '#F3F4F6' }} />

                    <ScrollView className="px-4" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                        {/* Price Range */}
                        {renderSectionTitle('Price Range (₹)')}
                        <View className="flex-row items-center justify-between">
                            <TextInput
                                className="flex-1 h-11 rounded-lg px-3 border text-sm"
                                style={{
                                    backgroundColor: isDark ? '#040404' : '#F9FAFB',
                                    borderColor: isDark ? '#2D3038' : '#E5E7EB',
                                    color: textColor,
                                    paddingVertical: 0, // Prevent vertical cut-off
                                }}
                                placeholder="Min"
                                placeholderTextColor={placeholderColor}
                                keyboardType="numeric"
                                value={minPrice}
                                onChangeText={setMinPrice}
                            />
                            <Text className="mx-3 font-bold text-xs" style={{ color: placeholderColor }}>to</Text>
                            <TextInput
                                className="flex-1 h-11 rounded-lg px-3 border text-sm"
                                style={{
                                    backgroundColor: isDark ? '#040404' : '#F9FAFB',
                                    borderColor: isDark ? '#2D3038' : '#E5E7EB',
                                    color: textColor,
                                    paddingVertical: 0, // Prevent vertical cut-off
                                }}
                                placeholder="Max"
                                placeholderTextColor={placeholderColor}
                                keyboardType="numeric"
                                value={maxPrice}
                                onChangeText={setMaxPrice}
                            />
                        </View>

                        {/* Customer Ratings */}
                        {renderSectionTitle('Customer Ratings')}
                        <View className="flex-row flex-wrap">
                            {[4, 3, 2].map((rating) => (
                                <View key={rating} className="mb-2">
                                    {renderPill(
                                        `${rating}+ Stars`,
                                        minRating === rating,
                                        () => setMinRating(minRating === rating ? undefined : rating)
                                    )}
                                </View>
                            ))}
                        </View>

                        {/* Discount */}
                        {renderSectionTitle('Discount')}
                        <View className="flex-row flex-wrap">
                            {[10, 20, 30, 50].map((discount) => (
                                <View key={discount} className="mb-2">
                                    {renderPill(
                                        `${discount}% +`,
                                        minDiscount === discount,
                                        () => setMinDiscount(minDiscount === discount ? undefined : discount)
                                    )}
                                </View>
                            ))}
                        </View>

                        {/* Other */}
                        <View className="flex-row justify-between items-center py-2 mt-2">
                            <Text className="text-sm font-bold" style={{ color: textColor }}>Trending Products</Text>
                            <Switch
                                value={isTrending}
                                onValueChange={setIsTrending}
                                trackColor={{ false: '#767577', true: accentColor + '80' }} // adding alpha
                                thumbColor={isTrending ? accentColor : '#f4f3f4'}
                                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                            />
                        </View>

                    </ScrollView>


                </Animated.View>
            </View>
        </Modal>
    );
};

export default FilterModal;
