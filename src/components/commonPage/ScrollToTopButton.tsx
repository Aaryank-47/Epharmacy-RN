import React, { useEffect, useRef, useState } from 'react';
import { Animated, TouchableOpacity, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface ScrollToTopButtonProps {
  scrollY: Animated.Value;
  onPress: () => void;
  threshold?: number;
  style?: ViewStyle;
}

const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({
  scrollY,
  onPress,
  threshold = 200, // Lowered threshold for easier testing
  style,
}) => {
  const [showButton, setShowButton] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);

  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }) => {
      const currentY = value;
      const isScrollingUp = currentY < lastScrollY.current;

      // Show if scrolled down more than threshold AND scrolling UP
      // Hide if scrolling DOWN or near top
      if (currentY > threshold && isScrollingUp) {
        setShowButton(true);
      } else if (currentY <= threshold || !isScrollingUp) {
        setShowButton(false);
      }

      lastScrollY.current = currentY;
    });

    return () => {
      scrollY.removeListener(listenerId);
    };
  }, [scrollY, threshold]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: showButton ? 1 : 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [showButton, fadeAnim]);

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: 80, // Explicitly set bottom distance
          left: 0,
          right: 0,
          alignItems: 'center', // Center horizontally
          zIndex: 1000,
          opacity: fadeAnim,
        },
        style,
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg elevation-5 border border-gray-100 dark:border-gray-700"
        disabled={!showButton}
      >
        <Icon name="arrow-up" size={24} color="#10B981" />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default ScrollToTopButton;
