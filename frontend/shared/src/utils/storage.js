/**
 * storage.js
 *
 * CLEAN – PLAIN TEXT – NO DEVICE ID – ANDROID SAFE
 *
 * Location: frontend/instachat/src/utils/storage.js
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TOKEN: 'userToken',
  USER: 'userData',
};

const Storage = {
  /* =========================
     AUTH STORAGE
  ========================= */

  setToken: async (token) => {
    if (!token) return;
    try {
      await AsyncStorage.setItem(KEYS.TOKEN, token);
    } catch (e) {
      console.error('Failed to save token:', e);
    }
  },

  getToken: async () => {
    try {
      return await AsyncStorage.getItem(KEYS.TOKEN);
    } catch {
      return null;
    }
  },

  setUser: async (user) => {
    if (!user) return;
    try {
      await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save user:', e);
    }
  },

  getUser: async () => {
    try {
      const val = await AsyncStorage.getItem(KEYS.USER);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  },

  clearSession: async () => {
    try {
      await AsyncStorage.multiRemove([
        KEYS.TOKEN,
        KEYS.USER,
      ]);
    } catch (e) {
      console.error('Failed to clear session:', e);
    }
  },
};

export default Storage;
