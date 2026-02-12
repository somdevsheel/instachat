// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   ActivityIndicator,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Ionicons } from '@expo/vector-icons';
// import { useDispatch } from 'react-redux';

// import { updatePassword } from '../../api/Auth.api';
// import { logout } from '../../redux/slices/authSlice';

// const ChangePasswordScreen = ({ navigation }) => {
//   const dispatch = useDispatch();

//   const [currentPassword, setCurrentPassword] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [loading, setLoading] = useState(false);

//   const handleChangePassword = async () => {
//     if (!currentPassword || !newPassword) {
//       return Alert.alert('Error', 'All fields are required');
//     }

//     if (newPassword.length < 8) {
//       return Alert.alert(
//         'Error',
//         'Password must be at least 8 characters'
//       );
//     }

//     try {
//       setLoading(true);

//       await updatePassword(currentPassword, newPassword);

//       Alert.alert(
//         'Password Updated',
//         'Your password was changed successfully. Please login again.',
//         [
//           {
//             text: 'OK',
//             onPress: () => {
//               // ✅ SINGLE SOURCE OF TRUTH
//               dispatch(logout());
//             },
//           },
//         ]
//       );
//     } catch (error) {
//       const status = error.response?.status;
//       const message =
//         error.response?.data?.message || 'Something went wrong';

//       if (status === 401) {
//         Alert.alert(
//           'Session Expired',
//           'Please login again.',
//           [
//             {
//               text: 'OK',
//               onPress: () => dispatch(logout()),
//             },
//           ]
//         );
//       } else if (status === 429) {
//         Alert.alert('Too Many Attempts', message);
//       } else {
//         Alert.alert('Failed', message);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()}>
//           <Ionicons name="arrow-back" size={24} />
//         </TouchableOpacity>
//         <Text style={styles.title}>Change Password</Text>
//       </View>

//       <TextInput
//         style={styles.input}
//         placeholder="Current password"
//         secureTextEntry
//         value={currentPassword}
//         onChangeText={setCurrentPassword}
//       />

//       <TextInput
//         style={styles.input}
//         placeholder="New password"
//         secureTextEntry
//         value={newPassword}
//         onChangeText={setNewPassword}
//       />

//       <TouchableOpacity
//         style={styles.btn}
//         onPress={handleChangePassword}
//         disabled={loading}
//       >
//         {loading ? (
//           <ActivityIndicator color="#fff" />
//         ) : (
//           <Text style={styles.btnText}>Update Password</Text>
//         )}
//       </TouchableOpacity>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 20, backgroundColor: '#fff' },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 30,
//   },
//   title: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginLeft: 15,
//   },
//   input: {
//     borderBottomWidth: 1,
//     borderBottomColor: '#ddd',
//     paddingVertical: 12,
//     fontSize: 16,
//     marginBottom: 20,
//   },
//   btn: {
//     backgroundColor: '#0095F6',
//     padding: 15,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginTop: 20,
//   },
//   btnText: { color: '#fff', fontWeight: 'bold' },
// });

// export default ChangePasswordScreen;








// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Ionicons } from '@expo/vector-icons';
// import { useDispatch } from 'react-redux';

// import { updatePassword } from '../../api/Auth.api';
// import { logout } from '../../redux/slices/authSlice';

// const ChangePasswordScreen = ({ navigation }) => {
//   const dispatch = useDispatch();

//   const [currentPassword, setCurrentPassword] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [loading, setLoading] = useState(false);

//   const [showCurrent, setShowCurrent] = useState(false);
//   const [showNew, setShowNew] = useState(false);
//   const [showConfirm, setShowConfirm] = useState(false);

//   /* =========================
//      VALIDATION
//   ========================= */
//   const isValid =
//     currentPassword.length >= 1 &&
//     newPassword.length >= 8 &&
//     confirmPassword === newPassword;

//   /* =========================
//      SUBMIT
//   ========================= */
//   const handleChangePassword = async () => {
//     if (!currentPassword || !newPassword) {
//       return Alert.alert('Error', 'All fields are required');
//     }

//     if (newPassword.length < 8) {
//       return Alert.alert(
//         'Error',
//         'New password must be at least 8 characters'
//       );
//     }

