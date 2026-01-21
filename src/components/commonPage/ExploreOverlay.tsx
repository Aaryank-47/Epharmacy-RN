import React, { useEffect, useRef } from 'react';
import { View, Animated, TouchableOpacity, Dimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

interface ExploreOverlayProps {
    onClose: () => void;
    onOpenAiChat: () => void;
    onOpenScanner: () => void;
}

const ExploreOverlay: React.FC<ExploreOverlayProps> = ({ onClose, onOpenAiChat, onOpenScanner }) => {
    const navigation = useNavigation();

    // Animation values
    const anim1 = useRef(new Animated.Value(0)).current;
    const anim2 = useRef(new Animated.Value(0)).current;
    const anim3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.stagger(100, [
            Animated.spring(anim1, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
            Animated.spring(anim2, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
            Animated.spring(anim3, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
        ]).start();
    }, [anim1, anim2, anim3]);

    const TAB_CENTER_X = width * 0.5;
    const BOTTOM_OFFSET = 70;

    // Fan-out positions (Arc)
    const renderFab = (
        anim: Animated.Value,
        offsetX: number,
        offsetY: number,
        icon: string,
        label: string,
        gradientColors: string[],
        onPress: () => void
    ) => {
        // Interpolate translations
        const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, offsetX] });
        const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [50, offsetY] });
        const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
        const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['90deg', '0deg'] });

        return (
            <Animated.View
                key={label}
                className="absolute items-center justify-center w-20 h-24 z-50 "
                style={{
                    left: TAB_CENTER_X - 40, // Center horizontally (w-20 / 2)
                    bottom: BOTTOM_OFFSET,
                    transform: [{ translateX }, { translateY }, { scale }],
                    opacity: anim,
                }}
            >
                <TouchableOpacity
                    activeOpacity={0.8}
                    className="items-center justify-center mb-2 shadow-lg shadow-black/30"
                    onPress={() => {
                        onPress();
                        onClose();
                    }}
                >
                    <Animated.View style={{ transform: [{ rotate }] }}>
                        <LinearGradient
                            colors={gradientColors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            className="w-14 h-14 items-center justify-center border border-white/20"
                            style={{ borderRadius: 100 }}
                        >
                            <MaterialCommunityIcons name={icon} size={28} color="#FFF" />
                        </LinearGradient>
                    </Animated.View>
                </TouchableOpacity>
                <Animated.Text
                    className="text-xs font-bold text-white text-center shadow-black/50"
                    style={{ textShadowRadius: 2, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 } }}
                >
                    {label}
                </Animated.Text>
            </Animated.View>
        );
    };

    return (
        <View className="absolute inset-0" pointerEvents="box-none">
            {/* Invisible closer area (no background here, handled by Tab.tsx overlay) */}
            <TouchableOpacity
                className="absolute inset-0"
                activeOpacity={1}
                onPress={onClose}
            />

            {/* Fab Buttons */}
            {/* Left Button - AI Chat */}
            {renderFab(anim1, -75, -20, 'robot-outline', 'Ask AI', ['#4F46E5', '#7C3AED'], onOpenAiChat)}

            {/* Center Button - Scanner (Higher) */}
            {renderFab(anim2, 0, -80, 'line-scan', 'Find Medicines', ['#059669', '#34D399'], onOpenScanner)}

            {/* Right Button - Offers */}
            {renderFab(anim3, 75, -20, 'gift-outline', 'Offers', ['#DC2626', '#F87171'], () => navigation.navigate('OfferBannerSection' as never))}
        </View>
    );
};

export default ExploreOverlay;
