import React, { useEffect, useRef, memo, useCallback, useMemo, useState } from 'react';
import { View, TouchableOpacity, Platform, StatusBar, Animated, Dimensions, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useThemePalette } from '../../../hooks/useThemePalette';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LOGO_LETTERS = ['M', 'E', 'D', 'I', 'C', 'A', 'R', 'E', '+'] as const;
const SEARCH_ICONS = ['magnify', 'text-search'] as const;

type RootStackParamList = { Home: undefined; CheckoutPage: undefined; Search: undefined; SignIn: undefined; SignUp: undefined; ForgotPassword: undefined; Profile: undefined; Notifications: undefined };

const COLORS = {
  gradient: { light: ['#FFFFFF', '#F3F4F6'] as readonly string[], dark: ['#000000', '#2A2D35'] as readonly string[] },
  text: { light: { primary: '#0e0e0eff', secondary: '#1F2937', icon: '#0e0e0eff' }, dark: { primary: '#cf7393ff', secondary: '#FFFFFF', icon: '#FFFFFF' } },
  iconBg: { light: '#E5E7EB', dark: '#3A3A3A' },
} as const;

const LogoLetter = memo<{ letter: string; index: number; translateY: Animated.Value; isDark: boolean }>(({ letter, index, translateY, isDark }) => {
  const colors = COLORS.text[isDark ? 'dark' : 'light'];
  return <Animated.Text style={{ transform: [{ translateY }], fontSize: SCREEN_WIDTH * 0.045, fontWeight: '700', fontFamily: Platform.select({ ios: 'System', android: 'Roboto' }), textTransform: 'uppercase', letterSpacing: 0.5, color: index < 4 ? colors.primary : colors.secondary }}>{letter}</Animated.Text>;
});

const HeaderScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isDark } = useThemePalette();
  const insets = useSafeAreaInsets();
  const [searchIconIndex, setSearchIconIndex] = useState(0);

  const logoAnimations = useRef(Array.from({ length: LOGO_LETTERS.length }, () => new Animated.Value(-100))).current;
  const leftLogoAnim = useRef(new Animated.Value(-50)).current;
  const rightIconsAnim = useRef(new Animated.Value(50)).current;

  const statusBarHeight = useMemo(() => Platform.select({ android: StatusBar.currentHeight || 24, ios: insets.top, default: 0 }), [insets.top]);
  const headerHeight = useMemo(() => statusBarHeight + 28, [statusBarHeight]);

  useEffect(() => {
    // Delay animation to allow Navigation transition to complete first
    // This removes "jank" on initial mount
    const timer = setTimeout(() => {
      const animations = [
        ...logoAnimations.map((anim, i) => Animated.timing(anim, { toValue: 0, duration: 400, delay: i * 80, useNativeDriver: true })), // Reduced delay between letters
        Animated.timing(leftLogoAnim, { toValue: 0, duration: 600, delay: 100, useNativeDriver: true }),
        Animated.timing(rightIconsAnim, { toValue: 0, duration: 600, delay: 200, useNativeDriver: true }),
      ];
      Animated.parallel(animations).start();
    }, 500); // 500ms delay for smoother entry

    return () => clearTimeout(timer);
  }, []); // Only run on mount (no dependenc array change re-run needed for start)

  useEffect(() => {
    const interval = setInterval(() => {
      setSearchIconIndex(prev => (prev + 1) % SEARCH_ICONS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchPress = useCallback(() => navigation.navigate('Search'), [navigation]);

  const gradientColors = useMemo(() => [...COLORS.gradient[isDark ? 'dark' : 'light']], [isDark]);
  const iconButtonBg = useMemo(() => COLORS.iconBg[isDark ? 'dark' : 'light'], [isDark]);
  const iconColor = useMemo(() => COLORS.text[isDark ? 'dark' : 'light'].icon, [isDark]);

  return (
    <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ paddingTop: statusBarHeight, height: headerHeight, minHeight: headerHeight, paddingHorizontal: 12, paddingVertical: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Animated.View style={{ transform: [{ translateX: leftLogoAnim }, { translateY: -4 }], justifyContent: 'center' }}>
        <Image source={{ uri: 'https://vucvdpamtrjkzmubwlts.supabase.co/storage/v1/object/public/users/user_2rQ1QHrJyxpmWMHhqhANzWMc64n/avatar.png' }} style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: isDark ? '#374151' : '#E5E7EB', transform: [{ translateY: -10 }] }} resizeMode="cover" accessibilityLabel="User profile" />
      </Animated.View>
      <View style={{ flex: 1, marginLeft: 8, justifyContent: 'center', alignItems: 'flex-start', transform: [{ translateY: -16 }] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {LOGO_LETTERS.map((letter, index) => <LogoLetter key={`logo-${index}`} letter={letter} index={index} translateY={logoAnimations[index]} isDark={isDark} />)}
        </View>
      </View>

      <Animated.View style={{ transform: [{ translateX: rightIconsAnim }, { translateY: -15 }], flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
        <TouchableOpacity activeOpacity={0.7} onPress={handleSearchPress} style={{ padding: 8, borderRadius: 20, backgroundColor: iconButtonBg, justifyContent: 'center', alignItems: 'center', width: 36, height: 36 }} accessibilityLabel="Search" accessibilityRole="button">
          <MaterialCommunityIcons name={SEARCH_ICONS[searchIconIndex]} size={20} color={iconColor} />
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
};

export default memo(HeaderScreen);