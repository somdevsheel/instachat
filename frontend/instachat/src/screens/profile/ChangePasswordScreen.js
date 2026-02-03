import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';

import { updatePassword } from '../../api/Auth.api';
import { logout } from '../../redux/slices/authSlice';

const ChangePasswordScreen = ({ navigation }) => {
  const dispatch = useDispatch();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      return Alert.alert('Error', 'All fields are required');
    }

    if (newPassword.length < 8) {
      return Alert.alert(
        'Error',
        'Password must be at least 8 characters'
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
            onPress: () => {
              // ✅ SINGLE SOURCE OF TRUTH
              dispatch(logout());
            },
          },
        ]
      );
    } catch (error) {
      const status = error.response?.status;
      const message =
        error.response?.data?.message || 'Something went wrong';

      if (status === 401) {
        Alert.alert(
          'Session Expired',
          'Please login again.',
          [
            {
              text: 'OK',
              onPress: () => dispatch(logout()),
            },
          ]
        );
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Change Password</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Current password"
        secureTextEntry
        value={currentPassword}
        onChangeText={setCurrentPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="New password"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />

      <TouchableOpacity
        style={styles.btn}
        onPress={handleChangePassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Update Password</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  btn: {
    backgroundColor: '#0095F6',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  btnText: { color: '#fff', fontWeight: 'bold' },
});

export default ChangePasswordScreen;
