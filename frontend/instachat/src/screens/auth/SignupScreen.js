import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { registerUser } from '../../redux/slices/authSlice';
import { ROUTES } from '../../navigation/routes.constants';
import colors from '../../theme/colors';

const SignupScreen = ({ navigation }) => {
  const dispatch = useDispatch();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSignup = async () => {
    if (
      !name.trim() ||
      !username.trim() ||
      !email.trim() ||
      !password
    ) {
      Alert.alert('Missing details', 'Please fill in all fields');
      return;
    }

    setSubmitting(true);

    const result = await dispatch(
      registerUser({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password,
      })
    );

    setSubmitting(false);

    if (!registerUser.fulfilled.match(result)) {
      Alert.alert(
        'Registration failed',
        result.payload || 'Unable to create account'
      );
      return;
    }

    Alert.alert(
      'Account created',
      'Your account has been created successfully'
    );

    // Optional: go back to login
    navigation.navigate(ROUTES.LOGIN);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>

      <TextInput
        style={styles.input}
        placeholder="Full name"
        placeholderTextColor="#999"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />

      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#999"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[
          styles.button,
          submitting && styles.buttonDisabled,
        ]}
        onPress={handleSignup}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign up</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate(ROUTES.LOGIN)}
        style={styles.loginLink}
      >
        <Text style={styles.loginText}>
          Already have an account?{' '}
          <Text style={styles.loginHighlight}>Log in</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default SignupScreen;

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
    marginBottom: 36,
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

  loginLink: {
    marginTop: 24,
  },

  loginText: {
    color: colors.textSecondary,
    fontSize: 14,
  },

  loginHighlight: {
    color: colors.primary,
    fontWeight: '600',
  },
});
