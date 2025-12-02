import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LottieView from 'lottie-react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  resetPasswordRequest,
  verifyOtpRequest,
  forgotPasswordRequest,
} from '../api/authApi';
import useThemePalette from '../hooks/useThemePalette';
import { toHumanReadableError } from '../utils/errorHandler';

interface ForgetPasswordScreenProps {
  navigation: any;
}

interface ErrorAlertState {
  visible: boolean;
  message: string;
}

const ForgetPasswordScreen: React.FC<ForgetPasswordScreenProps> = ({
  navigation,
}) => {
  const [step, setStep] = useState<number>(0);
  const [email, setEmail] = useState<string>('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '']);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorAlert, setErrorAlert] = useState<ErrorAlertState>({
    visible: false,
    message: '',
  });
  const [timer, setTimer] = useState<number>(0);
  const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);

  const otpRefs = useRef<(TextInput | null)[]>([]);
  const {
    surfaceColor,
    ctaGradient,
    iconMutedBackground,
    statusBarStyle,
    serifFontFamily,
    isDark,
  } = useThemePalette();

  // Timer for OTP resend
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (!errorAlert.visible) return;
    const timeout = setTimeout(() => {
      setErrorAlert({ visible: false, message: '' });
    }, 5000);
    return () => clearTimeout(timeout);
  }, [errorAlert.visible]);

  // Keyboard listener for animation
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

  const showErrorAlert = (message: unknown): void => {
    const displayMessage: string =
      typeof message === 'string'
        ? message
        : toHumanReadableError(message as any);
    setErrorAlert({ visible: true, message: displayMessage });
  };

  const handleSendOTP = async (): Promise<void> => {
    if (!email.trim()) {
      showErrorAlert('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showErrorAlert('Please enter a valid email');
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPasswordRequest({ email });
      if (res?.message) {
        setStep(1);
        setTimer(60);
        setOtp(['', '', '', '']);
      } else {
        showErrorAlert(res?.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      showErrorAlert(err?.message || 'Error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (): Promise<void> => {
    const otpCode = otp.join('');
    if (otpCode.length !== 4) {
      showErrorAlert('Please enter 4-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtpRequest({ email, otp: otpCode });
      if (res?.message) {
        setStep(2);
      } else {
        showErrorAlert(res?.message || 'Invalid OTP');
      }
    } catch (err: any) {
      showErrorAlert(err?.message || 'Error verifying OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async (): Promise<void> => {
    if (timer > 0) return;
    setLoading(true);
    try {
      const res = await forgotPasswordRequest({ email });
      if (res?.message) {
        setTimer(60);
        setOtp(['', '', '', '']);
        showErrorAlert('OTP sent again to your email');
      } else {
        showErrorAlert(res?.message || 'Failed to resend');
      }
    } catch (err: any) {
      showErrorAlert(err?.message || 'Error resending OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (): Promise<void> => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      showErrorAlert('Both passwords required');
      return;
    }
    if (newPassword.length < 6) {
      showErrorAlert('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      showErrorAlert('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPasswordRequest({
        email,
        otp: otp.join(''),
        password: newPassword,
      });
      if (res?.message) {
        showErrorAlert('Password reset successfully!');
        setTimeout(() => navigation.navigate('SignIn'), 1500);
      } else {
        showErrorAlert(res?.message || 'Failed to reset password');
      }
    } catch (err: any) {
      showErrorAlert(err?.message || 'Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (text: string, index: number): void => {
    const newOtp = [...otp];
    newOtp[index] = text.replace(/[^0-9]/g, '');
    setOtp(newOtp);

    if (text && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Lottie animation sources
  const loginAnimation = require('../assets/animations/Login.json');
  const emailAnimation = require('../assets/animations/email.json');

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: surfaceColor }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
          className="px-5 py-0"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6 mt-[-5px]">
            {/* <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2 border rounded-full border-slate-200 dark:border-white/30">
              <MaterialCommunityIcons name="arrow-left" size={24}  color={
                      statusBarStyle === 'light-content' ? '#FFFFFF' : '#111827'
                    }/>
            </TouchableOpacity> */}
            <View className="w-10" />
          </View>

          {/* Step Indicator */}
          <View className="flex-row items-center justify-center mb-6 gap-1.5">
            <View
              className={`w-3 h-3 rounded-full ${
                step >= 0 ? 'bg-black' : 'bg-gray-300'
              }`}
            />
            <View
              className={`flex-1 h-0.5 mx-1 ${
                step >= 1 ? 'bg-black' : 'bg-gray-300'
              }`}
            />
            <View
              className={`w-3 h-3 rounded-full ${
                step >= 1 ? 'bg-black' : 'bg-gray-300'
              }`}
            />
            <View
              className={`flex-1 h-0.5 mx-1 ${
                step >= 2 ? 'bg-black' : 'bg-gray-300'
              }`}
            />
            <View
              className={`w-3 h-3 rounded-full ${
                step >= 2 ? 'bg-black' : 'bg-gray-300'
              }`}
            />
          </View>

          {/* Step 1: Email */}
          {step === 0 && (
            <View className="gap-3 flex-1 justify-start">
              {!keyboardVisible && (
                <View className="items-center h-48 mb-10">
                  <LottieView
                    source={isDark ? emailAnimation : loginAnimation}
                    autoPlay
                    loop
                    style={{ width: '150%', height: '150%' }}
                  />
                </View>
              )}
              <Text
                className="text-3xl font-bold text-center mt-28"
                style={{ color: ctaGradient[0], fontFamily: serifFontFamily }}
              >
                Enter Your Email
              </Text>
              <Text className="text-sm text-center text-gray-600 leading-4 mb-4 dark:text-slate-100">
                We'll send you a verification code
              </Text>

              <TextInput
                className="border rounded-full px-4 py-4 text-base text-slate-900 dark:text-white border-slate-200 dark:border-white/20 bg-white/80  dark:bg-[#1a1d24]"
                placeholder="example@email.com"
                placeholderTextColor="#999"
                style={{ fontFamily: serifFontFamily }}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />

              <LinearGradient
                colors={ctaGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className=" overflow-hidden rounded-full border  "
              >
                <TouchableOpacity
                  className="flex-row items-center justify-center py-4 gap-2   "
                  onPress={handleSendOTP}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="send"
                        size={16}
                        color="#fff"
                      />
                      <Text
                        className="text-white text-lg font-semibold"
                        style={{ fontFamily: serifFontFamily }}
                      >
                        Send Code
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}

          {/* Step 2: OTP */}
          {step === 1 && (
            <View className="gap-3 flex-1 justify-center">
              <View className="items-center mb-2">
                <MaterialCommunityIcons
                  name="shield-check"
                  size={40}
                  style={{ color: ctaGradient[0], fontFamily: serifFontFamily }}
                />
              </View>
              <Text
                className="text-2xl font-bold text-center"
                style={{ color: ctaGradient[0], fontFamily: serifFontFamily }}
              >
                Verify Code
              </Text>
              <Text
                className="text-xs text-center text-gray-600 leading-4 mb-3"
                style={{ fontFamily: serifFontFamily }}
              >
                4-digit code sent to {email}
              </Text>

              <View className="flex-row justify-between gap-2 px-1 mb-3">
                {otp.map((digit, idx) => (
                  <TextInput
                    key={idx}
                    ref={ref => {
                      otpRefs.current[idx] = ref;
                    }}
                    className="flex-1 border-2 border-gray-300 rounded-lg py-3 text-2xl font-bold text-center text-black bg-gray-50"
                    placeholder="0"
                    placeholderTextColor="#ccc"
                    value={digit}
                    onChangeText={text => handleOtpChange(text, idx)}
                    keyboardType="numeric"
                    maxLength={1}
                    editable={!loading}
                  />
                ))}
              </View>

              {/* Timer & Resend */}
              <View className="items-center py-2 mb-2">
                {timer > 0 ? (
                  <View className="flex-row items-center gap-1.5">
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={14}
                      style={{ color: ctaGradient[0] }}
                    />
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: ctaGradient[0] }}
                    >
                      Resend in {timer}s
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handleResendOTP}
                    disabled={loading}
                  >
                    <View className="flex-row items-center gap-1.5">
                      <MaterialCommunityIcons
                        name="refresh"
                        size={14}
                        style={{ color: ctaGradient[0] }}
                      />
                      <Text
                        className="text-xs font-semibold"
                        style={{ color: ctaGradient[0] }}
                      >
                        Resend Code
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>

              <LinearGradient
                colors={ctaGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="rounded-lg overflow-hidden"
              >
                <TouchableOpacity
                  className="flex-row items-center justify-center py-3.5"
                  onPress={handleVerifyOTP}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text className="text-white text-sm font-semibold">
                      Verify Code
                    </Text>
                  )}
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}

          {/* Step 3: Password */}
          {step === 2 && (
            <View className="gap-3 flex-1 justify-center pb-4">
              <View className="items-center mb-2">
                <MaterialCommunityIcons
                  name="lock-reset"
                  size={40}
                  style={{ color: ctaGradient[0] }}
                />
              </View>
              <Text
                className="text-2xl font-bold text-center"
                style={{ color: ctaGradient[0] }}
              >
                New Password
              </Text>
              <Text className="text-xs text-center text-gray-600 leading-4 mb-3">
                Create a strong password
              </Text>

              <View className="border border-gray-300 rounded-lg px-3 py-2 flex-row items-center gap-2 bg-gray-50 mb-2">
                <TextInput
                  className="flex-1 text-sm text-black"
                  placeholder="Password"
                  placeholderTextColor="#999"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="p-1"
                >
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={18}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>

              <View className="border border-gray-300 rounded-lg px-3 py-2 flex-row items-center gap-2 bg-gray-50 mb-3">
                <TextInput
                  className="flex-1 text-sm text-black"
                  placeholder="Confirm"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="p-1"
                >
                  <MaterialCommunityIcons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={18}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>

              <LinearGradient
                colors={ctaGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="rounded-lg overflow-hidden"
              >
                <TouchableOpacity
                  className="flex-row items-center justify-center py-3.5"
                  onPress={handleResetPassword}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text className="text-white text-sm font-semibold">
                      Reset Password
                    </Text>
                  )}
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}

          {/* Back to Sign In */}
          <TouchableOpacity
            className="items-center py-2 mb-5"
            onPress={() => navigation.navigate('SignIn')}
          >
            <Text
              className="text-lg dark:text-white text-slate-900"
              style={{ fontFamily: serifFontFamily }}
            >
              ← Back to Sign In
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Beautiful Error Alert Popup */}
      {errorAlert.visible && (
        <View
          className="absolute inset-0 items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        >
          <View
            className="rounded-2xl p-6 mx-5 shadow-2xl w-80"
            style={{ backgroundColor: surfaceColor }}
          >
            <View className="flex-row items-start gap-3 mb-4">
              <View
                className="w-12 h-12 rounded-full items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#fee2e2' }}
              >
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={28}
                   color={
                        statusBarStyle === 'light-content'
                          ? '#cbd5f5'
                          : '#334155'
                      }
                />
              </View>
              <View className="flex-1 justify-center">
                <Text
                  className="text-base font-bold mb-0.5"
                  style={{ color: ctaGradient[0] }}
                >
                  Oops!
                </Text>
              </View>
            </View>
            <View className="mb-4 px-1">
              <Text
                className="text-sm leading-5 font-medium"
                style={{ color: isDark ? '#ffffff' : '#000000' }}
              >
                {errorAlert.message || 'Something went wrong'}
              </Text>
            </View>
            <LinearGradient
              colors={ctaGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className=" overflow-hidden rounded-full border"
            >
             

              <TouchableOpacity
                className="py-3 items-center  "
                onPress={() => setErrorAlert({ visible: false, message: '' })}
                activeOpacity={0.8}
              >
                
                <Text className="text-white font-semibold text-sm">
                  Got it</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default ForgetPasswordScreen;
