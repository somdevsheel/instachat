import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { uploadReel } from '../../api/Posts.api';
import { ROUTES } from '../../navigation/routes.constants';

const UploadScreen = ({ navigation }) => {
  const [videoUri, setVideoUri] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  /* ============================
     Pick Video
  ============================ */
  const pickVideo = async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'We need access to your gallery to upload videos.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];

      // ✅ Safety: ensure video
      if (!asset.type || asset.type !== 'video') {
        Alert.alert('Invalid file', 'Please select a video file.');
        return;
      }

      setVideoUri(asset.uri);
    }
  };

  /* ============================
     Upload Reel
  ============================ */
  const handleUpload = async () => {
    if (!videoUri) {
      Alert.alert('Error', 'Please select a video first');
      return;
    }

    setLoading(true);

    try {
      await uploadReel(videoUri, caption);
      Alert.alert('Success', 'Reel uploaded successfully');

      setVideoUri(null);
      setCaption('');

      // ✅ Correct navigation back to Reels tab
      navigation.navigate(ROUTES.MAIN_TAB, {
        screen: ROUTES.REELS,
      });
    } catch (error) {
      console.error(error);
      Alert.alert(
        'Upload Failed',
        error.response?.data?.message ||
          'Could not upload video'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>New Reel</Text>

      {/* Video Preview */}
      {videoUri ? (
        <View style={styles.previewContainer}>
          <Video
            source={{ uri: videoUri }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
          />
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => setVideoUri(null)}
          >
            <Ionicons
              name="close-circle"
              size={30}
              color="white"
            />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.uploadBox}
          onPress={pickVideo}
        >
          <Ionicons
            name="cloud-upload-outline"
            size={50}
            color={colors.textSecondary}
          />
          <Text style={styles.uploadText}>
            Tap to select video
          </Text>
        </TouchableOpacity>
      )}

      {/* Caption */}
      <TextInput
        style={styles.input}
        placeholder="Write a caption..."
        value={caption}
        onChangeText={setCaption}
        multiline
      />

      {/* Upload Button */}
      <TouchableOpacity
        style={[
          styles.btn,
          (!videoUri || loading) && styles.disabledBtn,
        ]}
        onPress={handleUpload}
        disabled={!videoUri || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Share Reel</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    paddingTop: 50,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.textPrimary,
  },
  uploadBox: {
    height: 200,
    borderWidth: 2,
    borderColor: '#eee',
    borderStyle: 'dashed',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#FAFAFA',
  },
  uploadText: {
    marginTop: 10,
    color: colors.textSecondary,
  },
  previewContainer: {
    height: 300,
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  video: { width: '100%', height: '100%' },
  removeBtn: { position: 'absolute', top: 10, right: 10 },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#dbdbdb',
    padding: 10,
    fontSize: 16,
    marginBottom: 30,
    minHeight: 50,
  },
  btn: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  disabledBtn: { backgroundColor: '#A0CFFF' },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default UploadScreen;
