import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, ScrollView, Switch, Animated, PanResponder, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    const insets = useSafeAreaInsets();

    // Local State
    const [minPrice, setMinPrice] = useState<string>('');
    const [maxPrice, setMaxPrice] = useState<string>('');
    const [minRating, setMinRating] = useState<number | undefined>(undefined);
    const [minDiscount, setMinDiscount] = useState<number | undefined>(undefined);
    const [isTrending, setIsTrending] = useState<boolean>(false);

    // Animation / Gestures
    const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.85; // Slightly taller
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    const backdropOpacityProp = translateY.interpolate({
        inputRange: [0, DRAWER_HEIGHT],
        outputRange: [0.6, 0], // Darker backdrop
        extrapolate: 'clamp',
    });

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && gestureState.dy > 5;
            },
            onPanResponderMove: (evt, gestureState) => {
                if (gestureState.dy > 0) translateY.setValue(gestureState.dy);
            },
            onPanResponderRelease: (evt, gestureState) => {
                if (gestureState.dy > 120 || (gestureState.vy > 0.5 && gestureState.dy > 0)) {
                    handleDismiss();
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                        friction: 8,
                        tension: 40,
                    }).start();
                }
            },
        })
    ).current;

    useEffect(() => {
        if (visible) {
            setMinPrice(initialFilters.minPrice ? initialFilters.minPrice.toString() : '');
            setMaxPrice(initialFilters.maxPrice ? initialFilters.maxPrice.toString() : '');
            setMinRating(initialFilters.minRating);
            setMinDiscount(initialFilters.minDiscount);
            setIsTrending(initialFilters.isTrending || false);

            Animated.spring(translateY, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }).start();
        } else {
            translateY.setValue(SCREEN_HEIGHT);
        }
    }, [visible, initialFilters, translateY]);

    const handleDismiss = () => {
        Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 250,
            useNativeDriver: true,
        }).start(() => onClose());
    };

    const handleApply = () => {
        onApply({
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
            minRating,
            minDiscount,
            isTrending
        });
        handleDismiss();
    };

    const handleReset = () => {
        setMinPrice('');
        setMaxPrice('');
        setMinRating(undefined);
        setMinDiscount(undefined);
        setIsTrending(false);
    };

    // --- Render Helpers ---

    const renderSectionHeader = (title: string, icon: string) => (
        <View className="flex-row items-center mb-4 mt-6">
            <View className={`w-8 h-8 rounded-full justify-center items-center mr-3 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <Icon name={icon} size={16} color={accentColor} />
            </View>
            <Text className="text-base font-bold" style={{ color: textColor }}>{title}</Text>
        </View>
    );

    const renderChip = (label: string, isSelected: boolean, onPress: () => void, subLabel?: string) => (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            className={`mr-3 mb-3 px-4 py-2.5 rounded-2xl border ${isSelected ? 'border-transparent' : 'border-gray-200 dark:border-gray-700'}`}
            style={{
                backgroundColor: isSelected ? accentColor : (isDark ? '#2D3038' : '#FFFFFF'),
                elevation: isSelected ? 4 : 0,
                shadowColor: accentColor,
                shadowOpacity: isSelected ? 0.3 : 0,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 }
            }}
        >
            <View className="flex-row items-center">
                <Text
                    className={`${isSelected ? 'font-bold' : 'font-medium'} text-sm`}
                    style={{ color: isSelected ? '#FFFFFF' : textColor }}
                >
                    {label}
                </Text>
                {subLabel && (
                    <Text className={`ml-1 text-xs ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                        {subLabel}
                    </Text>
                )}
            </View>
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
            <View className="flex-1 justify-end">
                {/* Backdrop */}
                <Animated.View
                    className="absolute inset-0 bg-black"
                    style={{ opacity: backdropOpacityProp }}
                >
                    <TouchableOpacity style={{ flex: 1 }} onPress={handleDismiss} activeOpacity={1} />
                </Animated.View>

                {/* Main Container */}
                <Animated.View
                    className="w-full rounded-t-[32px] overflow-hidden"
                    style={{
                        height: SCREEN_HEIGHT * 0.85,
                        transform: [{ translateY }],
                        backgroundColor: isDark ? '#181A20' : '#FFFFFF',
                    }}
                >
                    {/* Header */}
                    <View
                        className="items-center pb-2 pt-3 bg-transparent z-10"
                        {...panResponder.panHandlers}
                    >
                        {/* Drag Handle */}
                        <View className="w-12 h-1.5 rounded-full mb-2 bg-gray-300 dark:bg-gray-700 opacity-50" />

                        {/* Title Row */}
                        <View className="flex-row w-full justify-between items-center px-6 py-2">
                            <Text className="text-xl font-bold" style={{ color: textColor }}>Filters</Text>

                            <TouchableOpacity
                                onPress={handleDismiss}
                                className={`p-2 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
                            >
                                <Icon name="close" size={20} color={textColor} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="w-full h-[1px] bg-gray-100 dark:bg-gray-800" />

                    {/* Content Scroll */}
                    <ScrollView
                        className="flex-1 px-6"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
                    >
                        {/* Price Range Section */}
                        {renderSectionHeader('Price Range', 'cash-outline')}
                        <View className="flex-row items-center space-x-4">
                            <View className="flex-1">
                                <Text className="text-xs mb-2 ml-1 text-gray-500 font-medium">Minimum</Text>
                                <View
                                    className="flex-row items-center px-4 h-12 rounded-xl border bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                                >
                                    <Text className="text-gray-400 mr-1">₹</Text>
                                    <TextInput
                                        className="flex-1 font-semibold text-base"
                                        style={{ color: textColor }}
                                        placeholder="0"
                                        placeholderTextColor={placeholderColor}
                                        keyboardType="numeric"
                                        value={minPrice}
                                        onChangeText={setMinPrice}
                                    />
                                </View>
                            </View>
                            <View className="w-4 h-[2px] bg-gray-300 dark:bg-gray-700 mt-6" />
                            <View className="flex-1">
                                <Text className="text-xs mb-2 ml-1 text-gray-500 font-medium">Maximum</Text>
                                <View
                                    className="flex-row items-center px-4 h-12 rounded-xl border bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                                >
                                    <Text className="text-gray-400 mr-1">₹</Text>
                                    <TextInput
                                        className="flex-1 font-semibold text-base"
                                        style={{ color: textColor }}
                                        placeholder="10000"
                                        placeholderTextColor={placeholderColor}
                                        keyboardType="numeric"
                                        value={maxPrice}
                                        onChangeText={setMaxPrice}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Rating Section */}
                        {renderSectionHeader('Customer Rating', 'star-outline')}
                        <View className="flex-row flex-wrap">
                            {[4, 3, 2].map((rating) => (
                                renderChip(
                                    `${rating}+ Stars`,
                                    minRating === rating,
                                    () => setMinRating(minRating === rating ? undefined : rating)
                                )
                            ))}
                        </View>

                        {/* Discount Section */}
                        {renderSectionHeader('Discount', 'pricetag-outline')}
                        <View className="flex-row flex-wrap">
                            {[10, 20, 30, 50].map((discount) => (
                                renderChip(
                                    `${discount}% Off`,
                                    minDiscount === discount,
                                    () => setMinDiscount(minDiscount === discount ? undefined : discount),
                                    'or more'
                                )
                            ))}
                        </View>

                        {/* Trending Section */}
                        {renderSectionHeader('Availability', 'flame-outline')}
                        <View
                            className="flex-row justify-between items-center p-4 rounded-2xl border mb-6"
                            style={{
                                backgroundColor: isDark ? '#2D3038' : '#F9FAFB',
                                borderColor: isDark ? '#3D4048' : '#E5E7EB'
                            }}
                        >
                            <View className="flex-row items-center">
                                <View className={`w-10 h-10 rounded-full justify-center items-center mr-3 ${isDark ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
                                    <Icon name="trending-up" size={20} color="#A855F7" />
                                </View>
                                <View>
                                    <Text className="font-bold text-base" style={{ color: textColor }}>Trending Only</Text>
                                    <Text className="text-xs text-gray-500">Show only hot items</Text>
                                </View>
                            </View>
                            <Switch
                                value={isTrending}
                                onValueChange={setIsTrending}
                                trackColor={{ false: '#D1D5DB', true: accentColor + '80' }}
                                thumbColor={isTrending ? accentColor : '#F3F4F6'}
                            />
                        </View>
                    </ScrollView>

                    {/* Fixed Footer */}
                    <View
                        className="absolute bottom-0 left-0 right-0 px-5 border-t"
                        style={{
                            backgroundColor: isDark ? '#181A20' : '#FFFFFF',
                            borderColor: isDark ? '#2D3038' : '#F3F4F6',
                            paddingBottom: Math.max(insets.bottom + 10, 20),
                            paddingTop: 16
                        }}
                    >
                        <View className="flex-row gap-x-4">
                            {/* Reset Button */}
                            <TouchableOpacity
                                onPress={handleReset}
                                activeOpacity={0.7}
                                className="flex-1 py-4 rounded-2xl items-center justify-center border"
                                style={{
                                    borderColor: isDark ? '#2D3038' : '#E5E7EB',
                                    backgroundColor: isDark ? '#262933' : '#F9FAFB'
                                }}
                            >
                                <Text className="font-bold text-base" style={{ color: textColor }}>Reset</Text>
                            </TouchableOpacity>

                            {/* Apply Button */}
                            <TouchableOpacity
                                onPress={handleApply}
                                activeOpacity={0.8}
                                className="flex-[2] py-4 rounded-2xl items-center justify-center shadow-md"
                                style={{
                                    backgroundColor: accentColor,
                                    shadowColor: accentColor,
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.25,
                                    shadowRadius: 12,
                                    elevation: 8,
                                    borderCurve: 'continuous' // subtle iOS curve
                                }}
                            >
                                <Text className="text-white font-extrabold text-lg tracking-wider">Apply Filters</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

export default FilterModal;
