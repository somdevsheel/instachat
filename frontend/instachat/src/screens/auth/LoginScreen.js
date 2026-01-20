import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { loginUser } from '../../redux/slices/authSlice';
import { ROUTES } from '../../navigation/routes.constants';
import colors from '../../theme/colors';
// import axios from '../../api/axios'; // adjust path if needed

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Forgot password state
  const [forgotVisible, setForgotVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Please enter email and password');
      return;
    }

    setSubmitting(true);

    const result = await dispatch(
      loginUser({
        email: email.trim().toLowerCase(),
        password,
      })
    );

    setSubmitting(false);

    if (!loginUser.fulfilled.match(result)) {
      Alert.alert(
        'Login failed',
        result.payload || 'Invalid email or password'
      );
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      Alert.alert('Missing email', 'Please enter your email');
      return;
    }

    try {
      setForgotLoading(true);

      await axios.post('/auth/forgot-password', {
        email: forgotEmail.trim().toLowerCase(),
      });

      Alert.alert(
        'Check your email',
        'Password reset instructions have been sent.'
      );

      setForgotVisible(false);
      setForgotEmail('');
    } catch (error) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Something went wrong'
      );
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>InstaChat</Text>

      {/* Email */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        selectionColor="#000"
      />

      {/* Password (masked dots BLACK) */}
      <TextInput
        style={[styles.input, styles.passwordInput]}
        placeholder="Password"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        selectionColor="#000"
      />

      {/* Forgot password */}
      <TouchableOpacity
        style={styles.forgotLink}
        onPress={() => setForgotVisible(true)}
      >
        <Text style={styles.forgotText}>Forgot password?</Text>
      </TouchableOpacity>

      {/* Login button */}
      <TouchableOpacity
        style={[
          styles.button,
          submitting && styles.buttonDisabled,
        ]}
        onPress={handleLogin}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Log In</Text>
        )}
      </TouchableOpacity>

      {/* Signup */}
      <TouchableOpacity
        onPress={() => navigation.navigate(ROUTES.SIGNUP)}
        style={styles.signupLink}
      >
        <Text style={styles.signupText}>
          Don’t have an account?{' '}
          <Text style={styles.signupHighlight}>Sign up</Text>
        </Text>
      </TouchableOpacity>

      {/* Forgot Password Modal */}
      <Modal
        visible={forgotVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setForgotVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Reset Password</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              value={forgotEmail}
              onChangeText={setForgotEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              selectionColor="#000"
            />

            <TouchableOpacity
              style={styles.button}
              onPress={handleForgotPassword}
              disabled={forgotLoading}
            >
              {forgotLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  Send reset link
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelLink}
              onPress={() => setForgotVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default LoginScreen;

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#000',
  },

  input: {
    width: '100%',
    padding: 14,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#DBDBDB',
    borderRadius: 6,
    marginBottom: 14,
    fontSize: 16,
    color: '#000', // default text color
  },

  passwordInput: {
    color: '#000', // ✅ masked dots BLACK
  },

  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: 12,
  },

  forgotText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },

  button: {
    width: '100%',
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  signupLink: {
    marginTop: 24,
  },

  signupText: {
    color: colors.textSecondary,
    fontSize: 14,
  },

  signupHighlight: {
    color: colors.primary,
    fontWeight: '600',
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },

  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },

  cancelLink: {
    marginTop: 16,
    alignItems: 'center',
  },

  cancelText: {
    color: '#666',
    fontSize: 14,
  },
});
