import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  resetPasswordRequest,
  verifyOtpRequest,
  forgotPasswordRequest,
} from '../api/authApi';
import useThemePalette from '../hooks/useThemePalette';
import { toHumanReadableError } from '../utils/errorHandler';
import { RootStackParamList } from '../../AppNavigator';

// ============================================================================
// TYPES
// ============================================================================
type NavigationProps = NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;



// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const StepIndicator = memo(({ step }: { step: number }) => (
  <View className="flex-row items-center justify-center mb-6 gap-1.5">
    {[0, 1, 2].map((s, i) => (
      <React.Fragment key={s}>
        <View className={`w-3 h-3 rounded-full ${step >= s ? 'bg-black' : 'bg-gray-300'}`} />
        {i < 2 && <View className={`flex-1 h-0.5 mx-1 ${step >= s + 1 ? 'bg-black' : 'bg-gray-300'}`} />}
      </React.Fragment>
    ))}
  </View>
));

const EmailStep = memo(({ email, setEmail, loading, onSend, theme, keyboardVisible }: any) => (
  <View className="gap-3 flex-1 justify-start">
    {!keyboardVisible && (
      <View className="items-center h-48 mb-10">
        <LottieView
          source={theme.isDark ? require('../assets/animations/email.json') : require('../assets/animations/Login.json')}
          autoPlay loop style={{ width: '150%', height: '150%' }}
        />
      </View>
    )}
    <Text className="text-3xl font-bold text-center mt-28" style={{ color: theme.ctaGradient[0], fontFamily: theme.serifFontFamily }}>
      Enter Your Email
    </Text>
    <Text className="text-sm text-center text-gray-600 leading-4 mb-4 dark:text-slate-100">
      We'll send you a verification code
    </Text>
    <TextInput
      className="border rounded-full px-4 py-4 text-base text-slate-900 dark:text-white border-slate-200 dark:border-white/20 bg-white/80 dark:bg-[#1a1d24]"
      placeholder="example@email.com"
      placeholderTextColor="#999"
      style={{ fontFamily: theme.serifFontFamily }}
      value={email}
      onChangeText={setEmail}
      keyboardType="email-address"
      autoCapitalize="none"
      editable={!loading}
    />
    <LinearGradient colors={theme.ctaGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="overflow-hidden rounded-full border">
      <TouchableOpacity className="flex-row items-center justify-center py-4 gap-2" onPress={onSend} disabled={loading} activeOpacity={0.8}>
        {loading ? <ActivityIndicator color="#fff" size="small" /> : (
          <>
            <MaterialCommunityIcons name="send" size={16} color="#fff" />
            <Text className="text-white text-lg font-semibold" style={{ fontFamily: theme.serifFontFamily }}>Send Code</Text>
          </>
        )}
      </TouchableOpacity>
    </LinearGradient>
  </View>
));

const OtpStep = memo(({ otp, setOtp, otpStatus, loading, onVerify, onResend, timer, email, theme }: any) => {
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text.replace(/[^0-9]/g, '');
    setOtp(newOtp);
    if (text && index < 3) otpRefs.current[index + 1]?.focus();
  };

  return (
    <View className="gap-3 flex-1 justify-center">
      <View className="items-center mb-2">
        <MaterialCommunityIcons name="shield-check" size={40} style={{ color: theme.ctaGradient[0] }} />
      </View>
      <Text className="text-2xl font-bold text-center" style={{ color: theme.ctaGradient[0], fontFamily: theme.serifFontFamily }}>Verify Code</Text>
      <Text className="text-xs text-center text-gray-600 leading-4 mb-3" style={{ fontFamily: theme.serifFontFamily }}>
        4-digit code sent to {email}
      </Text>
      <View className="flex-row justify-between gap-2 px-1 mb-3">
        {otp.map((digit: string, idx: number) => {
          let borderColor = 'border-gray-300';
          if (otpStatus === 'success') borderColor = 'border-green-500';
          else if (otpStatus === 'failure') borderColor = 'border-red-500';
          else if (digit) borderColor = 'border-blue-500';
          return (
            <TextInput
              key={idx}
              ref={ref => { otpRefs.current[idx] = ref; }}
              className={`flex-1 border-2 ${borderColor} rounded-lg py-3 text-2xl font-bold text-center text-black bg-gray-50`}
              placeholder="0" placeholderTextColor="#ccc" value={digit}
              onChangeText={text => handleOtpChange(text, idx)}
              keyboardType="numeric" maxLength={1} editable={!loading}
            />
          );
        })}
      </View>
      <View className="items-center py-2 mb-2">
        {timer > 0 ? (
          <View className="flex-row items-center gap-1.5">
            <MaterialCommunityIcons name="clock-outline" size={14} style={{ color: theme.ctaGradient[0] }} />
            <Text className="text-xs font-semibold" style={{ color: theme.ctaGradient[0] }}>Resend in {timer}s</Text>
          </View>
        ) : (
          <TouchableOpacity onPress={onResend} disabled={loading}>
            <View className="flex-row items-center gap-1.5">
              <MaterialCommunityIcons name="refresh" size={14} style={{ color: theme.ctaGradient[0] }} />
              <Text className="text-xs font-semibold" style={{ color: theme.ctaGradient[0] }}>Resend Code</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
      <LinearGradient colors={theme.ctaGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="rounded-lg overflow-hidden">
        <TouchableOpacity className="flex-row items-center justify-center py-3.5" onPress={onVerify} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-white text-sm font-semibold">Verify Code</Text>}
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
});

const ResetStep = memo(({ newPassword, setNewPassword, confirmPassword, setConfirmPassword, loading, onReset, theme }: any) => {
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <View className="gap-3 flex-1 justify-center pb-4">
      <View className="items-center mb-2">
        <MaterialCommunityIcons name="lock-reset" size={40} style={{ color: theme.ctaGradient[0] }} />
      </View>
      <Text className="text-2xl font-bold text-center" style={{ color: theme.ctaGradient[0] }}>New Password</Text>
      <Text className="text-xs text-center text-gray-600 leading-4 mb-3">Create a strong password</Text>

      <View className="border border-gray-300 rounded-lg px-3 py-2 flex-row items-center gap-2 bg-gray-50 mb-2">
        <TextInput
          className="flex-1 text-sm text-black"
          placeholder="Password" placeholderTextColor="#999"
          value={newPassword} onChangeText={setNewPassword}
          secureTextEntry={!showPass} editable={!loading}
        />
        <TouchableOpacity onPress={() => setShowPass(!showPass)} className="p-1">
          <MaterialCommunityIcons name={showPass ? 'eye-off' : 'eye'} size={18} color="#666" />
        </TouchableOpacity>
      </View>

      <View className="border border-gray-300 rounded-lg px-3 py-2 flex-row items-center gap-2 bg-gray-50 mb-3">
        <TextInput
          className="flex-1 text-sm text-black"
          placeholder="Confirm" placeholderTextColor="#999"
          value={confirmPassword} onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirm} editable={!loading}
        />
        <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} className="p-1">
          <MaterialCommunityIcons name={showConfirm ? 'eye-off' : 'eye'} size={18} color="#666" />
        </TouchableOpacity>
      </View>

      <LinearGradient colors={theme.ctaGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="rounded-lg overflow-hidden">
        <TouchableOpacity className="flex-row items-center justify-center py-3.5" onPress={onReset} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-white text-sm font-semibold">Reset Password</Text>}
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
});

// ============================================================================
// MAIN SCREEN
// ============================================================================

const ForgetPasswordScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProps>();
  const theme = useThemePalette();

  const [step, setStep] = useState<number>(0);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [otpStatus, setOtpStatus] = useState<'pending' | 'success' | 'failure'>('pending');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Timer Effect
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Keyboard Listener
  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Handlers
  const showError = useCallback((msg: unknown) => {
    const message = typeof msg === 'string' ? msg : toHumanReadableError(msg as any);
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }, []);

  const handleSendOTP = useCallback(async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showError('Valid email required');
    setLoading(true);
    try {
      const res = await forgotPasswordRequest({ email });
      if (res?.message) {
        setStep(1);
        setTimer(60);
        setOtp(['', '', '', '']);
      } else showError(res?.message || 'Failed to send OTP');
    } catch (err: any) { showError(err?.message || 'Error sending OTP'); }
    finally { setLoading(false); }
  }, [email, showError]);

  const handleVerifyOTP = useCallback(async () => {
    const code = otp.join('');
    if (code.length !== 4) return showError('Enter 4-digit OTP');
    setLoading(true);
    try {
      const res = await verifyOtpRequest({ email, otp: code });
      if (res?.message) {
        setOtpStatus('success');
        setTimeout(() => { setStep(2); setOtpStatus('pending'); }, 1000);
      } else { setOtpStatus('failure'); showError(res?.message || 'Invalid OTP'); }
    } catch (err: any) { setOtpStatus('failure'); showError(err?.message || 'Error verifying OTP'); }
    finally { setLoading(false); }
  }, [email, otp, showError]);

  const handleResendOTP = useCallback(async () => {
    if (timer > 0) return;
    setLoading(true);
    try {
      const res = await forgotPasswordRequest({ email });
      if (res?.message) { setTimer(60); setOtp(['', '', '', '']); showError('OTP resent'); }
      else showError(res?.message || 'Failed to resend');
    } catch (err: any) { showError(err?.message || 'Error resending'); }
    finally { setLoading(false); }
  }, [email, timer, showError]);

  const handleResetPassword = useCallback(async () => {
    if (!newPassword || newPassword !== confirmPassword) return showError('Passwords must match');
    if (newPassword.length < 6) return showError('Password too short');
    setLoading(true);
    try {
      const res = await resetPasswordRequest({ email, otp: otp.join(''), password: newPassword });
      if (res?.message) {
        showError('Reset Successful!');
        setTimeout(() => navigation.navigate('SignIn'), 1500);
      } else showError(res?.message || 'Reset failed');
    } catch (err: any) { showError(err?.message || 'Error resetting'); }
    finally { setLoading(false); }
  }, [email, otp, newPassword, confirmPassword, navigation, showError]);

  // Auto-verify OTP
  useEffect(() => {
    if (step === 1 && otp.every(d => d !== '')) handleVerifyOTP();
  }, [otp, step, handleVerifyOTP]);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.surfaceColor }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }} className="px-5 py-0" keyboardShouldPersistTaps="handled">
          <View className="flex-row items-center justify-between mb-6 mt-[-5px]"><View className="w-10" /></View>

          <StepIndicator step={step} />

          {step === 0 && (
            <EmailStep
              email={email} setEmail={setEmail} loading={loading}
              onSend={handleSendOTP} theme={theme} keyboardVisible={keyboardVisible}
            />
          )}

          {step === 1 && (
            <OtpStep
              otp={otp} setOtp={setOtp} otpStatus={otpStatus}
              loading={loading} onVerify={handleVerifyOTP} onResend={handleResendOTP}
              timer={timer} email={email} theme={theme}
            />
          )}

          {step === 2 && (
            <ResetStep
              newPassword={newPassword} setNewPassword={setNewPassword}
              confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
              loading={loading} onReset={handleResetPassword} theme={theme}
            />
          )}

          <TouchableOpacity className="items-center py-2 mb-5" onPress={() => navigation.navigate('SignIn')}>
            <Text className="text-lg dark:text-white text-slate-900" style={{ fontFamily: theme.serifFontFamily }}>
              ← Back to Sign In
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default memo(ForgetPasswordScreen);
