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
  Image,
  type ImageStyle,
  type ViewStyle,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import LottieView from "lottie-react-native";
import type { RootStackParamList } from "../../AppNavigator";
import useThemePalette from "../hooks/useThemePalette";

export const getIntroText = (): string => "Your trusted online pharmacy for all your health needs";

export const getLoadingDelay = (networkSpeed: "slow" | "fast"): number => (networkSpeed === "slow" ? 3000 : 1500);

export const hasCompletedOnboarding = (storageValue: string | null): boolean => storageValue === "completed";

type StartPageProps = {
  navigation: NavigationProp<RootStackParamList, "Start">;
};

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const AnimatedView = Animated.createAnimatedComponent(View);

const StartPage: React.FC<StartPageProps> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(50)).current;
  const titleFadeAnim = useRef(new Animated.Value(0)).current;
  const titleTranslateYAnim = useRef(new Animated.Value(20)).current;
  const insets = useSafeAreaInsets();
  const {
    isDark,
    surfaceColor,
    statusBarBackground,
    statusBarStyle,
    ctaGradient,
    serifFontFamily,
  } = useThemePalette();
  const compactTopInset = Math.max(insets.top - 24, 0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 1500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(titleFadeAnim, {
        toValue: 1,
        duration: 1000,
        delay: 500,
        useNativeDriver: true,
      }),
      Animated.timing(titleTranslateYAnim, {
        toValue: 0,
        duration: 1000,
        delay: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, titleFadeAnim, titleTranslateYAnim, translateYAnim]);

  const heroImageStyle: ImageStyle = useMemo(
    () => ({
      width: screenWidth * 0.85,
      height: screenHeight * 0.32,
      borderRadius: 30,
    }),
    []
  );

  const heroAnimatedStyle = useMemo(
    () =>
      ({
        ...heroImageStyle,
        alignSelf: "center",
        marginTop: -4,
        opacity: fadeAnim,
        transform: [{ translateY: translateYAnim }],
      }) as Animated.WithAnimatedObject<ImageStyle>,
    [fadeAnim, heroImageStyle, translateYAnim]
  );

  const iconColor = isDark ? "#FFFFFF" : "#181A20";
  const gradientColors = isDark ? ['#000000', '#2A2D35'] : ['#FFFFFF', '#F3F4F6'];

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView
        edges={["top", "bottom"]}
        className="flex-1"
        style={{ paddingTop: 0 }}
      >
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor="transparent"
          translucent={true}
        />

        <View className="flex-1 w-full px-6 pt-0">
          <View className="w-full flex-row items-center justify-between pt-0">
            <TouchableOpacity
              activeOpacity={0.7}
              className="h-11 w-11 items-center justify-center rounded-full border border-slate-200 dark:border-white/10 mt-[-10px]"
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={22} color={iconColor} />
            </TouchableOpacity>

            <View className="w-11" />
          </View>

          <AnimatedView style={[heroAnimatedStyle, { backgroundColor: 'transparent', overflow: 'hidden' }]}>
            {isDark ? (
              // Dark mode: Show registration.png image
              <Image
                source={require("../assets/images/registration.png")}
                resizeMode="contain"
                style={{
                  width: screenWidth * 0.85,
                  height: screenHeight * 0.32,
                }}
              />
            ) : (
              // Light mode: Show Lottie Animation
              <LottieView
                source={require("../assets/animations/3D Doctor Dancing.json")}
                autoPlay
                loop
                resizeMode="cover"
                style={{
                  width: screenWidth * 0.85,
                  height: screenHeight * 0.32,
                  backgroundColor: 'transparent',
                }}
              />
            )}
          </AnimatedView>

          <AnimatedView
            className="mt-6 items-center space-y-4"
            style={{ opacity: titleFadeAnim, transform: [{ translateY: titleTranslateYAnim }] }}
          >
            <Text
              className="text-center text-[26px] font-extrabold text-[#1e2027] dark:text-white"
              style={{ fontFamily: serifFontFamily }}
            >
              MediCare+ Digital Pharmacy
            </Text>
            <Text
              className="text-center text-base leading-6 text-slate-600 dark:text-slate-300 mt-4"
              style={{ fontFamily: serifFontFamily }}
            >
              Get authentic medicines delivered to your doorstep. Upload prescriptions, consult licensed pharmacists,
              track orders in real-time, and manage your family's health with complete privacy and security.
            </Text>
          </AnimatedView>

          <AnimatedView className="mt-8" style={{ opacity: fadeAnim }}>
            <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate("SignIn")}>
              <LinearGradient
                colors={ctaGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 9999,
                  paddingVertical: 16,
                }}
              >
                <Text
                  className="text-center text-base font-semibold uppercase tracking-[2px] text-white"
                  style={{ fontFamily: serifFontFamily }}
                >
                  Order Medicines Now
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              className="mt-4 flex-row items-center justify-center"

            >
              <View
                className="mr-3 rounded-full p-2 bg-slate-100 dark:bg-white/10"
              >
                <Icon name="search" size={18} color={isDark ? "#FFFFFF" : "#181A20"} />
              </View>
              <Text
                className="text-sm font-semibold text-slate-600 dark:text-slate-300"
                style={{ fontFamily: serifFontFamily }}
              >
                Search for medicines
              </Text>
            </TouchableOpacity>
          </AnimatedView>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default React.memo(StartPage);
