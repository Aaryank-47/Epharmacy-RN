import React, { useEffect, useRef } from 'react';
import { View, Animated, TouchableOpacity, Dimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

interface ShareOverlayProps {
    onClose: () => void;
    onShareWhatsapp: () => void;
    onShareInsta: () => void;
    onShareFB: () => void;
    onShareX: () => void;
    onShareTelegram: () => void;
}

const ShareOverlay: React.FC<ShareOverlayProps> = ({ onClose, onShareWhatsapp, onShareInsta, onShareFB, onShareTelegram,onShareX }) => {

    // Animation values
    const anim1 = useRef(new Animated.Value(0)).current;
    const anim2 = useRef(new Animated.Value(0)).current;
    const anim3 = useRef(new Animated.Value(0)).current;
    const anim4 = useRef(new Animated.Value(0)).current;
    const anim5 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.stagger(60, [
            Animated.spring(anim1, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
            Animated.spring(anim2, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
            Animated.spring(anim3, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
            Animated.spring(anim4, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
            Animated.spring(anim5, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
        ]).start();
    }, [anim1, anim2, anim3, anim4, anim5]);

    const { width, height } = Dimensions.get('window');

    // Anchor point: Share Icon position (Right side, lowered further)
    const ANCHOR_X = width - 45;
    const ANCHOR_Y = height * 0.48; // Moved further down

    const renderFab = (
        anim: Animated.Value,
        offsetX: number,
        offsetY: number,
        icon: string,
        label: string,
        gradientColors: string[],
        onPress: () => void
    ) => {
        // Start from 0,0 (Anchor) and move to offset
        const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, offsetX] });
        const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, offsetY] });
        const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
        const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }); // Spin effect

        return (
            <Animated.View
                key={label}
                className="absolute items-center justify-center w-20 h-24 z-50"
                style={{
                    left: ANCHOR_X - 10,
                    top: ANCHOR_Y - 12,
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
                <Animated.Text className="text-xs font-bold text-white text-center shadow-black/50" style={{ textShadowRadius: 2, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 } }}>
                    {label}
                </Animated.Text>
            </Animated.View>
        );
    };

    return (
        <View className="absolute inset-0" pointerEvents="box-none">
            <TouchableOpacity className="absolute inset-0" activeOpacity={1} onPress={onClose} />

            {/* Left Arc Fan Out - 5 Icons Semi-Circle */}
            {/* Top-Left (High) */}
            {renderFab(anim1, -60, -140, 'whatsapp', 'WhatsApp', ['#25D366', '#128C7E'], onShareWhatsapp)}

            {/* Mid-Top Left */}
            {renderFab(anim2, -120, -90, 'instagram', 'Instagram', ['#833AB4', '#E1306C', '#FDB500'], onShareInsta)}

            {/* Middle Left */}
            {renderFab(anim3, -150, 0, 'facebook', 'Facebook', ['#1877F2', '#0e52b5'], onShareFB)}

            {/* Mid-Bottom Left - Telegram */}
            {renderFab(anim4, -120, 90, 'send', 'Telegram', ['#229ED9', '#0088cc'], onShareTelegram)}

            {/* Bottom-Left (Low) - More comes last */}
            {renderFab(anim5, -60, 140, 'pulse', 'More', ['#000', '#333333'], onShareX)}
        </View>
    );
};

export default ShareOverlay;
