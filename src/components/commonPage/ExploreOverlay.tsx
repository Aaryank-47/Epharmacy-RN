import React, { useEffect, useRef } from 'react';
import { View, Animated, TouchableOpacity, Dimensions, Text } from 'react-native';
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
        // Entry animation
        Animated.stagger(80, [
            Animated.spring(anim1, {
                toValue: 1,
                friction: 6,
                tension: 50,
                useNativeDriver: true
            }),
            Animated.spring(anim2, {
                toValue: 1,
                friction: 6,
                tension: 50,
                useNativeDriver: true
            }),
            Animated.spring(anim3, {
                toValue: 1,
                friction: 6,
                tension: 50,
                useNativeDriver: true
            }),
        ]).start();
    }, [anim1, anim2, anim3]);

    const TAB_CENTER_X = width * 0.5;
    const BOTTOM_OFFSET = 80;

    // Improved FAB renderer with glassmorphism
    const renderFab = (
        anim: Animated.Value,
        offsetX: number,
        offsetY: number,
        icon: string,
        label: string,
        gradientColors: string[],
        onPress: () => void,
        iconColor: string = '#FFFFFF'
    ) => {
        const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, offsetX] });
        const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [40, offsetY] });
        const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
        const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '0deg'] });

        return (
            <Animated.View
                key={label}
                style={{
                    position: 'absolute',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 90,
                    height: 110,
                    zIndex: 50,
                    left: TAB_CENTER_X - 45,
                    bottom: BOTTOM_OFFSET,
                    transform: [{ translateX }, { translateY }, { scale }],
                    opacity: anim,
                }}
            >
                <TouchableOpacity
                    activeOpacity={0.7}
                    style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 8,
                        borderColor: "#fff",
                        borderWidth: 1,
                        borderRadius: 50
                    }}
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
                            style={{
                                width: 54,
                                height: 54,
                                borderRadius: 32,
                                alignItems: 'center',
                                justifyContent: 'center',

                            }}
                        >
                            <MaterialCommunityIcons name={icon} size={28} color={iconColor} />
                        </LinearGradient>
                    </Animated.View>
                </TouchableOpacity>
                <Text
                    style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: '#FFFFFF',
                        textAlign: 'center',
                        textShadowRadius: 4,
                        textShadowColor: 'rgba(0,0,0,0.8)',
                        textShadowOffset: { width: 0, height: 2 },
                        letterSpacing: 0.5,
                    }}
                >
                    {label}
                </Text>
            </Animated.View>
        );
    };

    return (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="box-none">
            {/* Invisible closer area */}
            <TouchableOpacity
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                activeOpacity={1}
                onPress={onClose}
            />

            {/* FAB Buttons with improved design */}

            {/* Left Button - AI Chat (Vibrant Blue-Purple) */}
            {renderFab(
                anim1,
                -80,
                -1,
                'robot-happy-outline',
                'AI Assistant',
                ['#000', '#000'],
                onOpenAiChat,
                '#FFF'
            )}

            {/* Center Button - Scanner (Vibrant Teal-Green) */}
            {renderFab(
                anim2,
                0,
                -80,
                'qrcode-scan',
                'Scan Medicine',
                ['#000', '#000'],
                onOpenScanner,
                '#FFF'
            )}

            {/* Right Button - Offers (Vibrant Orange-Pink) */}
            {renderFab(
                anim3,
                80,
                -1,
                'gift-outline',
                'Hot Offers',
                ['#000', '#000'],
                () => navigation.navigate('OfferBannerSection' as never),
                '#FFF'
            )}
        </View>
    );
};

export default ExploreOverlay;
