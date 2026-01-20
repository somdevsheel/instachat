import * as SecureStore from 'expo-secure-store';

export const saveSecure = async (key, value) => {
  await SecureStore.setItemAsync(key, value);
};

export const getSecure = async (key) => {
  return await SecureStore.getItemAsync(key);
};
