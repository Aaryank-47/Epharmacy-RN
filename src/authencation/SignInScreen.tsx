import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import type { NavigationProp } from '@react-navigation/native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LottieView from 'lottie-react-native';
import { useMutation } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

import type { RootStackParamList } from '../../AppNavigator';
import { loginRequest, googleLoginRequest } from '../api/authApi';
import type { LoginRequestPayload } from '../api/types';
import { toHumanReadableError, mapApiError } from '../utils/errorHandler';
import useThemePalette from '../hooks/useThemePalette';
import { useAuth } from '../context/AuthContext';

const { width: screenWidth } = Dimensions.get('window');

interface SignInScreenProps {
  navigation: NavigationProp<RootStackParamList, 'SignIn'>;
}

const INPUT_HEIGHT = 56;

const SignInScreen: React.FC<SignInScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const haloAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  // const scrollRef = useRef<ScrollView | null>(null);
  const { login: persistSession } = useAuth();
  const {
    statusBarBackground,
    statusBarStyle,
    ctaGradient,
    serifFontFamily,
    surfaceColor,
  } = useThemePalette();

  const compactTopInset = Math.max(insets.top - 24, 0);

  // Initialize Google Sign-In
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '933031359598-ofs7ps3rg2k8fpamhoa659f14uk08f5m.apps.googleusercontent.com',
      // Android client ID (type: Android) tied to package com.epharmacynative + SHA-1
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
  }, []);

  const mutation = useMutation({
    mutationFn: (payload: LoginRequestPayload) => loginRequest(payload),
    onSuccess: async data => {
      // setFormErrors({});
      // setLocalError(null);
      await persistSession(data);

      // FCM token is already registered via login API
      console.log('✅ Login successful with FCM token');

    },
    onError: (error: any) => {
      const normalizedError = mapApiError(error);
      const message = toHumanReadableError(normalizedError);
      console.error('❌ Login error:', { normalizedError, message });
      setLocalError(message);
      // setFormErrors({});
    },
  });

  const googleMutation = useMutation({
    mutationFn: (idToken: string) => {
      console.log('[Google] mutationFn invoked with idToken length', idToken?.length);
      return googleLoginRequest(idToken)
    },
    onSuccess: async data => {
      setIsGoogleSigningIn(false);
      // setFormErrors({});
      // setLocalError(null);
      console.log('🔐 Google login successful, persisting session...');
      console.log('[Google] mutation success payload user:', data?.user?.email, 'token?', !!data?.token);
      await persistSession(data);
      console.log('✅ Google login successful');
    },
    onError: (error: any) => {
      setIsGoogleSigningIn(false);
      console.error('❌ Google login error (raw):', error);

      // Normalize the error to extract proper message
      const normalizedError = mapApiError(error);
      const message = toHumanReadableError(normalizedError);

      console.error('❌ Google login error (normalized):', { normalizedError, message });
      console.error('[Google] mutation error details', {
        message: error?.message,
        code: error?.code,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      setLocalError(message);
      // setFormErrors({});
    },
  });

  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );
    const hideListener = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(haloAnim, {
          toValue: 1,
          duration: 4800,
          useNativeDriver: true,
        }),
        Animated.timing(haloAnim, {
          toValue: 0,
          duration: 4800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [haloAnim]);

  const buttonDisabled = useMemo(() => {
    return (
      mutation.isPending || email.trim().length === 0 || password.length < 6
    );
  }, [email, password, mutation.isPending]);

  const remoteErrorMessage = toHumanReadableError(mutation.error as any);
  const combinedError = localError || remoteErrorMessage;

  const animatedHaloStyle = {
    opacity: haloAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.25, 0.6],
    }),
    transform: [
      {
        scale: haloAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.9, 1.3],
        }),
      },
    ],
  };

  const buttonScaleStyle = {
    transform: [
      {
        scale: pulseAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.98, 1.02],
        }),
      },
    ],
  };

  const socialProviders = useMemo(
    () => ['google', 'facebook', 'account'] as const,
    [],
  );

  const handleSubmit = useCallback(async () => {
    // setLocalError(null);
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Invalid email format';
    }

    if (!password.trim()) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const cachedToken = (await AsyncStorage.getItem('fcmToken')) ?? null;

    const payload: LoginRequestPayload = {
      email: email.trim().toLowerCase(),
      password,
      fcmToken: cachedToken,
    };

    mutation.mutate(payload);
  }, [email, password, mutation]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setIsGoogleSigningIn(true);
      // setLocalError(null);
      // setFormErrors({});
      console.log('[Google] handleGoogleSignIn start');

      console.log('[Google] checking Play Services...');
      console.log('Play Services available:', await GoogleSignin.hasPlayServices());
      console.log('[Google] calling signIn()');
      const response = await GoogleSignin.signIn();
      console.log('response from Google Sign-In:', response);
      console.log('[Google] signIn response keys', Object.keys(response || {}));
      console.log('[Google] signIn data keys', response?.data ? Object.keys(response.data) : []);
      console.log('[Google] signIn user email', response?.user?.email);
      console.log('[Google] signIn scopes', response?.scopes);

      // Extract ID token - it can be in different places depending on library version
      const idToken = response.data?.idToken;
      console.log('[Google] extracted idToken:', idToken ? 'FOUND' : 'NOT FOUND');
      console.log('[Google] extracted idToken length', idToken?.length);

      if (!idToken) {
        console.error('❌ No ID token in response:', {
          response: response,
          data: response.data,
          keys: Object.keys(response),
          dataKeys: response.data ? Object.keys(response.data) : []
        });
        throw new Error('No ID token received from Google');
      }

      console.log('🔐 Google Sign-In successful, sending token to backend...');
      console.log('📝 ID Token preview:', idToken.substring(0, 50) + '...');
      console.log('[Google] queueing mutate with idToken length', idToken.length);
      googleMutation.mutate(idToken);
    } catch (error: any) {
      setIsGoogleSigningIn(false);
      console.error('❌ Google Sign-In error (raw):', error);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('Google Sign-In cancelled by user');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        setLocalError('Google Sign-In is in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setLocalError('Google Play Services not available');
      } else {
        const message = toHumanReadableError(error?.message || 'Google Sign-In failed');
        setLocalError(message);
      }
      console.error('[Google] handleGoogleSignIn error', error);
    }
  }, [googleMutation]);

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-[#0b0d14]"
      style={{ paddingTop: compactTopInset, backgroundColor: surfaceColor }}
    >
      <StatusBar
        backgroundColor={statusBarBackground}
        barStyle={statusBarStyle}
        translucent={false}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <LinearGradient
            colors={
              Platform.OS === 'ios'
                ? [surfaceColor, surfaceColor]
                : [surfaceColor, surfaceColor]
            }
            style={{ flex: 1 }}
          >
            <View className="flex-1 px-6 pb-6 pt-0">
              <View className="flex-row items-center justify-between pt-0">
                <TouchableOpacity
                  activeOpacity={0.7}
                  className="h-11 w-11 items-center justify-center rounded-full border border-slate-200 dark:border-white/10 mt-[-10px]"
                  onPress={() => navigation.goBack()}
                >
                  <MaterialCommunityIcons
                    name="arrow-left"
                    size={22}
                    color={
                      statusBarStyle === 'light-content' ? '#FFFFFF' : '#111827'
                    }
                  />
                </TouchableOpacity>
                <View className="w-12" />
              </View>

              {!keyboardVisible && (
                <View className="items-center pt-0">
                  <LottieView
                    source={require('../assets/animations/Social Media Influencer.json')}
                    autoPlay
                    loop
                    style={{
                      width: screenWidth * 0.5,
                      height: screenWidth * 0.4,
                    }}
                  />
                  <Text
                    className="mt-4 text-center text-3xl font-extrabold text-[#111827] dark:text-white"
                    style={{ fontFamily: serifFontFamily }}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    Welcome back to MediCare+
                  </Text>
                  <Text
                    className="mx-2 mt-3 text-center text-base leading-6 text-slate-500 dark:text-slate-300"
                    style={{ fontFamily: serifFontFamily }}
                  >
                    Sign in to manage prescriptions, consult pharmacists, and
                    track real-time deliveries.
                  </Text>
                </View>
              )}

              {/* FIXED SECTION - NO SCROLL */}
              <View className="mt-2 w-full">
                {/* Login Card */}
                <View className="  p-4 w-full ">
                  <Text
                    className="text-sm font-semibold uppercase text-slate-400 dark:text-slate-500"
                    style={{ fontFamily: serifFontFamily }}
                  >
                    Login details
                  </Text>

                  {/* Email */}
                  <View
                    className="mt-4 flex-row items-center rounded-full border border-slate-200 dark:border-white/20 bg-white/80 px-4 dark:bg-[#1a1d24]"
                    style={{ minHeight: INPUT_HEIGHT }}
                  >
                    <MaterialCommunityIcons
                      name="email-outline"
                      size={20}
                      color={
                        statusBarStyle === 'light-content'
                          ? '#cbd5f5'
                          : '#334155'
                      }
                    />
                    <TextInput
                      placeholder="Email address"
                      placeholderTextColor="rgba(148,163,184,0.8)"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      className="ml-3 flex-1 text-base text-slate-900 dark:text-white"
                      style={{ fontFamily: serifFontFamily }}
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setKeyboardVisible(true)}
                      onBlur={() => setKeyboardVisible(false)}
                    />
                  </View>
                  {formErrors.email && (
                    <Text className="text-xs text-red-500 mt-1">
                      {formErrors.email}
                    </Text>
                  )}

                  {/* Password */}
                  <View
                    className="mt-3 flex-row items-center rounded-full border border-slate-200 dark:border-white/20 bg-white/80 px-4 dark:bg-[#1a1d24]"
                    style={{ minHeight: INPUT_HEIGHT }}
                  >
                    <MaterialCommunityIcons
                      name="lock-outline"
                      size={20}
                      color={
                        statusBarStyle === 'light-content'
                          ? '#cbd5f5'
                          : '#334155'
                      }
                    />
                    <TextInput
                      placeholder="Password"
                      placeholderTextColor="rgba(148,163,184,0.8)"
                      secureTextEntry={!showPassword}
                      className="ml-3 flex-1 text-base text-slate-900 dark:text-white"
                      style={{ fontFamily: serifFontFamily }}
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setKeyboardVisible(true)}
                      onBlur={() => setKeyboardVisible(false)}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <MaterialCommunityIcons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color="#8891a7"
                      />
                    </TouchableOpacity>
                  </View>
                  {formErrors.password && (
                    <Text className="text-xs text-red-500 mt-1">
                      {formErrors.password}
                    </Text>
                  )}
                </View>

                {/* Error */}
                {combinedError && (
                  <View className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                    <Text
                      className="text-sm font-semibold text-red-400"
                      style={{ fontFamily: serifFontFamily }}
                    >
                      {combinedError}
                    </Text>
                  </View>
                )}

                {/* LOGIN BUTTON */}
                <Animated.View style={[buttonScaleStyle, { marginTop: 8 }]}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    disabled={buttonDisabled}
                    onPress={handleSubmit}
                  >
                    <LinearGradient
                      colors={ctaGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        borderRadius: 9999,
                        paddingVertical: 16,
                        shadowOpacity: 0.25,
                        shadowRadius: 25,
                      }}
                    >
                      {mutation.isPending ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <View className="flex-row items-center justify-center gap-3">
                          <MaterialCommunityIcons
                            name="login"
                            size={18}
                            color="#fff"
                          />
                          <Text
                            className="text-base font-semibold uppercase tracking-[3px] text-white"
                            style={{ fontFamily: serifFontFamily }}
                          >
                            Access Pharmacy
                          </Text>
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    className="mt-3 self-end"
                    onPress={() => navigation.navigate('ForgotPassword')}
                  >
                    <Text
                      className="text-sm font-semibold text-slate-600 dark:text-slate-300  decoration-dotted mr-6"
                      style={{ fontFamily: serifFontFamily }}
                    >
                      Forgot password?
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                {/* Social Login */}
                <View className="mt-8 flex-row justify-center gap-4">
                  {/* GOOGLE SIGN-IN BUTTON */}
                  <TouchableOpacity
                    activeOpacity={0.9}
                    disabled={isGoogleSigningIn || googleMutation.isPending}
                    onPress={handleGoogleSignIn}
                    className="h-14 w-14 items-center justify-center rounded-full border border-slate-200 dark:border-white/20 bg-white dark:bg-white/5"
                  >
                    {isGoogleSigningIn || googleMutation.isPending ? (
                      <ActivityIndicator color="#DB4437" />
                    ) : (
                      <MaterialCommunityIcons
                        name="google"
                        size={28}
                        color="#DB4437"
                      />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    className="h-14 w-14 items-center justify-center rounded-full border border-slate-200 dark:border-white/20 bg-white dark:bg-white/5"
                  >
                    <MaterialCommunityIcons
                      name="facebook"
                      size={32}
                      color="#1877F2"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    className="h-14 w-14 items-center justify-center rounded-full border border-slate-200 dark:border-white/20 bg-white dark:bg-white/5"
                  >
                    <MaterialCommunityIcons
                      name="account-check"
                      size={28}
                      color="green"
                    />
                  </TouchableOpacity>
                </View>

                {/* Sign Up */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  className="mt-4 items-center"
                  onPress={() => navigation.navigate('SignUp')}
                >
                  <Text
                    className="text-sm text-slate-500 dark:text-slate-300"
                    style={{ fontFamily: serifFontFamily }}
                  >
                    New here?{' '}
                    <Text className="font-semibold text-indigo-400">
                      Create an account
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignInScreen;
