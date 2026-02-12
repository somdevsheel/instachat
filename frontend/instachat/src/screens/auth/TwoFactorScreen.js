import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';

import { verify2FA, clear2FA } from '../../redux/slices/authSlice';
import { resend2FA } from '../../api/Auth.api';
import colors from '../../theme/colors';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

const TwoFactorScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { email, tempUserId } = route.params;

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [submitting, setSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef([]);

  /* =========================
     RESEND TIMER
  ========================= */
  useEffect(() => {
    if (resendTimer <= 0) return;

    const timer = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resendTimer]);

  /* =========================
     HANDLE OTP INPUT
  ========================= */
  const handleChange = (text, index) => {
    // Allow only digits
    const digit = text.replace(/[^0-9]/g, '');

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-advance to next input
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (digit && index === OTP_LENGTH - 1) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === OTP_LENGTH) {
        handleVerify(fullOtp);
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
    }
  };

  /* =========================
     VERIFY OTP
  ========================= */
  const handleVerify = async (otpString) => {
    const code = otpString || otp.join('');

    if (code.length !== OTP_LENGTH) {
      return Alert.alert('Error', 'Please enter the complete verification code');
    }

    try {
      setSubmitting(true);

      const result = await dispatch(
        verify2FA({
          email,
          otp: code,
          tempUserId,
        })
      );

      if (!verify2FA.fulfilled.match(result)) {
        Alert.alert(
          'Verification Failed',
          result.payload || 'Invalid or expired code'
        );
        // Clear OTP inputs
        setOtp(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      }
      // If successful, authSlice sets isAuthenticated = true
      // AppNavigator handles navigation automatically
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================
     RESEND OTP
  ========================= */
  const handleResend = async () => {
    if (resendTimer > 0) return;

    try {
      setResending(true);
      const res = await resend2FA({ email, tempUserId });

      if (res.success) {
        setResendTimer(RESEND_COOLDOWN);
        setOtp(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
        Alert.alert('Code Sent', 'A new verification code has been sent to your email');
      }
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  /* =========================
     GO BACK
  ========================= */
  const handleBack = () => {
    dispatch(clear2FA());
    navigation.goBack();
  };

  /* =========================
     MASK EMAIL
  ========================= */
  const maskEmail = (emailStr) => {
    if (!emailStr) return '';
    const [name, domain] = emailStr.split('@');
    if (name.length <= 2) return `${name}@${domain}`;
    return `${name[0]}${'•'.repeat(name.length - 2)}${name[name.length - 1]}@${domain}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={48} color={colors.primary} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Two-Factor Authentication</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={styles.emailText}>{maskEmail(email)}</Text>
          </Text>

          {/* OTP Inputs */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.otpInput,
                  digit && styles.otpInputFilled,
                ]}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                autoFocus={index === 0}
                selectionColor={colors.primary}
              />
            ))}
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[
              styles.verifyBtn,
              (otp.join('').length < OTP_LENGTH || submitting) &&
                styles.verifyBtnDisabled,
            ]}
            onPress={() => handleVerify()}
            disabled={otp.join('').length < OTP_LENGTH || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.verifyBtnText}>Verify</Text>
            )}
          </TouchableOpacity>

          {/* Resend */}
          <View style={styles.resendContainer}>
            {resendTimer > 0 ? (
              <Text style={styles.resendTimerText}>
                Resend code in {resendTimer}s
              </Text>
            ) : (
              <TouchableOpacity
                onPress={handleResend}
                disabled={resending}
              >
                {resending ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.resendText}>Resend code</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Help text */}
          <Text style={styles.helpText}>
            Didn't receive the code? Check your spam folder or try
            resending.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default TwoFactorScreen;

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    paddingTop: 40,
  },

  /* Icon */
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },

  /* Text */
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emailText: {
    color: '#000',
    fontWeight: '600',
  },

  /* OTP */
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 32,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: '#DBDBDB',
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    backgroundColor: '#FAFAFA',
  },
  otpInputFilled: {
    borderColor: colors.primary,
    backgroundColor: '#f0f7ff',
  },

  /* Verify Button */
  verifyBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  verifyBtnDisabled: {
    opacity: 0.4,
  },
  verifyBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  /* Resend */
  resendContainer: {
    marginTop: 24,
    height: 30,
    justifyContent: 'center',
  },
  resendText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  resendTimerText: {
    color: '#999',
    fontSize: 14,
  },

  /* Help */
  helpText: {
    color: '#999',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});