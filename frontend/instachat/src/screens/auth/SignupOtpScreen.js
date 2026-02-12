import React, { useState, useEffect } from 'react';
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
  ScrollView,
} from 'react-native';

import {
  verifyRegisterOtp,
  requestRegisterOtp,
} from '../../api/Auth.api';

import { ROUTES } from '../../navigation/routes.constants';
import colors from '../../theme/colors';

const RESEND_TIME = 30;

const SignupOtpScreen = ({ route, navigation }) => {
  const { email, fullName, username } = route.params;

  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [timer, setTimer] = useState(RESEND_TIME);
  const [resending, setResending] = useState(false);

  /* =========================
     RESEND TIMER
  ========================= */
  useEffect(() => {
    if (timer === 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  /* =========================
     VERIFY OTP
  ========================= */
  const handleVerify = async () => {
    if (!otp || !password) {
      Alert.alert('Missing data', 'OTP and password are required');
      return;
    }

    try {
      setLoading(true);

      await verifyRegisterOtp({
        email,
        otp: otp.trim(),
        password,
        username,
        fullName,
      });

      Alert.alert(
        'Success',
        'Account created successfully. Please log in.',
        [
          {
            text: 'OK',
            onPress: () =>
              navigation.reset({
                index: 0,
                routes: [{ name: ROUTES.LOGIN }],
              }),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Invalid or expired OTP'
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     RESEND OTP
  ========================= */
  const handleResendOtp = async () => {
    try {
      setResending(true);

      await requestRegisterOtp(email);

      Alert.alert(
        'OTP Sent',
        'A new OTP has been sent to your email'
      );

      setTimer(RESEND_TIME);
    } catch (error) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to resend OTP'
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Verify Email</Text>
        <Text style={styles.subtitle}>{email}</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter OTP"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={setOtp}
        />

        <TextInput
          style={styles.input}
          placeholder="Create password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {/* RESEND OTP */}
        <TouchableOpacity
          onPress={handleResendOtp}
          disabled={timer > 0 || resending}
          style={styles.resendContainer}
        >
          <Text
            style={[
              styles.resendText,
              timer > 0 && styles.resendDisabled,
            ]}
          >
            {timer > 0
              ? `Resend OTP in ${timer}s`
              : resending
              ? 'Sending...'
              : 'Resend OTP'}
          </Text>
        </TouchableOpacity>

        {/* VERIFY BUTTON */}
        <TouchableOpacity
          style={[
            styles.button,
            (loading || otp.length < 6) && styles.buttonDisabled,
          ]}
          onPress={handleVerify}
          disabled={loading || otp.length < 6}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              Verify & Create
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignupOtpScreen;

/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },

  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
    color: '#000',
  },

  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },

  input: {
    padding: 14,
    borderWidth: 1,
    borderColor: '#DBDBDB',
    borderRadius: 6,
    marginBottom: 14,
    backgroundColor: '#FAFAFA',
    fontSize: 16,
  },

  resendContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },

  resendText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },

  resendDisabled: {
    color: '#999',
  },

  button: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
