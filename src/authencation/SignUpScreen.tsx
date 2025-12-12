import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
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
import { useMutation } from '@tanstack/react-query';

import { signupUser } from '../api/authApi';
import type { SignUpPayload } from '../api/types';
import { mapApiError, toHumanReadableError } from '../utils/errorHandler';
import useThemePalette from '../hooks/useThemePalette';
import { useAuth } from '../context/AuthContext';

interface SignUpScreenProps {
  navigation: NavigationProp<any, 'SignUp'>;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
}

const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  // State Management
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Refs & Hooks
  const scrollRef = useRef<ScrollView | null>(null);
  const insets = useSafeAreaInsets();
  const { login: persistSession } = useAuth();
  const {
    statusBarBackground,
    statusBarStyle,
    ctaGradient,
    surfaceColor,
    serifFontFamily,
  } = useThemePalette();

  // API Mutation
  const mutation = useMutation({
    mutationFn: (payload: SignUpPayload) => signupUser(payload),
    onSuccess: async data => {
      if (data.token && data.user) {
        // Full login response received
        await persistSession(data);
      } else {
        // Signup successful but no token (requires manual login)
        // Show success message (using console for now or navigation params if needed)
        console.log('Signup successful, redirecting to login');
        navigation.navigate('SignIn');
      }
    },
    onError: (error: any) => {
      const normalizedError = mapApiError(error);
      const message = toHumanReadableError(normalizedError);

      // Check for specific "User exists" error to assign to email field
      if (
        normalizedError.message?.toLowerCase().includes('already exists') ||
        normalizedError.statusCode === 400
      ) {
        setFormErrors({ email: message || 'Email already registered' });
      } else {
        // Generic error - you might want to show a toast or a general error field
        // For now, assigning to email if it looks like an auth error, or logging
        setFormErrors({ email: message || 'Signup failed' });
      }
    },
  });

  // Keyboard Listeners
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

  // Form Validation
  const validateForm = useCallback((): boolean => {
    const errors: FormErrors = {};

    if (!fullName.trim()) {
      errors.fullName = 'Full name is required';
    }

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Invalid email format';
    }

    if (!phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
      errors.phone = 'Phone must be 10 digits';
    }

    if (!password.trim()) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [fullName, email, phone, password]);

  // Handle SignUp
  const handleSignUp = useCallback(async () => {
    if (!validateForm()) return;

    mutation.mutate({
      name: fullName,
      email: email.toLowerCase(),
      phone: phone.replace(/\D/g, ''),
      password,
    });
  }, [fullName, email, phone, password, validateForm, mutation]);

  const isLoading = mutation.isPending;

  return (
    <>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={statusBarBackground}
      />
      <SafeAreaView className="flex-1" style={{ backgroundColor: surfaceColor }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1 }}
              className="px-6"
              keyboardShouldPersistTaps="handled"
              scrollEnabled={true}
            >
              {/* Header */}
              {/* <View className="flex-row items-center pt-6 pb-4">
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  className="p-2 -ml-2"
                >
                  <MaterialCommunityIcons
                    name="arrow-left"
                    size={24}
                    color={ctaGradient[0]}
                  />
                </TouchableOpacity>
                <Text
                  className="text-lg font-bold flex-1 text-center"
                  style={{ color: ctaGradient[0], fontFamily: serifFontFamily }}
                >
                  Create Account
                </Text>
                <View className="w-10" />
              </View> */}

              {/* Main Content */}
              <View className="flex-1 justify-center py-1 -mt-12">
                {/* Title Section */}
                <Text
                  className="text-3xl font-bold text-center mb-2"
                  style={{ color: ctaGradient[0], fontFamily: serifFontFamily }}
                >
                  Join Us
                </Text>
                <Text className="text-sm text-center text-gray-600 dark:text-slate-400 mb-8">
                  Create your account for personalized healthcare
                </Text>

                <View className="mb-4">
                  <View className="flex-row items-center border border-gray-300 dark:border-white/20 rounded-full px-4 py-3 bg-gray-50 dark:bg-white/5">
                    <MaterialCommunityIcons
                      name="account-outline"
                      size={20}
                      color={ctaGradient[0]}
                    />
                    <TextInput
                      className="flex-1 ml-3 text-base text-slate-900 dark:text-white"
                      placeholder="Full Name"
                      placeholderTextColor="#999"
                      style={{ fontFamily: serifFontFamily }}
                      value={fullName}
                      onChangeText={setFullName}
                      editable={!isLoading}
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                  </View>
                  {formErrors.fullName && (
                    <Text className="text-xs text-red-500 mt-1">
                      {formErrors.fullName}
                    </Text>
                  )}
                </View>

                <View className="mb-4">
                  <View className="flex-row items-center border border-gray-300 dark:border-white/20 rounded-full px-4 py-3 bg-gray-50 dark:bg-white/5">
                    <MaterialCommunityIcons
                      name="email-outline"
                      size={20}
                      color={ctaGradient[0]}
                    />
                    <TextInput
                      className="flex-1 ml-3 text-base text-slate-900 dark:text-white"
                      placeholder="Email Address"
                      placeholderTextColor="#999"
                      style={{ fontFamily: serifFontFamily }}
                      value={email}
                      onChangeText={setEmail}
                      editable={!isLoading}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      returnKeyType="next"
                    />
                  </View>
                  {formErrors.email && (
                    <Text className="text-xs text-red-500 mt-1">
                      {formErrors.email}
                    </Text>
                  )}
                </View>

                <View className="mb-4">
                  <View className="flex-row items-center border border-gray-300 dark:border-white/20 rounded-full px-4 py-3 bg-gray-50 dark:bg-white/5">
                    <MaterialCommunityIcons
                      name="phone-outline"
                      size={20}
                      color={ctaGradient[0]}
                    />
                    <TextInput
                      className="flex-1 ml-3 text-base text-slate-900 dark:text-white"
                      placeholder="Phone Number"
                      placeholderTextColor="#999"
                      style={{ fontFamily: serifFontFamily }}
                      value={phone}
                      onChangeText={setPhone}
                      editable={!isLoading}
                      keyboardType="phone-pad"
                      returnKeyType="next"
                    />
                  </View>
                  {formErrors.phone && (
                    <Text className="text-xs text-red-500 mt-1">
                      {formErrors.phone}
                    </Text>
                  )}
                </View>

                <View className="mb-6">
                  <View className="flex-row items-center border border-gray-300 dark:border-white/20 rounded-full px-4 py-3 bg-gray-50 dark:bg-white/5">
                    <MaterialCommunityIcons
                      name="lock-outline"
                      size={20}
                      color={ctaGradient[0]}
                    />
                    <TextInput
                      className="flex-1 ml-3 text-base text-slate-900 dark:text-white"
                      placeholder="Password"
                      placeholderTextColor="#999"
                      style={{ fontFamily: serifFontFamily }}
                      value={password}
                      onChangeText={setPassword}
                      editable={!isLoading}
                      secureTextEntry={!showPassword}
                      returnKeyType="next"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      className="ml-2"
                    >
                      <MaterialCommunityIcons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color={ctaGradient[0]}
                      />
                    </TouchableOpacity>
                  </View>
                  {formErrors.password && (
                    <Text className="text-xs text-red-500 mt-1">
                      {formErrors.password}
                    </Text>
                  )}
                </View>



                {/* Sign Up Button */}
                <LinearGradient
                  colors={ctaGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="rounded-full overflow-hidden mb-4"
                >
                  <TouchableOpacity
                    onPress={handleSignUp}
                    disabled={isLoading}
                    activeOpacity={0.8}
                    className="flex-row items-center justify-center py-4"
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <MaterialCommunityIcons
                          name="account-plus"
                          size={18}
                          color="#fff"
                        />
                        <Text
                          className="ml-2 text-white font-semibold text-base"
                          style={{ fontFamily: serifFontFamily }}
                        >
                          Create Account
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </LinearGradient>

                {/* Already Have Account */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('SignIn')}
                  className="items-center py-3"
                >
                  <Text className="text-sm text-gray-600 dark:text-slate-400">
                    Already have an account?{' '}
                    <Text
                      className="font-semibold"
                      style={{ color: ctaGradient[0] }}
                    >
                      Sign In
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
};

export default SignUpScreen;
