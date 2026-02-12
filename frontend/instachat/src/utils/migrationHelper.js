/**
 * migrationHelper.js
 * 
 * Run this ONCE after updating to fix device ID inconsistencies.
 * This will ensure the device is properly registered with the server.
 * 
 * Usage: Import and call migrateDeviceId() in your App.js after login
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';
import { getOrCreateKeyPair, getIdentityPublicKey } from './crypto/keyGeneration';

const DEVICE_ID_KEY = 'device_id';
const MIGRATION_DONE_KEY = 'device_id_migration_v2';

/**
 * Generate proper UUID v4
 */
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Migrate device ID from AsyncStorage to SecureStore (if needed)
 * and ensure consistent format
 */
export const migrateDeviceId = async () => {
  try {
    // Check if migration already done
    const migrationDone = await AsyncStorage.getItem(MIGRATION_DONE_KEY);
    if (migrationDone === 'true') {
      console.log('✅ Device ID migration already completed');
      return;
    }

    console.log('🔄 Starting device ID migration...');

    // Check both storage locations
    const asyncId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    const secureId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

    console.log('📊 Current state:');
    console.log('   AsyncStorage ID:', asyncId || '(none)');
    console.log('   SecureStore ID:', secureId || '(none)');

    let finalDeviceId;

    if (secureId && secureId.length === 36) {
      // SecureStore has valid UUID - use it
      finalDeviceId = secureId;
      console.log('✅ Using existing SecureStore ID');
    } else if (asyncId && asyncId.length === 36) {
      // AsyncStorage has valid UUID - migrate it
      finalDeviceId = asyncId;
      await SecureStore.setItemAsync(DEVICE_ID_KEY, finalDeviceId);
      console.log('✅ Migrated AsyncStorage ID to SecureStore');
    } else {
      // No valid ID - generate new one
      finalDeviceId = generateUUID();
      await SecureStore.setItemAsync(DEVICE_ID_KEY, finalDeviceId);
      console.log('✅ Generated new device ID:', finalDeviceId);
    }

    // Clean up AsyncStorage (optional, for consistency)
    if (asyncId) {
      await AsyncStorage.removeItem(DEVICE_ID_KEY);
      console.log('🧹 Cleaned up AsyncStorage');
    }

    // Re-register device with server
    console.log('📤 Re-registering device with server...');
    
    await getOrCreateKeyPair();
    const publicKey = await getIdentityPublicKey();

    await api.post('/keys', {
      identityPublicKey: publicKey,
      deviceId: finalDeviceId,
    });

    console.log('✅ Device re-registered successfully');

    // Mark migration as done
    await AsyncStorage.setItem(MIGRATION_DONE_KEY, 'true');
    console.log('✅ Migration complete!');

    return finalDeviceId;
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
};

/**
 * Debug helper: Show all device IDs
 */
export const debugDeviceIds = async () => {
  const asyncId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  const secureId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  
  console.log('═══════════════════════════════════');
  console.log('🔍 DEVICE ID DEBUG INFO');
  console.log('═══════════════════════════════════');
  console.log('AsyncStorage:', asyncId || '(empty)');
  console.log('  Length:', asyncId?.length || 0);
  console.log('SecureStore:', secureId || '(empty)');
  console.log('  Length:', secureId?.length || 0);
  console.log('Match:', asyncId === secureId ? '✅ YES' : '❌ NO');
  console.log('═══════════════════════════════════');
  
  return { asyncId, secureId };
};

/**
 * Force reset (USE WITH EXTREME CAUTION)
 * This will make ALL old messages unreadable!
 */
export const forceResetDeviceId = async () => {
  console.warn('⚠️ FORCE RESETTING DEVICE ID - OLD MESSAGES WILL BE UNREADABLE!');
  
  const newId = generateUUID();
  
  await AsyncStorage.removeItem(DEVICE_ID_KEY);
  await SecureStore.setItemAsync(DEVICE_ID_KEY, newId);
  await AsyncStorage.removeItem(MIGRATION_DONE_KEY);
  
  console.log('🔑 New device ID:', newId);
  
  return newId;
};
