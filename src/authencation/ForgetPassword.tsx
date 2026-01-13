import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  ToastAndroid,
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
  const [otpStatus, setOtpStatus] = useState<'pending' | 'success' | 'failure'>('pending');

  const [timer, setTimer] = useState<number>(0);
  const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);

  const otpRefs = useRef<(TextInput | null)[]>([]);
  const {
    surfaceColor,
    ctaGradient,
    serifFontFamily,
    isDark,
  } = useThemePalette();

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

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
    ToastAndroid.show(displayMessage, ToastAndroid.SHORT);
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

  const handleVerifyOTP = useCallback(async (): Promise<void> => {
    const otpCode = otp.join('');
    if (otpCode.length !== 4) {
      showErrorAlert('Please enter 4-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtpRequest({ email, otp: otpCode });
      if (res?.message) {
        setOtpStatus('success');
        setTimeout(() => {
          setStep(2);
          setOtpStatus('pending'); // Reset
        }, 1000);
      } else {
        setOtpStatus('failure');
        showErrorAlert(res?.message || 'Invalid OTP');
      }
    } catch (err: any) {
      setOtpStatus('failure');
      showErrorAlert(err?.message || 'Error verifying OTP');
    } finally {
      setLoading(false);
    }
  }, [email, otp]);

  // Auto-verify when OTP is filled
  useEffect(() => {
    if (step === 1 && otp.every(digit => digit !== '')) {
      handleVerifyOTP();
    }
  }, [otp, step, handleVerifyOTP]);

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
    setOtpStatus('pending');

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
          <View className="flex-row items-center justify-between mb-6 mt-[-5px]">
            <View className="w-10" />
          </View>

          <View className="flex-row items-center justify-center mb-6 gap-1.5">
            <View
              className={`w-3 h-3 rounded-full ${step >= 0 ? 'bg-black' : 'bg-gray-300'
                }`}
            />
            <View
              className={`flex-1 h-0.5 mx-1 ${step >= 1 ? 'bg-black' : 'bg-gray-300'
                }`}
            />
            <View
              className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-black' : 'bg-gray-300'
                }`}
            />
            <View
              className={`flex-1 h-0.5 mx-1 ${step >= 2 ? 'bg-black' : 'bg-gray-300'
                }`}
            />
            <View
              className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-black' : 'bg-gray-300'
                }`}
            />
          </View>

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
                {otp.map((digit, idx) => {
                  let borderColor = 'border-gray-300';
                  if (otpStatus === 'success') borderColor = 'border-green-500';
                  else if (otpStatus === 'failure') borderColor = 'border-red-500';
                  else if (digit) borderColor = 'border-blue-500';

                  return (
                    <TextInput
                      key={idx}
                      ref={ref => {
                        otpRefs.current[idx] = ref;
                      }}
                      className={`flex-1 border-2 ${borderColor} rounded-lg py-3 text-2xl font-bold text-center text-black bg-gray-50`}
                      placeholder="0"
                      placeholderTextColor="#ccc"
                      value={digit}
                      onChangeText={text => handleOtpChange(text, idx)}
                      keyboardType="numeric"
                      maxLength={1}
                      editable={!loading}
                    />
                  )
                })}
              </View>

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

    </SafeAreaView>
  );
};

export default ForgetPasswordScreen;
