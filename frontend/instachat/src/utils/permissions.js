import { Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { Camera } from 'expo-camera';

/**
 * 1. Media Library Permission
 */
export const getMediaLibraryPermission = async () => {
  try {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need access to your photos to upload media.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }
    return true;
  } catch (error) {
    console.log('[Permission Error] Media Library:', error);
    return false;
  }
};

/**
 * 2. Camera Permission
 */
export const getCameraPermission = async () => {
  try {
    const { status } =
      await Camera.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission',
        'We need access to your camera to record video.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }
    return true;
  } catch (error) {
    console.log('[Permission Error] Camera:', error);
    return false;
  }
};

/**
 * 3. Microphone Permission
 */
export const getMicrophonePermission = async () => {
  try {
    const { status } =
      await Audio.requestPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Microphone Permission',
        'We need access to your microphone to record audio.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }
    return true;
  } catch (error) {
    console.log('[Permission Error] Microphone:', error);
    return false;
  }
};
