import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { v4 as uuidv4 } from 'uuid';

const KEYS = {
  TOKEN: 'userToken',
  USER: 'userData',
};

const DEVICE_ID_KEY = 'device_id';

const Storage = {
  /* =========================
     AUTH STORAGE (UNCHANGED)
  ========================= */
  setToken: async (token) => {
    try {
      await AsyncStorage.setItem(KEYS.TOKEN, token);
    } catch (e) {}
  },

  getToken: async () => {
    try {
      return await AsyncStorage.getItem(KEYS.TOKEN);
    } catch (e) {
      return null;
    }
  },

  setUser: async (user) => {
    try {
      await AsyncStorage.setItem(
        KEYS.USER,
        JSON.stringify(user)
      );
    } catch (e) {}
  },

  getUser: async () => {
    try {
      const val = await AsyncStorage.getItem(KEYS.USER);
      return val ? JSON.parse(val) : null;
    } catch (e) {
      return null;
    }
  },

  clearSession: async () => {
    await AsyncStorage.multiRemove([
      KEYS.TOKEN,
      KEYS.USER,
    ]);
    // ⚠️ DO NOT delete deviceId
  },

  /* =========================
     🔐 DEVICE ID (CRITICAL)
  ========================= */
  getDeviceId: async () => {
    try {
      let deviceId = await SecureStore.getItemAsync(
        DEVICE_ID_KEY
      );

      if (!deviceId) {
        deviceId = uuidv4();
        await SecureStore.setItemAsync(
          DEVICE_ID_KEY,
          deviceId
        );
      }

      return deviceId;
    } catch (e) {
      // fallback (should never happen)
      return uuidv4();
    }
  },
};

export default Storage;
