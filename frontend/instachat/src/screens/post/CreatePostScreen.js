import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Ionicons } from '@expo/vector-icons';

import { uploadQueue } from '../../utils/uploadQueue';

const MAX_VIDEO_MB = 100;

const CreatePostScreen = ({ navigation }) => {
  const [file, setFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [caption, setCaption] = useState('');
  const [processing, setProcessing] = useState(false);

  /* =========================
     MEDIA PERMISSION
  ========================= */
  const ensurePermission = async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        'Please allow access to your media'
      );
      return false;
    }
    return true;
  };

  /* =========================
     PICK IMAGE / VIDEO
  ========================= */
  const openGallery = async () => {
    const ok = await ensurePermission();
    if (!ok) return;

    try {
      setProcessing(true);

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          allowsEditing: false,
          quality: 1,
          videoMaxDuration: 180,
        });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];

      /* ---------- IMAGE ---------- */
      if (asset.type === 'image') {
        setFile({
          uri: asset.uri,
          type: asset.mimeType || 'image/jpeg',
          name: asset.fileName || asset.uri.split('/').pop(),
          isVideo: false,
        });
        setThumbnail(null);
        return;
      }

      /* ---------- VIDEO ---------- */
      if (asset.type === 'video') {
        const sizeMB =
          asset.fileSize
            ? asset.fileSize / (1024 * 1024)
            : null;

        if (sizeMB && sizeMB > MAX_VIDEO_MB) {
          Alert.alert(
            'Large video selected',
            'Upload may take longer on slow networks'
          );
        }

        const thumb =
          await VideoThumbnails.getThumbnailAsync(
            asset.uri,
            { time: 500 }
          );

        setThumbnail(thumb.uri);

        setFile({
          uri: asset.uri,
          type: asset.mimeType || 'video/mp4',
          name: asset.fileName || asset.uri.split('/').pop(),
          isVideo: true,
          sizeMB,
        });
      }
    } catch (err) {
      console.error('❌ Media picker error:', err);
      Alert.alert('Failed to select media');
    } finally {
      setProcessing(false);
    }
  };

  /* =========================
     SHARE POST
  ========================= */
  const handleShare = () => {
    if (!file) {
      Alert.alert('Please select an image or video');
      return;
    }

    uploadQueue.add({
      id: Date.now().toString(),
      file,
      thumbnail,
      caption: caption.trim(),
    });

    setFile(null);
    setThumbnail(null);
    setCaption('');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={26} color="#fff" />
          </Pressable>

          <Text style={styles.headerTitle}>New Post</Text>

          <Pressable onPress={handleShare} disabled={!file}>
            <Text
              style={[
                styles.shareText,
                !file && { opacity: 0.4 },
              ]}
            >
              Share
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Pressable
            onPress={openGallery}
            style={styles.mediaBox}
          >
            {processing ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : file ? (
              <>
                <Image
                  source={{ uri: thumbnail || file.uri }}
                  style={styles.media}
                />
                {file.isVideo && (
                  <Ionicons
                    name="play-circle"
                    size={48}
                    color="#fff"
                    style={styles.playIcon}
                  />
                )}
              </>
            ) : (
              <View style={styles.placeholder}>
                <Ionicons
                  name="images-outline"
                  size={70}
                  color="#777"
                />
                <Text style={styles.placeholderText}>
                  Tap to choose image or video
                </Text>
              </View>
            )}
          </Pressable>

          <View style={styles.captionBox}>
            <TextInput
              placeholder="Write a caption..."
              placeholderTextColor="#888"
              value={caption}
              onChangeText={setCaption}
              multiline
              style={styles.captionInput}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreatePostScreen;

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000',
  },

  header: {
    height: 50,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderBottomColor: '#222',
  },

  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },

  shareText: {
    color: '#1DA1F2',
    fontSize: 16,
    fontWeight: '600',
  },

  content: {
    paddingBottom: 40,
  },

  mediaBox: {
    height: 320,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },

  media: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  playIcon: {
    position: 'absolute',
    alignSelf: 'center',
  },

  placeholder: {
    alignItems: 'center',
  },

  placeholderText: {
    color: '#888',
    marginTop: 12,
  },

  captionBox: {
    padding: 15,
  },

  captionInput: {
    color: '#fff',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
