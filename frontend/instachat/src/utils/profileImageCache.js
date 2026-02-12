import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Cache key prefix
 */
const CACHE_KEY_PREFIX = 'PROFILE_IMAGE_CACHE:';

/**
 * Generate deterministic local file path
 */
const getLocalPath = (userId) =>
  `${FileSystem.cacheDirectory}profile_${userId}.jpg`;

/**
 * Download & cache profile image
 */
export const cacheProfileImage = async (userId, remoteUrl) => {
  if (!userId || !remoteUrl) return remoteUrl;

  const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;
  const localPath = getLocalPath(userId);

  // 1️⃣ Check AsyncStorage
  const cachedPath = await AsyncStorage.getItem(cacheKey);
  if (cachedPath) {
    const info = await FileSystem.getInfoAsync(cachedPath);
    if (info.exists) {
      return cachedPath; // ✅ USE LOCAL CACHE
    }
  }

  // 2️⃣ Download from CDN (ONCE)
  try {
    const download = await FileSystem.downloadAsync(
      remoteUrl,
      localPath,
      {
        headers: {
          'Cache-Control': 'no-cache',
        },
      }
    );

    // 3️⃣ Persist local reference
    await AsyncStorage.setItem(cacheKey, download.uri);

    return download.uri;
  } catch (err) {
    console.warn('Profile image cache failed:', err.message);
    return remoteUrl; // fallback
  }
};

/**
 * Clear cache (used when profile picture changes)
 */
export const clearProfileImageCache = async (userId) => {
  const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;
  const localPath = getLocalPath(userId);

  await AsyncStorage.removeItem(cacheKey);
  const info = await FileSystem.getInfoAsync(localPath);
  if (info.exists) {
    await FileSystem.deleteAsync(localPath, { idempotent: true });
  }
};
