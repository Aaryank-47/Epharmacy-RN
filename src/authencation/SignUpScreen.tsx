import React, { useCallback, useEffect, useRef, useState, memo } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useMutation } from '@tanstack/react-query';

import { signupUser } from '../api/authApi';
import type { SignUpPayload } from '../api/types';
import { mapApiError, toHumanReadableError } from '../utils/errorHandler';
import useThemePalette from '../hooks/useThemePalette';
import { useAuth } from '../context/AuthContext';

// ============================================================================
// TYPES
// ============================================================================
interface SignUpScreenProps {
  navigation: NavigationProp<any, 'SignUp'>;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const Header = memo(({ theme }: { theme: any }) => (
  <>
    <Text className="text-3xl font-bold text-center mb-2" style={{ color: theme.ctaGradient[0], fontFamily: theme.serifFontFamily }}>
      Join Us
    </Text>
    <Text className="text-sm text-center text-gray-600 dark:text-slate-400 mb-8">
      Create your account for personalized healthcare
    </Text>
  </>
));

const InputField = memo(({
  icon, placeholder, value, onChangeText, error, theme,
  secureTextEntry = false, keyboardType = 'default',
  autoCapitalize = 'sentences', showPasswordToggle = false,
  onTogglePassword, showPassword
}: any) => (
  <View className="mb-4">
    <View className="flex-row items-center border border-gray-300 dark:border-white/20 rounded-full px-4 py-3 bg-gray-50 dark:bg-white/5">
      <MaterialCommunityIcons name={icon} size={20} color={theme.isDark ? '#fff' : '#1a1d24'} />
      <TextInput
        className="flex-1 ml-3 text-base text-slate-900 dark:text-white"
        placeholder={placeholder}
        placeholderTextColor="#999"
        style={{ fontFamily: theme.serifFontFamily }}
        value={value} onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        returnKeyType="next"
      />
      {showPasswordToggle && (
        <TouchableOpacity onPress={onTogglePassword} className="ml-2">
          <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={20} color={theme.isDark ? '#fff' : '#1a1d24'} />
        </TouchableOpacity>
      )}
    </View>
    {error && <Text className="text-xs text-red-500 mt-1">{error}</Text>}
  </View>
));

const SubmitButton = memo(({ onPress, loading, theme }: any) => (
  <LinearGradient colors={theme.ctaGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="rounded-full overflow-hidden mb-4">
    <TouchableOpacity onPress={onPress} disabled={loading} activeOpacity={0.8} className="flex-row items-center justify-center py-4">
      {loading ? <ActivityIndicator color="#fff" size="small" /> : (
        <>
          <MaterialCommunityIcons name="account-plus" size={18} color="#fff" />
          <Text className="ml-2 text-white font-semibold text-base" style={{ fontFamily: theme.serifFontFamily }}>
            Create Account
          </Text>
        </>
      )}
    </TouchableOpacity>
  </LinearGradient>
));

const Footer = memo(({ onNavigate, theme }: any) => (
  <TouchableOpacity onPress={onNavigate} className="items-center py-3">
    <Text className="text-sm text-gray-600 dark:text-slate-400">
      Already have an account?{' '}
      <Text className="font-semibold" style={{ color: theme.ctaGradient[0] }}>Sign In</Text>
    </Text>
  </TouchableOpacity>
));

// ============================================================================
// MAIN SCREEN
// ============================================================================

const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const { login: persistSession } = useAuth();
  const theme = useThemePalette();
  const scrollRef = useRef<ScrollView | null>(null);

  // State
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Handlers
  const updateField = useCallback((field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const togglePassword = useCallback(() => setShowPassword(prev => !prev), []);

  const validateForm = useCallback(() => {
    const errors: FormErrors = {};
    const { fullName, email, phone, password } = formData;
    if (!fullName.trim()) errors.fullName = 'Full name is required';
    if (!email.trim()) errors.email = 'Email required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email';
    if (!phone.trim()) errors.phone = 'Phone required';
    else if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) errors.phone = 'Must be 10 digits';
    if (!password.trim()) errors.password = 'Password required';
    else if (password.length < 6) errors.password = 'Min 6 chars';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Mutation
  const mutation = useMutation({
    mutationFn: (payload: SignUpPayload) => signupUser(payload),
    onSuccess: async (data) => {
      if (data.token && data.user) await persistSession(data);
      else navigation.navigate('SignIn');
    },
    onError: (error: any) => {
      const normalized = mapApiError(error);
      const msg = toHumanReadableError(normalized);
      if (normalized.message?.toLowerCase().includes('already exists') || normalized.statusCode === 400) {
        setFormErrors({ email: msg || 'Email already registered' });
      } else {
        setFormErrors({ email: msg || 'Signup failed' });
      }
    }
  });

  const handleSignUp = useCallback(() => {
    if (!validateForm()) return;
    const { fullName, email, phone, password } = formData;
    mutation.mutate({
      name: fullName,
      email: email.toLowerCase().trim(),
      phone: phone.replace(/\D/g, ''),
      password
    });
  }, [formData, validateForm, mutation]);

  const gradientColors = theme.isDark ? ['#000000', '#2A2D35'] : ['#FFFFFF', '#F3F4F6'];

  return (
    <LinearGradient 
      colors={gradientColors} 
      start={{ x: 0, y: 0 }} 
      end={{ x: 0, y: 1 }} 
      style={{ flex: 1 }}
    >
      <StatusBar 
        barStyle={theme.isDark ? "light-content" : "dark-content"} 
        backgroundColor="transparent" 
        translucent={true}
      />
      <SafeAreaView className="flex-1" style={{ paddingTop: 0 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              ref={scrollRef} showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1 }} className="px-6"
              keyboardShouldPersistTaps="handled"
            >
              <View className="flex-1 justify-center py-1 -mt-12">
                <Header theme={theme} />

                <InputField
                  icon="account-outline" placeholder="Full Name"
                  value={formData.fullName} onChangeText={(t: string) => updateField('fullName', t)}
                  error={formErrors.fullName} theme={theme} autoCapitalize="words"
                />

                <InputField
                  icon="email-outline" placeholder="Email Address"
                  value={formData.email} onChangeText={(t: string) => updateField('email', t)}
                  error={formErrors.email} theme={theme} keyboardType="email-address" autoCapitalize="none"
                />

                <InputField
                  icon="phone-outline" placeholder="Phone Number"
                  value={formData.phone} onChangeText={(t: string) => updateField('phone', t)}
                  error={formErrors.phone} theme={theme} keyboardType="phone-pad"
                />

                <InputField
                  icon="lock-outline" placeholder="Password"
                  value={formData.password} onChangeText={(t: string) => updateField('password', t)}
                  error={formErrors.password} theme={theme} secureTextEntry={!showPassword}
                  showPasswordToggle={true} onTogglePassword={togglePassword} showPassword={showPassword}
                />

                <SubmitButton onPress={handleSignUp} loading={mutation.isPending} theme={theme} />

                <Footer onNavigate={() => navigation.navigate('SignIn')} theme={theme} />
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default memo(SignUpScreen);
