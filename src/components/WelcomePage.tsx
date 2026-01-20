import React, { useEffect, useRef, useState, useCallback } from "react";
import type { NavigationProp } from "@react-navigation/native";
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  FlatList,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import useThemePalette from "../hooks/useThemePalette";
import type { RootStackParamList } from "../../AppNavigator";

type WelcomePageProps = {
  navigation: NavigationProp<RootStackParamList>;
};

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width;
const AnimatedView = Animated.createAnimatedComponent(View);

const DATA = [
  {
    id: '1',
    title: "Welcome to MediCare+",
    description: "Get your medicines delivered quickly and safely to your doorstep, because timely care makes all the difference to your health.",
    icon: "shield-checkmark-outline"
  },
  {
    id: '2',
    title: "Fast Delivery",
    description: "Your health is our top priority, offering you a smooth, reliable, and stress-free experience for all your healthcare needs.",
    icon: "rocket-outline"
  },
  {
    id: '3',
    title: "Expert Consultation",
    description: "Connect with experienced and trusted doctors for expert medical guidance, so quality healthcare is always within your reach.",
    icon: "people-outline"
  }
];

const CAROUSEL_DATA = [...DATA, { ...DATA[0], id: 'clone' }];
const SCROLL_DURATION = 3000;

const WelcomePage: React.FC<WelcomePageProps> = ({ navigation }) => {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const isDragging = useRef(false);
  const insets = useSafeAreaInsets();

  const { surfaceColor, statusBarBackground, statusBarStyle, ctaGradient, serifFontFamily, isDark } = useThemePalette();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Intro animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Auto-scroll with progress
  useEffect(() => {
    if (index === CAROUSEL_DATA.length - 1) {
      // At clone - snap back after animation
      const timer = setTimeout(() => {
        listRef.current?.scrollToIndex({ index: 0, animated: false });
        setIndex(0);
      }, 500);
      return () => clearTimeout(timer);
    }

    if (isDragging.current) return;

    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: SCROLL_DURATION,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !isDragging.current && index < CAROUSEL_DATA.length - 1) {
        listRef.current?.scrollToIndex({ index: index + 1, animated: true });
        setIndex(index + 1);
      }
    });

    return () => progress.stopAnimation();
  }, [index]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]?.index !== undefined) {
      setIndex(viewableItems[0].index);
    }
  }).current;

  const onScrollBeginDrag = useCallback(() => {
    isDragging.current = true;
    progress.stopAnimation();
  }, []);

  const onScrollEndDrag = useCallback(() => {
    isDragging.current = false;
  }, []);

  const getItemLayout = useCallback((_: any, i: number) => ({
    length: ITEM_WIDTH,
    offset: ITEM_WIDTH * i,
    index: i,
  }), []);

  const renderItem = useCallback(({ item }: any) => (
    <View style={{ width: ITEM_WIDTH, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 20 }}>
      {/* Professional Icon */}
      <View 
        className="mb-6 rounded-full p-5"
        style={{ 
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          borderWidth: 2,
          borderColor: isDark ? '#3B82F6' : '#10B981'
        }}
      >
        <Icon 
          name={item.icon} 
          size={56} 
          color={isDark ? '#FFFFFF' : '#181A20'} 
        />
      </View>

      <Text className="text-center mb-5 text-[26px] font-extrabold text-[#181A20] dark:text-white" style={{ fontFamily: serifFontFamily }}>
        {item.title}
      </Text>
      <Text className="text-center text-base leading-6 text-slate-600 dark:text-slate-300" style={{ fontFamily: serifFontFamily }}>
        {item.description}
      </Text>
    </View>
  ), [serifFontFamily, isDark]);

  const visualIndex = index === CAROUSEL_DATA.length - 1 ? 0 : index;

  const gradientColors = isDark ? ['#000000', '#2A2D35'] : ['#FFFFFF', '#F3F4F6'];

  return (
    <LinearGradient 
      colors={gradientColors} 
      start={{ x: 0, y: 0 }} 
      end={{ x: 0, y: 1 }} 
      style={{ flex: 1 }}
    >
      <SafeAreaView edges={["top", "bottom"]} className="flex-1" style={{ paddingTop: 0 }}>
        <StatusBar 
          barStyle={isDark ? "light-content" : "dark-content"} 
          backgroundColor="transparent" 
          translucent={true} 
        />

        <AnimatedView className="flex-1 items-center justify-center pt-10" style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
          <View style={{ height: 80 }} />

        <View className="w-full" style={{ flex: 1, maxHeight: 450 }}>
          <FlatList
            ref={listRef}
            data={CAROUSEL_DATA}
            renderItem={renderItem}
            keyExtractor={(item, i) => `${item.id}-${i}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            onScrollBeginDrag={onScrollBeginDrag}
            onScrollEndDrag={onScrollEndDrag}
            getItemLayout={getItemLayout}
            scrollEventThrottle={16}
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            windowSize={5}
            removeClippedSubviews
            decelerationRate="fast"
            snapToInterval={ITEM_WIDTH}
            snapToAlignment="center"
          />

          <View className="flex-row justify-center mt-10 items-center" style={{ height: 12 }}>
            {DATA.map((_, i) => {
              const isActive = visualIndex === i;
              return (
                <View
                  key={i}
                  style={{
                    width: isActive ? 60 : 12,
                    height: 4,
                    borderRadius: 4,
                    backgroundColor: isActive ? '#E5E7EB' : '#D1D5DB',
                    marginHorizontal: 6,
                    overflow: 'hidden',
                  }}
                >
                  {isActive && (
                    <Animated.View
                      style={{
                        height: '100%',
                        backgroundColor: '#10B981',
                        width: progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%']
                        })
                      }}
                    />
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </AnimatedView>

      <AnimatedView className="w-full px-8 py-2 mt-12" style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate("Start")}>
          <LinearGradient colors={ctaGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 9999, paddingVertical: 16, paddingHorizontal: 12 }}>
            <View className="w-full flex-row items-center justify-center">
              <Text className="text-base font-semibold uppercase tracking-[2px] text-white" style={{ fontFamily: serifFontFamily }}>
                Start Shopping Now
              </Text>
              <View className="ml-3 h-6 w-6 items-center justify-center rounded-full">
                <Icon name="arrow-forward" size={20} color="#FFF" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </AnimatedView>

      <View className="w-full items-center py-5">
        <Text className="text-xs text-slate-500 dark:text-slate-400">
          © 2023 MediCare+. All rights reserved Velcart
        </Text>
      </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default React.memo(WelcomePage);
