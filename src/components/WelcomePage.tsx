import React, { useEffect, useMemo, useRef } from "react";
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
  type ViewStyle,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import LottieView from "lottie-react-native";
import Icon from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import useThemePalette from "../hooks/useThemePalette";
import type { RootStackParamList } from "../../AppNavigator";

type WelcomePageProps = {
  navigation: NavigationProp<RootStackParamList>;
};

const { width } = Dimensions.get("window");
const AnimatedView = Animated.createAnimatedComponent(View);

const WelcomePage: React.FC<WelcomePageProps> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();
  const {
    isDark,
    surfaceColor,
    statusBarBackground,
    statusBarStyle,
    ctaGradient,
    serifFontFamily,
  } = useThemePalette();

  useEffect(() => {
    const introAnimation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    introAnimation.start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();

    return () => {
      introAnimation.stop();
      pulseLoop.stop();
    };
  }, [fadeAnim, scaleAnim, slideAnim, pulseAnim]);

  const animatedContent = useMemo(
    () =>
      ({
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
      }) as Animated.WithAnimatedObject<ViewStyle>,
    [fadeAnim, scaleAnim, slideAnim]
  );

  const lottieStyle: ViewStyle = {
    width: width * 0.7,
    height: width * 0.7,
  };

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      className="flex-1 bg-white dark:bg-[#181A20]"
      style={{ paddingTop: insets.top, backgroundColor: surfaceColor }}
    >
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={statusBarBackground}
        translucent={Platform.OS === "android"}
      />

      <AnimatedView
        className="flex-1 items-center justify-center px-6 pt-10"
        style={animatedContent}
      >
        <View className="items-center" style={lottieStyle}>
          <LottieView
            source={require("../assets/animations/Delivery.json")}
            style={[lottieStyle, { backgroundColor: "transparent" }]}
            autoPlay
            loop
            key={isDark ? "delivery-dark" : "delivery-light"}
          />
        </View>

        <View className="mt-10 w-full items-center space-y-4 px-4">
          <Text
            className="text-center mb-5 text-[26px] font-extrabold text-[#181A20] dark:text-white"
            style={{ fontFamily: serifFontFamily }}
          >
            Welcome to MediCare+
          </Text>
          <Text
            className="text-center text-base leading-6 text-slate-600 dark:text-slate-300"
            style={{ fontFamily: serifFontFamily }}
          >
            Your health is our priority. Discover a seamless experience for all your healthcare needs.
          </Text>
        </View>

      </AnimatedView>

      <AnimatedView
        className="w-full px-8 py-2 mt-12"
        style={{ transform: [{ scale: pulseAnim }] }}
      >
        <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate("Start")}>
          <LinearGradient
            colors={ctaGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 9999,
              paddingVertical: 16,
              paddingHorizontal: 12,
            }}
          >
            <View className="w-full flex-row items-center justify-center">
              <Text
                className="text-base font-semibold uppercase tracking-[2px] text-white"
                style={{ fontFamily: serifFontFamily }}
              >
                Start Shopping Now
              </Text>
              <View
                className="ml-3 h-6 w-6 items-center justify-center rounded-full"
              >
                <Icon name="arrow-forward" size={20} color="#FFF" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </AnimatedView>

      <View className="w-full items-center py-5">
        <Text className="text-xs text-slate-500 dark:text-slate-400">
          © 2023 MediCare+. All rights reserved
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default WelcomePage;