//     if (newPassword !== confirmPassword) {
//       return Alert.alert('Error', 'New passwords do not match');
//     }

//     if (currentPassword === newPassword) {
//       return Alert.alert(
//         'Error',
//         'New password must be different from current password'
//       );
//     }

//     try {
//       setLoading(true);

//       await updatePassword(currentPassword, newPassword);

//       Alert.alert(
//         'Password Updated',
//         'Your password was changed successfully. Please login again.',
//         [
//           {
//             text: 'OK',
//             onPress: () => dispatch(logout()),
//           },
//         ]
//       );
//     } catch (error) {
//       const status = error.response?.status;
//       const message =
//         error.response?.data?.message || 'Something went wrong';

//       if (status === 401) {
//         Alert.alert('Error', 'Current password is incorrect');
//       } else if (status === 429) {
//         Alert.alert('Too Many Attempts', message);
//       } else {
//         Alert.alert('Failed', message);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* =========================
//      PASSWORD INPUT
//   ========================= */
//   const PasswordInput = ({
//     placeholder,
//     value,
//     onChangeText,
//     showPassword,
//     onToggleShow,
//   }) => (
//     <View style={styles.inputContainer}>
//       <TextInput
//         style={styles.input}
//         placeholder={placeholder}
//         placeholderTextColor="#555"
//         secureTextEntry={!showPassword}
//         value={value}
//         onChangeText={onChangeText}
//         autoCapitalize="none"
//         selectionColor="#0095f6"
//       />
//       <TouchableOpacity
//         onPress={onToggleShow}
//         hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//       >
//         <Ionicons
//           name={showPassword ? 'eye-off-outline' : 'eye-outline'}
//           size={20}
//           color="#555"
//         />
//       </TouchableOpacity>
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* HEADER */}
//       <View style={styles.header}>
//         <TouchableOpacity
//           onPress={() => navigation.goBack()}
//           hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//         >
//           <Ionicons name="arrow-back" size={24} color="#fff" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Change password</Text>
//         <View style={{ width: 24 }} />
//       </View>

//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         style={{ flex: 1 }}
//       >
//         <ScrollView
//           contentContainerStyle={styles.scrollContent}
//           showsVerticalScrollIndicator={false}
//           keyboardShouldPersistTaps="handled"
//         >
//           {/* Info Text */}
//           <Text style={styles.infoText}>
//             Your password must be at least 8 characters and should
//             include a combination of numbers, letters, and special
//             characters.
//           </Text>

//           {/* Inputs */}
//           <Text style={styles.label}>Current password</Text>
//           <PasswordInput
//             placeholder="Enter current password"
//             value={currentPassword}
//             onChangeText={setCurrentPassword}
//             showPassword={showCurrent}
//             onToggleShow={() => setShowCurrent(!showCurrent)}
//           />

//           <Text style={styles.label}>New password</Text>
//           <PasswordInput
//             placeholder="Enter new password"
//             value={newPassword}
//             onChangeText={setNewPassword}
//             showPassword={showNew}
//             onToggleShow={() => setShowNew(!showNew)}
//           />

//           {/* Password strength indicator */}
//           {newPassword.length > 0 && (
//             <View style={styles.strengthContainer}>
//               <View style={styles.strengthBar}>
//                 <View
//                   style={[
//                     styles.strengthFill,
//                     {
//                       width:
//                         newPassword.length < 8
//                           ? '30%'
//                           : newPassword.length < 12
//                           ? '60%'
//                           : '100%',
//                       backgroundColor:
//                         newPassword.length < 8
//                           ? '#ED4956'
//                           : newPassword.length < 12
//                           ? '#fbbf24'
//                           : '#4ade80',
//                     },
//                   ]}
//                 />
//               </View>
//               <Text
//                 style={[
//                   styles.strengthText,
//                   {
//                     color:
//                       newPassword.length < 8
//                         ? '#ED4956'
//                         : newPassword.length < 12
//                         ? '#fbbf24'
//                         : '#4ade80',
//                   },
//                 ]}
//               >
//                 {newPassword.length < 8
//                   ? 'Too short'
//                   : newPassword.length < 12
//                   ? 'Good'
//                   : 'Strong'}
//               </Text>
//             </View>
//           )}

