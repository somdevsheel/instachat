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
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { uploadStory } from '../../api/Story.api';

const CreateStoryScreen = ({ navigation }) => {
  const cameraRef = useRef(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [cameraFacing, setCameraFacing] = useState('back');
  const [cameraMode, setCameraMode] = useState('picture');

  const [photoUri, setPhotoUri] = useState(null);
  const [videoUri, setVideoUri] = useState(null);

  const [recording, setRecording] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [uploading, setUploading] = useState(false);

  /* =====================
     PERMISSIONS
  ====================== */
  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'white' }}>
          Camera permission is required
        </Text>
      </View>
    );
  }

  /* =====================
     PHOTO
  ====================== */
  const takePicture = async () => {
    if (!cameraRef.current || recording || capturing) return;

    try {
      setCameraMode('picture');
      setCapturing(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
      });

      setPhotoUri(photo.uri);
    } catch (err) {
      console.error('❌ Take photo error:', err?.message);
    } finally {
      setCapturing(false);
    }
  };

  /* =====================
     VIDEO
  ====================== */
  const startRecording = async () => {
    if (!cameraRef.current || recording) return;

    try {
      setCameraMode('video');
      setRecording(true);

      const video = await cameraRef.current.recordAsync({
        maxDuration: 15,
      });

      setVideoUri(video.uri);
    } catch (err) {
      console.error('❌ Record video error:', err?.message);
    } finally {
      setRecording(false);
    }
  };

  const stopRecording = async () => {
    if (cameraRef.current && recording) {
      await cameraRef.current.stopRecording();
    }
  };

  /* =====================
     UPLOAD STORY
  ====================== */
  const handleUpload = async () => {
    const uri = photoUri || videoUri;
    const type = videoUri ? 'video' : 'image';

    if (!uri) return;

    try {
      setUploading(true);
      await uploadStory(uri, type);

      Alert.alert('Success', 'Story uploaded');
      navigation.goBack();
    } catch (err) {
      console.error('❌ Upload story error:', err?.message);
      Alert.alert('Error', 'Failed to upload story');
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
            resizeMode="cover"
          />
        ) : (
          <Video
            source={{ uri: videoUri }}
            style={styles.preview}
            shouldPlay
            isLooping
            resizeMode="cover"
          />
        )}

        <View style={styles.previewActions}>
          <TouchableOpacity
            onPress={() => {
              setPhotoUri(null);
              setVideoUri(null);
            }}
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
              <Text style={styles.shareText}>Share</Text>
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
        mode={cameraMode}
      />

      {/* TOP BAR */}
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

      {/* BOTTOM BAR */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.captureBtn,
            recording && styles.recordingBtn,
          ]}
          onPress={takePicture}
          onLongPress={startRecording}
          onPressOut={stopRecording}
          delayLongPress={200}
        >
          {capturing ? (
            <ActivityIndicator color="white" />
          ) : (
            <View style={styles.innerCircle} />
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>
          Tap for photo · Hold for video
        </Text>
      </View>
    </View>
  );
};

export default CreateStoryScreen;

/* =====================
   STYLES
===================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },

  camera: {
    flex: 1,
  },

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

  recordingBtn: {
    borderColor: '#ff2d55',
  },

  innerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'white',
  },

  hint: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 8,
  },

  previewContainer: {
    flex: 1,
    backgroundColor: 'black',
  },

  preview: {
    flex: 1,
  },

  previewActions: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  shareBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
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
  },
});
