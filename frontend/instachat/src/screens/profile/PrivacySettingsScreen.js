import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PrivacySettingsScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Privacy</Text>

      <Text style={styles.item}>Private account</Text>
      <Text style={styles.item}>Blocked accounts</Text>
      <Text style={styles.item}>Muted accounts</Text>
      <Text style={styles.item}>Story controls</Text>
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

export default PrivacySettingsScreen;