//           <Text style={styles.label}>Confirm new password</Text>
//           <PasswordInput
//             placeholder="Re-enter new password"
//             value={confirmPassword}
//             onChangeText={setConfirmPassword}
//             showPassword={showConfirm}
//             onToggleShow={() => setShowConfirm(!showConfirm)}
//           />

//           {/* Mismatch warning */}
//           {confirmPassword.length > 0 && confirmPassword !== newPassword && (
//             <Text style={styles.errorText}>Passwords do not match</Text>
//           )}

//           {/* Submit Button */}
//           <TouchableOpacity
//             style={[styles.btn, !isValid && styles.btnDisabled]}
//             onPress={handleChangePassword}
//             disabled={!isValid || loading}
//           >
//             {loading ? (
//               <ActivityIndicator color="#fff" />
//             ) : (
//               <Text style={styles.btnText}>Change password</Text>
//             )}
//           </TouchableOpacity>

//           {/* Forgot password link */}
//           <TouchableOpacity
//             style={styles.forgotBtn}
//             onPress={() =>
//               Alert.alert(
//                 'Forgot Password?',
//                 'Log out and use "Forgot Password" on the login screen to reset via email OTP.'
//               )
//             }
//           >
//             <Text style={styles.forgotText}>Forgot your password?</Text>
//           </TouchableOpacity>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// };

// /* =========================
//    STYLES
// ========================= */
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//   },

//   /* Header */
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingVertical: 14,
//     borderBottomWidth: 0.5,
//     borderBottomColor: '#262626',
//   },
//   headerTitle: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: '700',
//   },

//   /* Content */
//   scrollContent: {
//     padding: 16,
//     paddingBottom: 40,
//   },
//   infoText: {
//     color: '#888',
//     fontSize: 13,
//     lineHeight: 18,
//     marginBottom: 24,
//   },

//   /* Labels */
//   label: {
//     color: '#888',
//     fontSize: 13,
//     fontWeight: '600',
//     marginBottom: 8,
//     marginTop: 16,
//   },

//   /* Input */
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#1a1a1a',
//     borderRadius: 10,
//     borderWidth: 1,
//     borderColor: '#262626',
//     paddingHorizontal: 14,
//   },
//   input: {
//     flex: 1,
//     color: '#fff',
//     fontSize: 16,
//     paddingVertical: 14,
//   },

//   /* Strength */
//   strengthContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 8,
//   },
//   strengthBar: {
//     flex: 1,
//     height: 3,
//     backgroundColor: '#262626',
//     borderRadius: 2,
//     marginRight: 10,
//     overflow: 'hidden',
//   },
//   strengthFill: {
//     height: '100%',
//     borderRadius: 2,
//   },
//   strengthText: {
//     fontSize: 12,
//     fontWeight: '600',
//   },

//   /* Error */
//   errorText: {
//     color: '#ED4956',
//     fontSize: 12,
//     marginTop: 6,
//   },

//   /* Button */
//   btn: {
//     backgroundColor: '#0095f6',
//     paddingVertical: 14,
//     borderRadius: 10,
//     alignItems: 'center',
//     marginTop: 32,
//   },
//   btnDisabled: {
//     opacity: 0.4,
//   },
//   btnText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },

//   /* Forgot */
//   forgotBtn: {
//     alignItems: 'center',
//     paddingVertical: 16,
//   },
//   forgotText: {
//     color: '#0095f6',
//     fontSize: 14,
//     fontWeight: '600',
//   },
// });

// export default ChangePasswordScreen;








import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';

import { updatePassword } from '../../api/Auth.api';
import { logout } from '../../redux/slices/authSlice';

/* =========================
   PASSWORD INPUT (outside main component to prevent re-mount on state change)
========================= */
const PasswordInput = ({
  placeholder,
  value,
  onChangeText,
  showPassword,
  onToggleShow,
}) => (
  <View style={styles.inputContainer}>
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor="#555"
      secureTextEntry={!showPassword}
      value={value}
      onChangeText={onChangeText}
      autoCapitalize="none"
      selectionColor="#0095f6"
    />
    <TouchableOpacity
      onPress={onToggleShow}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons
        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
        size={20}
        color="#555"
      />
    </TouchableOpacity>
  </View>
);

