import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { registerPushToken, removePushToken } from '../api/User.api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Requests permission, grabs the device's Expo push token, and registers
 * it with the backend against the currently logged-in user.
 * Returns the token on success, or null if permission was denied or this
 * is a simulator (Expo push tokens require a physical device).
 */
export const registerForPushNotifications = async () => {
  if (!Device.isDevice) {
    console.log('🔔 Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('🔔 Push notification permission denied');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.warn(
      '🔔 No EAS projectId configured — cannot fetch an Expo push token. Run `eas init`.'
    );
    return null;
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    await registerPushToken(token);
    return token;
  } catch (err) {
    console.error('🔔 Failed to register push token:', err.message);
    return null;
  }
};

export const unregisterPushNotifications = async (token) => {
  if (!token) return;
  try {
    await removePushToken(token);
  } catch (err) {
    console.error('🔔 Failed to remove push token:', err.message);
  }
};
