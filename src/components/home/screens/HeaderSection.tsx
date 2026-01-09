import React, { useEffect, useRef, memo, useCallback, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useThemePalette } from '../../../hooks/useThemePalette';

// Constants
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_BASE_HEIGHT = 28;
const LOGO_LETTERS = ['M', 'E', 'D', 'I', 'C', 'A', 'R', 'E', '+'] as const;

// Types
type LogoLetterType = typeof LOGO_LETTERS[number];

// Define your navigation types
type RootStackParamList = {
  Home: undefined;
  CheckoutPage: undefined;
  Search: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  Profile: undefined;
  Notifications: undefined;
  // Add other screens as needed
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Interface for LogoLetter component
interface LogoLetterProps {
  letter: LogoLetterType;
  index: number;
  translateY: Animated.Value;
  isDark: boolean;
}

// Gradient Colors - Matching app theme
const GRADIENT_COLORS = {
  light: ['#FFFFFF', '#F3F4F6'] as [string, string], // White to gray-100
  dark: ['#000000', '#2A2D35'] as [string, string], // Dark task bar to lighter dark
};

// Text Colors - Matching useThemePalette
const TEXT_COLORS = {
  light: {
    primary: '#0e0e0eff',
    secondary: '#1F2937',
    icon: '#0e0e0eff',
  },
  dark: {
    primary: '#cf7393ff',
    secondary: '#FFFFFF',
    icon: '#FFFFFF',
  },
} as const;

// Memoized Logo Letter Component
const LogoLetter = memo<LogoLetterProps>(({ letter, index, translateY, isDark }) => {
  const isPrimary = index < 4;
  const colors = TEXT_COLORS[isDark ? 'dark' : 'light'];

  const letterStyle = useMemo(() => ({
    transform: [{ translateY }],
    fontSize: SCREEN_WIDTH * 0.045,
    fontWeight: '700' as const,
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto' }),
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    color: isPrimary ? colors.primary : colors.secondary,
  }), [translateY, isPrimary, colors.primary, colors.secondary]);

  return <Animated.Text style={letterStyle}>{letter}</Animated.Text>;
});

LogoLetter.displayName = 'LogoLetter';

// Main Header Component
const HeaderScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { isDark } = useThemePalette();
  const insets = useSafeAreaInsets();

  // Create animated values
  const logoAnimations = useRef<Animated.Value[]>(
    Array.from({ length: LOGO_LETTERS.length }, () => new Animated.Value(-100))
  ).current;

  const leftLogoAnim = useRef(new Animated.Value(-50)).current;
  const rightIconsAnim = useRef(new Animated.Value(50)).current;

  // Animation cleanup ref
  const animationRefs = useRef<Animated.CompositeAnimation[]>([]);

  // Calculate header height
  const statusBarHeight = useMemo(() =>
    Platform.select({
      android: StatusBar.currentHeight || 24,
      ios: insets.top,
      default: 0,
    }),
    [insets.top]
  );

  const headerHeight = useMemo(() =>
    statusBarHeight + HEADER_BASE_HEIGHT,
    [statusBarHeight]
  );

  // Animation setup
  useEffect(() => {
    // Create letter animations
    const letterAnimations = logoAnimations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      })
    );

    // Create side animations
    const sideAnimations = [
      Animated.timing(leftLogoAnim, {
        toValue: 0,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(rightIconsAnim, {
        toValue: 0,
        duration: 800,
        delay: 400,
        useNativeDriver: true,
      }),
    ];

    // Combine all animations
    const allAnimations = [...letterAnimations, ...sideAnimations];
    animationRefs.current = allAnimations;

    // Start animations
    Animated.parallel(allAnimations).start();

    // Cleanup function
    return () => {
      animationRefs.current.forEach(anim => anim.stop());
      animationRefs.current = [];
    };
  }, []);

  // Navigation handlers
  const handleCartPress = useCallback(() => {
    navigation.navigate('CheckoutPage');
  }, [navigation]);

  const handleSearchPress = useCallback(() => {
    navigation.navigate('Search');
  }, [navigation]);



  // Memoized styles and values
  const gradientColors = useMemo(
    () => (isDark ? GRADIENT_COLORS.dark : GRADIENT_COLORS.light),
    [isDark]
  );

  const iconButtonBg = useMemo(
    () => (isDark ? '#3A3A3A' : '#E5E7EB'),
    [isDark]
  );

  const iconColor = useMemo(
    () => TEXT_COLORS[isDark ? 'dark' : 'light'].icon,
    [isDark]
  );

  const avatarSource = useMemo(
    () => ({
      uri: 'https://vucvdpamtrjkzmubwlts.supabase.co/storage/v1/object/public/users/user_2rQ1QHrJyxpmWMHhqhANzWMc64n/avatar.png',
    }),
    []
  );

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{
        paddingTop: statusBarHeight,
        height: headerHeight,
        minHeight: headerHeight,
        paddingHorizontal: 12,
        paddingVertical: 2,

        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Left Side Profile Avatar */}
      <Animated.View
        style={{
          transform: [{ translateX: leftLogoAnim }, { translateY: -4 }],
          justifyContent: 'center',
        }}
      >

        <Image
          source={avatarSource}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            borderWidth: 1.5,
            borderColor: isDark ? '#374151' : '#E5E7EB',
            transform: [{ translateY: -10 }],
          }}
          resizeMode="cover"
          accessibilityLabel="User profile"
        />

      </Animated.View>

      {/* Center Animated Logo */}
      <View
        style={{
          flex: 1,
          marginLeft: 8,
          justifyContent: 'center',
          alignItems: 'flex-start',
          transform: [{ translateY: -16 }],
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {LOGO_LETTERS.map((letter, index) => (
            <LogoLetter
              key={`logo-letter-${index}-${letter}`}
              letter={letter}
              index={index}
              translateY={logoAnimations[index]}
              isDark={isDark}
            />
          ))}
        </View>
      </View>

      {/* Right Side Icons */}
      <Animated.View
        style={{
          transform: [{ translateX: rightIconsAnim }, { translateY: -15 }],
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 10,
        }}
      >


        {/* Search Icon */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSearchPress}
          style={{
            padding: 8,
            borderRadius: 20,
            backgroundColor: iconButtonBg,
            justifyContent: 'center',
            alignItems: 'center',
            width: 36,
            height: 36,
          }}
          accessibilityLabel="Search"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={iconColor}
          />
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
};

// Performance optimization
export default memo(HeaderScreen);