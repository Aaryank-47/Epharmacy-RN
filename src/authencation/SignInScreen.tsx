import React, { useCallback, useEffect, useRef, useState, memo } from 'react';
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import type { NavigationProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useMutation } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

import type { RootStackParamList } from '../../AppNavigator';
import { loginRequest, googleLoginRequest } from '../api/authApi';
import type { LoginRequestPayload } from '../api/types';
import { toHumanReadableError, mapApiError } from '../utils/errorHandler';
import useThemePalette from '../hooks/useThemePalette';
import { useAuth } from '../context/AuthContext';


const INPUT_HEIGHT = 56;

// ============================================================================
// TYPES
// ============================================================================
interface SignInScreenProps {
  navigation: NavigationProp<RootStackParamList, 'SignIn'>;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const Header = memo(({ navigation, isDark }: { navigation: any; isDark: boolean }) => (
  <View className="flex-row items-center justify-between pt-0">
    <TouchableOpacity
      activeOpacity={0.7}
      className="h-11 w-11 items-center justify-center rounded-full border border-slate-200 dark:border-white/10 mt-[-10px]"
      onPress={() => navigation.goBack()}
    >
      <MaterialCommunityIcons name="arrow-left" size={22} color={isDark ? '#FFFFFF' : '#111827'} />
    </TouchableOpacity>
    <View className="w-12" />
  </View>
));

const WelcomeSection = memo(({ theme }: { theme: any }) => (
  <View className="items-center pt-0">
    <Text
      className="mt-28 text-center text-3xl font-extrabold text-[#111827] dark:text-white"
      style={{ fontFamily: theme.serifFontFamily }}
      numberOfLines={1} adjustsFontSizeToFit
    >
      Welcome back to MediCare+
    </Text>
    <Text
      className="mx-2 mt-3 text-center text-base leading-6 text-slate-500 dark:text-slate-300"
      style={{ fontFamily: theme.serifFontFamily }}
    >
      Sign in to manage prescriptions, consult pharmacists, and track real-time deliveries.
    </Text>
  </View>
));

const SocialLogin = memo(({ isGoogleSigningIn, onGoogle }: any) => (
  <View className="mt-8 flex-row justify-center gap-4">
    <TouchableOpacity
      activeOpacity={0.9}
      disabled={isGoogleSigningIn}
      onPress={onGoogle}
      className="h-14 w-14 items-center justify-center rounded-full border border-slate-200 dark:border-white/20 bg-white dark:bg-white/5"
    >
      {isGoogleSigningIn ? <ActivityIndicator color="#DB4437" /> : <MaterialCommunityIcons name="google" size={28} color="#DB4437" />}
    </TouchableOpacity>
    <TouchableOpacity activeOpacity={0.9} className="h-14 w-14 items-center justify-center rounded-full border border-slate-200 dark:border-white/20 bg-white dark:bg-white/5">
      <MaterialCommunityIcons name="facebook" size={32} color="#1877F2" />
    </TouchableOpacity>
    <TouchableOpacity activeOpacity={0.9} className="h-14 w-14 items-center justify-center rounded-full border border-slate-200 dark:border-white/20 bg-white dark:bg-white/5">
      <MaterialCommunityIcons name="account-check" size={28} color="green" />
    </TouchableOpacity>
  </View>
));

const LoginForm = memo(({
  email, setEmail, password, setPassword,
  showPassword, setShowPassword,
  onSubmit, loading, error, formErrors,
  theme, pulseAnim, navigation,
  setKeyboardVisible
}: any) => {
  const buttonScaleStyle = {
    transform: [{
      scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.02] })
    }]
  };

  return (
    <View className="p-4 w-full">
      <Text className="text-sm font-semibold uppercase text-slate-400 dark:text-slate-500" style={{ fontFamily: theme.serifFontFamily }}>
        Login details
      </Text>

      {/* Email */}
      <View className="mt-4 flex-row items-center rounded-full border border-slate-200 dark:border-white/20 bg-white/80 px-4 dark:bg-[#1a1d24]" style={{ minHeight: INPUT_HEIGHT }}>
        <MaterialCommunityIcons name="email-outline" size={20} color={theme.isDark ? '#fff' : '#1a1d24'} />
        <TextInput
          placeholder="Email address" placeholderTextColor="rgba(148,163,184,0.8)"
          autoCapitalize="none" keyboardType="email-address"
          className="ml-3 flex-1 text-base text-slate-900 dark:text-white"
          style={{ fontFamily: theme.serifFontFamily }}
          value={email} onChangeText={setEmail}
          onFocus={() => setKeyboardVisible(true)} onBlur={() => setKeyboardVisible(false)}
        />
      </View>
      {formErrors.email && <Text className="text-xs text-red-500 mt-1">{formErrors.email}</Text>}

      {/* Password */}
      <View className="mt-3 flex-row items-center rounded-full border border-slate-200 dark:border-white/20 bg-white/80 px-4 dark:bg-[#1a1d24]" style={{ minHeight: INPUT_HEIGHT }}>
        <MaterialCommunityIcons name="lock-outline" size={20} color={theme.isDark ? '#fff' : '#1a1d24'} />
        <TextInput
          placeholder="Password" placeholderTextColor="rgba(148,163,184,0.8)"
          secureTextEntry={!showPassword}
          className="ml-3 flex-1 text-base text-slate-900 dark:text-white"
          style={{ fontFamily: theme.serifFontFamily }}
          value={password} onChangeText={setPassword}
          onFocus={() => setKeyboardVisible(true)} onBlur={() => setKeyboardVisible(false)}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={20} color={theme.isDark ? '#fff' : '#1a1d24'} />
        </TouchableOpacity>
      </View>
      {formErrors.password && <Text className="text-xs text-red-500 mt-1">{formErrors.password}</Text>}

      {/* Error Message */}
      {error && (
        <View className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <Text className="text-sm font-semibold text-red-400" style={{ fontFamily: theme.serifFontFamily }}>{error}</Text>
        </View>
      )}

      {/* Submit Button */}
      <Animated.View style={[buttonScaleStyle, { marginTop: 8 }]}>
        <TouchableOpacity activeOpacity={0.9} disabled={loading} onPress={onSubmit}>
          <LinearGradient
            colors={theme.ctaGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ borderRadius: 9999, paddingVertical: 16, shadowOpacity: 0.25, shadowRadius: 25 }}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <View className="flex-row items-center justify-center gap-3">
                <MaterialCommunityIcons name="login" size={18} color="#fff" />
                <Text className="text-base font-semibold uppercase tracking-[3px] text-white" style={{ fontFamily: theme.serifFontFamily }}>
                  Access Pharmacy
                </Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} className="mt-3 self-end" onPress={() => navigation.navigate('ForgotPassword')}>
          <Text className="text-sm font-semibold text-slate-600 dark:text-slate-300 decoration-dotted mr-6" style={{ fontFamily: theme.serifFontFamily }}>
            Forgot password?
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SignInScreen: React.FC<SignInScreenProps> = ({ navigation }) => {
  const { login: persistSession } = useAuth();
  const theme = useThemePalette();
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  // Initialize Google Sign-In
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '933031359598-ofs7ps3rg2k8fpamhoa659f14uk08f5m.apps.googleusercontent.com',
      offlineAccess: true, forceCodeForRefreshToken: true,
    });
  }, []);

  // Animations
  useEffect(() => {
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 0, duration: 2200, useNativeDriver: true }),
    ]));
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Keyboard Listeners
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  // Mutations
  const loginMutation = useMutation({
    mutationFn: (payload: LoginRequestPayload) => loginRequest(payload),
    onSuccess: async (data) => await persistSession(data),
    onError: (error: any) => setLocalError(toHumanReadableError(mapApiError(error))),
  });

  const googleMutation = useMutation({
    mutationFn: (idToken: string) => googleLoginRequest(idToken),
    onSuccess: async (data) => { setIsGoogleSigningIn(false); await persistSession(data); },
    onError: (error: any) => {
      setIsGoogleSigningIn(false);
      setLocalError(toHumanReadableError(mapApiError(error)));
    },
  });

  // Handlers
  const handleSubmit = useCallback(async () => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email format';
    if (!password.trim()) errors.password = 'Password is required';
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters';

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const fcmToken = (await AsyncStorage.getItem('fcmToken')) ?? null;
    loginMutation.mutate({ email: email.trim().toLowerCase(), password, fcmToken });
  }, [email, password, loginMutation]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setIsGoogleSigningIn(true);
      const { data } = await GoogleSignin.signIn();
      if (data?.idToken) googleMutation.mutate(data.idToken);
      else throw new Error('No ID token');
    } catch (error: any) {
      setIsGoogleSigningIn(false);
      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        setLocalError('Google Sign-In failed');
      }
    }
  }, [googleMutation]);

  const errorMsg = localError || (loginMutation.error ? toHumanReadableError(loginMutation.error as any) : null);
  const isLoading = loginMutation.isPending || googleMutation.isPending || isGoogleSigningIn;
  const gradientColors = theme.isDark ? ['#000000', '#2A2D35'] : ['#FFFFFF', '#F3F4F6'];

  return (
    <LinearGradient 
      colors={gradientColors} 
      start={{ x: 0, y: 0 }} 
      end={{ x: 0, y: 1 }} 
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1" style={{ paddingTop: 0 }}>
        <StatusBar 
          backgroundColor="transparent" 
          barStyle={theme.isDark ? "light-content" : "dark-content"} 
          translucent={true} 
        />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1 }}>
              <View className="flex-1 px-6 pb-6 pt-0">
              <Header navigation={navigation} isDark={theme.isDark} />

              {!keyboardVisible && <WelcomeSection theme={theme} />}

              <View className="mt-2 w-full">
                <LoginForm
                  email={email} setEmail={setEmail}
                  password={password} setPassword={setPassword}
                  showPassword={showPassword} setShowPassword={setShowPassword}
                  onSubmit={handleSubmit} loading={loginMutation.isPending}
                  error={errorMsg} formErrors={formErrors}
                  theme={theme} pulseAnim={pulseAnim} navigation={navigation}
                  setKeyboardVisible={setKeyboardVisible}
                />

                <SocialLogin
                  isGoogleSigningIn={isLoading}
                  onGoogle={handleGoogleSignIn}
                  theme={theme}
                />

                <TouchableOpacity activeOpacity={0.8} className="mt-4 items-center" onPress={() => navigation.navigate('SignUp')}>
                  <Text className="text-sm text-slate-500 dark:text-slate-300" style={{ fontFamily: theme.serifFontFamily }}>
                    New here? <Text className="font-semibold text-indigo-400">Create an account</Text>
                  </Text>
                </TouchableOpacity>
              </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default memo(SignInScreen);
