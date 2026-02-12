// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   ActivityIndicator,
//   Alert,
// } from 'react-native';
// import { useDispatch } from 'react-redux';

// import { loginUser } from '../../redux/slices/authSlice';
// import { ROUTES } from '../../navigation/routes.constants';
// import colors from '../../theme/colors';

// const LoginScreen = ({ navigation }) => {
//   const dispatch = useDispatch();

//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [submitting, setSubmitting] = useState(false);

//   /* =========================
//      CLEAR PASSWORD ON LOAD
//      (Fixes login after reset)
//   ========================= */
//   useEffect(() => {
//     setPassword('');
//   }, []);

//   /* =========================
//      LOGIN
//   ========================= */
//   const handleLogin = async () => {
//     if (!email.trim() || !password) {
//       Alert.alert('Missing details', 'Please enter email and password');
//       return;
//     }

//     try {
//       setSubmitting(true);

//       const result = await dispatch(
//         loginUser({
//           email: email.trim().toLowerCase(),
//           password,
//         })
//       );

//       if (!loginUser.fulfilled.match(result)) {
//         Alert.alert(
//           'Login failed',
//           result.payload || 'Invalid email or password'
//         );
//       }
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>InstaChat</Text>

//       {/* Email */}
//       <TextInput
//         style={styles.input}
//         placeholder="Email"
//         placeholderTextColor="#999"
//         value={email}
//         onChangeText={setEmail}
//         autoCapitalize="none"
//         autoCorrect={false}
//         keyboardType="email-address"
//       />

//       {/* Password */}
//       <TextInput
//         style={styles.input}
//         placeholder="Password"
//         placeholderTextColor="#999"
//         value={password}
//         onChangeText={setPassword}
//         secureTextEntry
//       />

//       {/* Forgot password */}
//       <TouchableOpacity
//         style={styles.forgotLink}
//         onPress={() =>
//           navigation.navigate(ROUTES.FORGOT_PASSWORD_EMAIL)
//         }
//       >
//         <Text style={styles.forgotText}>Forgot password?</Text>
//       </TouchableOpacity>

//       {/* Login button */}
//       <TouchableOpacity
//         style={[
//           styles.button,
//           submitting && styles.buttonDisabled,
//         ]}
//         onPress={handleLogin}
//         disabled={submitting}
//       >
//         {submitting ? (
//           <ActivityIndicator color="#fff" />
//         ) : (
//           <Text style={styles.buttonText}>Log In</Text>
//         )}
//       </TouchableOpacity>

//       {/* Signup */}
//       <TouchableOpacity
//         onPress={() => navigation.navigate(ROUTES.SIGNUP)}
//         style={styles.signupLink}
//       >
//         <Text style={styles.signupText}>
//           Don’t have an account?{' '}
//           <Text style={styles.signupHighlight}>Sign up</Text>
//         </Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// export default LoginScreen;

// /* =========================
//    STYLES
// ========================= */

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     paddingHorizontal: 16,
//   },

//   title: {
//     fontSize: 32,
//     fontWeight: 'bold',
//     marginBottom: 40,
//     color: '#000',
//   },

//   input: {
//     width: '100%',
//     padding: 14,
//     backgroundColor: '#FAFAFA',
//     borderWidth: 1,
//     borderColor: '#DBDBDB',
//     borderRadius: 6,
//     marginBottom: 14,
//     fontSize: 16,
//     color: '#000',
//   },

//   forgotLink: {
//     alignSelf: 'flex-end',
//     marginBottom: 12,
//   },

//   forgotText: {
//     color: colors.primary,
//     fontSize: 14,
//     fontWeight: '500',
//   },

//   button: {
//     width: '100%',
//     backgroundColor: colors.primary,
//     padding: 14,
//     borderRadius: 6,
//     alignItems: 'center',
//     marginTop: 10,
//   },

//   buttonDisabled: {
//     opacity: 0.7,
//   },

//   buttonText: {
//     color: '#fff',
//     fontWeight: '600',
//     fontSize: 16,
//   },

//   signupLink: {
//     marginTop: 24,
//   },

//   signupText: {
//     color: colors.textSecondary,
//     fontSize: 14,
//   },

//   signupHighlight: {
//     color: colors.primary,
//     fontWeight: '600',
//   },
// });









import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { loginUser } from '../../redux/slices/authSlice';
import { ROUTES } from '../../navigation/routes.constants';
import colors from '../../theme/colors';

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { requires2FA, twoFactorEmail, twoFactorTempUserId } = useSelector(
    (state) => state.auth
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* =========================
     CLEAR PASSWORD ON LOAD
  ========================= */
  useEffect(() => {
    setPassword('');
  }, []);

  /* =========================
     NAVIGATE TO 2FA WHEN REQUIRED
  ========================= */
  useEffect(() => {
    if (requires2FA && twoFactorEmail && twoFactorTempUserId) {
      navigation.navigate(ROUTES.TWO_FACTOR_VERIFY, {
        email: twoFactorEmail,
        tempUserId: twoFactorTempUserId,
      });
    }
  }, [requires2FA, twoFactorEmail, twoFactorTempUserId, navigation]);

  /* =========================
     LOGIN
  ========================= */
  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Please enter email and password');
      return;
    }

    try {
      setSubmitting(true);

      const result = await dispatch(
        loginUser({
          email: email.trim().toLowerCase(),
          password,
        })
      );

      if (!loginUser.fulfilled.match(result)) {
        Alert.alert(
          'Login failed',
          result.payload || 'Invalid email or password'
        );
      }
      // If requires2FA, the useEffect above handles navigation
    } finally {
      setSubmitting(false);
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
      />

      {/* Password */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* Forgot password */}
      <TouchableOpacity
        style={styles.forgotLink}
        onPress={() =>
          navigation.navigate(ROUTES.FORGOT_PASSWORD_EMAIL)
        }
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
          Don't have an account?{' '}
          <Text style={styles.signupHighlight}>Sign up</Text>
        </Text>
      </TouchableOpacity>
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
    color: '#000',
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
});