const ChangePasswordScreen = ({ navigation }) => {
  const dispatch = useDispatch();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  /* =========================
     VALIDATION
  ========================= */
  const isValid =
    currentPassword.length >= 1 &&
    newPassword.length >= 8 &&
    confirmPassword === newPassword;

  /* =========================
     SUBMIT
  ========================= */
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      return Alert.alert('Error', 'All fields are required');
    }

    if (newPassword.length < 8) {
      return Alert.alert(
        'Error',
        'New password must be at least 8 characters'
      );
    }

    if (newPassword !== confirmPassword) {
      return Alert.alert('Error', 'New passwords do not match');
    }

    if (currentPassword === newPassword) {
      return Alert.alert(
        'Error',
        'New password must be different from current password'
      );
    }

    try {
      setLoading(true);

      await updatePassword(currentPassword, newPassword);

      Alert.alert(
        'Password Updated',
        'Your password was changed successfully. Please login again.',
        [
          {
            text: 'OK',
            onPress: () => dispatch(logout()),
          },
        ]
      );
    } catch (error) {
      const status = error.response?.status;
      const message =
        error.response?.data?.message || 'Something went wrong';

      if (status === 401) {
        Alert.alert('Error', 'Current password is incorrect');
      } else if (status === 429) {
        Alert.alert('Too Many Attempts', message);
      } else {
        Alert.alert('Failed', message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change password</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info Text */}
          <Text style={styles.infoText}>
            Your password must be at least 8 characters and should
            include a combination of numbers, letters, and special
            characters.
          </Text>

          {/* Inputs */}
          <Text style={styles.label}>Current password</Text>
          <PasswordInput
            placeholder="Enter current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            showPassword={showCurrent}
            onToggleShow={() => setShowCurrent(!showCurrent)}
          />

          <Text style={styles.label}>New password</Text>
          <PasswordInput
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={setNewPassword}
            showPassword={showNew}
            onToggleShow={() => setShowNew(!showNew)}
          />

          {/* Password strength indicator */}
          {newPassword.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBar}>
                <View
                  style={[
                    styles.strengthFill,
                    {
                      width:
                        newPassword.length < 8
                          ? '30%'
                          : newPassword.length < 12
                          ? '60%'
                          : '100%',
                      backgroundColor:
                        newPassword.length < 8
                          ? '#ED4956'
                          : newPassword.length < 12
                          ? '#fbbf24'
                          : '#4ade80',
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.strengthText,
                  {
                    color:
                      newPassword.length < 8
                        ? '#ED4956'
                        : newPassword.length < 12
                        ? '#fbbf24'
                        : '#4ade80',
                  },
                ]}
              >
                {newPassword.length < 8
                  ? 'Too short'
                  : newPassword.length < 12
                  ? 'Good'
                  : 'Strong'}
              </Text>
            </View>
          )}

          <Text style={styles.label}>Confirm new password</Text>
          <PasswordInput
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            showPassword={showConfirm}
            onToggleShow={() => setShowConfirm(!showConfirm)}
          />

          {/* Mismatch warning */}
          {confirmPassword.length > 0 && confirmPassword !== newPassword && (
            <Text style={styles.errorText}>Passwords do not match</Text>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.btn, !isValid && styles.btnDisabled]}
            onPress={handleChangePassword}
            disabled={!isValid || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Change password</Text>
            )}
          </TouchableOpacity>

          {/* Forgot password link */}
          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() =>
              Alert.alert(
                'Forgot Password?',
                'Log out and use "Forgot Password" on the login screen to reset via email OTP.'
              )
            }
          >
            <Text style={styles.forgotText}>Forgot your password?</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#262626',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  /* Content */
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  infoText: {
    color: '#888',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 24,
  },

  /* Labels */
  label: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },

  /* Input */
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#262626',
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 14,
  },

  /* Strength */
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  strengthBar: {
    flex: 1,
    height: 3,
    backgroundColor: '#262626',
    borderRadius: 2,
    marginRight: 10,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* Error */
  errorText: {
    color: '#ED4956',
    fontSize: 12,
    marginTop: 6,
  },

  /* Button */
  btn: {
    backgroundColor: '#0095f6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 32,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  /* Forgot */
  forgotBtn: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  forgotText: {
    color: '#0095f6',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ChangePasswordScreen;