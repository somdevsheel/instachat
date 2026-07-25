// Drop-in replacement for @react-native-async-storage/async-storage,
// backed by window.localStorage. Aliased in vite.config.js so the shared
// package's Storage/storySlice code works unmodified on web — see
// frontend/shared/src/utils/storage.js and redux/slices/storySlice.js.
const AsyncStorage = {
  async getItem(key) {
    return window.localStorage.getItem(key);
  },

  async setItem(key, value) {
    window.localStorage.setItem(key, value);
  },

  async removeItem(key) {
    window.localStorage.removeItem(key);
  },

  async multiRemove(keys) {
    keys.forEach((key) => window.localStorage.removeItem(key));
  },
};

export default AsyncStorage;
