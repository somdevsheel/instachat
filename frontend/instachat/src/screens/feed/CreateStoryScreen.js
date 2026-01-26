import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';

import { uploadStoryDirect } from '../../services/storyDirectUpload';

const CreateStoryScreen = ({ navigation }) => {
  const cameraRef = useRef(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [cameraFacing, setCameraFacing] = useState('back');

  const [photoUri, setPhotoUri] = useState(null);
  const [videoUri, setVideoUri] = useState(null);

  const [capturing, setCapturing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const player = useVideoPlayer(videoUri || null, player => {
    if (videoUri) {
      player.loop = true;
      player.play();
    }
  });

  /* =====================
     PERMISSIONS
  ====================== */
  useEffect(() => {
    const init = async () => {
      if (!permission?.granted) {
        await requestPermission();
      }

      const { status } = await Audio.requestPermissionsAsync();
      if (status === 'granted') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      }
    };

    init();
  }, []);

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>
          Camera permission is required
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={styles.permissionBtn}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            Grant Permission
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* =====================
     TAKE PHOTO
  ====================== */
  const takePicture = async () => {
    if (!cameraRef.current || capturing) return;

    try {
      setCapturing(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: true,
      });

      setPhotoUri(photo.uri);
    } catch (err) {
      Alert.alert('Error', 'Failed to take photo');
    } finally {
      setCapturing(false);
    }
  };

  /* =====================
     PICK FROM GALLERY
  ====================== */
  const pickFromGallery = async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 1,
      videoMaxDuration: 15,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      asset.type === 'video'
        ? setVideoUri(asset.uri)
        : setPhotoUri(asset.uri);
    }
  };

  /* =====================
     UPLOAD STORY (FIXED)
  ====================== */
  const handleUpload = async () => {
    const uri = photoUri || videoUri;
    const isVideo = !!videoUri;

    if (!uri) return;

    try {
      setUploading(true);
      console.log('🚨 CREATE STORY DIRECT UPLOAD');

      let finalUri = uri;

      // Compress image safely
      if (!isVideo) {
        const processed =
          await ImageManipulator.manipulateAsync(
            uri,
            [],
            {
              compress: 1,
              format:
                ImageManipulator.SaveFormat.JPEG,
            }
          );
        finalUri = processed.uri;
      }

      await uploadStoryDirect({
        uri: finalUri,
        mimeType: isVideo
          ? 'video/mp4'
          : 'image/jpeg',
      });

      Alert.alert('Success', 'Story uploaded!');
      navigation.goBack();
    } catch (err) {
      console.error('❌ Story upload error:', err);
      Alert.alert(
        'Upload failed',
        err?.message || 'Something went wrong'
      );
    } finally {
      setUploading(false);
    }
  };

  /* =====================
     PREVIEW
  ====================== */
  if (photoUri || videoUri) {
    return (
      <View style={styles.previewContainer}>
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={styles.preview}
          />
        ) : (
          <VideoView
            player={player}
            style={styles.preview}
            contentFit="cover"
          />
        )}

        <View style={styles.previewActions}>
          <TouchableOpacity
            onPress={() => {
              setPhotoUri(null);
              setVideoUri(null);
            }}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareBtn}
            onPress={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.shareText}>
                Share to Story
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* =====================
     CAMERA VIEW
  ====================== */
  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraFacing}
      />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            setCameraFacing(f =>
              f === 'back' ? 'front' : 'back'
            )
          }
        >
          <Ionicons
            name="camera-reverse-outline"
            size={28}
            color="white"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.galleryBtn}
          onPress={pickFromGallery}
        >
          <Ionicons name="images-outline" size={28} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.captureBtn}
          onPress={takePicture}
          disabled={capturing}
        >
          {capturing ? (
            <ActivityIndicator color="white" />
          ) : (
            <View style={styles.innerCircle} />
          )}
        </TouchableOpacity>

        <View style={styles.galleryBtn} />
      </View>
    </View>
  );
};

export default CreateStoryScreen;

/* =====================
   STYLES
===================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  camera: { flex: 1 },

  topBar: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  bottomBar: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '80%',
  },

  galleryBtn: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },

  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 5,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },

  innerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'white',
  },

  previewContainer: { flex: 1, backgroundColor: 'black' },
  preview: { flex: 1 },

  previewActions: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  closeBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  shareBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 150,
    alignItems: 'center',
  },

  shareText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },

  center: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },

  permissionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },

  permissionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
});
