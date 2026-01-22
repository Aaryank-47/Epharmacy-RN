import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface RotatingCompassIconProps {
    isActive: boolean;
    color: string;
    size: number;
}

const RotatingCompassIcon: React.FC<RotatingCompassIconProps> = ({ isActive, color, size }) => {
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Continuous rotation animation
        const rotation = Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 3000, // 3 seconds for one full rotation
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );

        rotation.start();

        return () => {
            rotation.stop();
        };
    }, [rotateAnim]);

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Animated.View style={{ transform: [{ rotate }] }}>
            <Icon
                name={isActive ? 'compass' : 'compass-outline'}
                size={size}
                color={color}
            />
        </Animated.View>
    );
};

export default RotatingCompassIcon;
