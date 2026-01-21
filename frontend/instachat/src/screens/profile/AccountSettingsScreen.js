import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ROUTES } from '../../navigation/routes.constants';

const Row = ({ label, onPress }) => (
  <TouchableOpacity style={styles.row} onPress={onPress}>
    <Text style={styles.text}>{label}</Text>
    <Ionicons name="chevron-forward" size={18} color="#888" />
  </TouchableOpacity>
);

const AccountSettingsScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Account</Text>

      <Row
        label="Username"
        onPress={() => {
          // future: edit username
        }}
      />

      <Row
        label="Email"
        onPress={() => {
          // future: change email
        }}
      />

      <Row
        label="Phone number"
        onPress={() => {
          // future: change phone
        }}
      />

      <Row
        label="Personal information"
        onPress={() => {
          // future: personal info screen
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  row: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
  },
});

export default AccountSettingsScreen;
