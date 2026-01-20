import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadQueue } from '../utils/uploadQueue';

const QUEUE_KEY = '@instachat_upload_queue';

/**
 * Save queue to storage
 */
export const persistQueue = async () => {
  try {
    const serializableQueue = uploadQueue.queue.map((item) => ({
      id: item.id,
      file: item.file,
      caption: item.caption,
    }));

    await AsyncStorage.setItem(
      QUEUE_KEY,
      JSON.stringify(serializableQueue)
    );
  } catch (e) {
    console.warn('Failed to persist upload queue');
  }
};

/**
 * Restore queue on app resume
 */
export const restoreQueue = async () => {
  try {
    const stored = await AsyncStorage.getItem(QUEUE_KEY);
    if (!stored) return;

    const items = JSON.parse(stored);

    items.forEach((item) => {
      uploadQueue.add({
        ...item,
        onProgress: () => {},
        onStatus: () => {},
      });
    });

    await AsyncStorage.removeItem(QUEUE_KEY);
  } catch (e) {
    console.warn('Failed to restore upload queue');
  }
};

/**
 * AppState listener
 */
export const initBackgroundUpload = () => {
  AppState.addEventListener('change', async (state) => {
    if (state === 'background') {
      await persistQueue();
    }

    if (state === 'active') {
      await restoreQueue();
    }
  });
};
