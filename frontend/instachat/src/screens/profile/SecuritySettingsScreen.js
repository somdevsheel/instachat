import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SecuritySettingsScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Security</Text>

      <Text style={styles.item}>Change password</Text>
      <Text style={styles.item}>Login activity</Text>
      <Text style={styles.item}>Two-factor authentication</Text>
      <Text style={styles.item}>Emails from Instagram</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  item: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    fontSize: 16,
  },
});

export default SecuritySettingsScreen;
