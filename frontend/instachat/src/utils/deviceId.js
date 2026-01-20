import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = 'device_id';

/**
 * Generate a stable random device ID
 */
const generateId = () =>
  'xxxxxxx-xxxx-4xxx-yxxx-xxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });

export const getDeviceId = async () => {
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);

  if (!id) {
    id = generateId();
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
    console.log('🔐 Device ID generated:', id);
  }

  return id;
};
