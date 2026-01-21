import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@instachat_upload_queue';

export const saveQueue = async queue => {
  await AsyncStorage.setItem(KEY, JSON.stringify(queue));
};

export const loadQueue = async () => {
  const data = await AsyncStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
};

export const clearQueue = async () => {
  await AsyncStorage.removeItem(KEY);
};
