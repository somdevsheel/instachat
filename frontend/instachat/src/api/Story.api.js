import api from '../services/api';
import axios from 'axios';
// ✅ Use legacy API to avoid deprecation warnings
import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

/* =========================
   UPLOAD STORY
========================= */
export const uploadStory = async (uri, type) => {
  try {
    console.log('📤 Uploading story:', { uri, type });

    if (!uri || !type) {
      throw new Error('Story uri and type are required');
    }

    let processedUri = uri;
    let fileSizeMB;
    let mimeType;

    if (type === 'image') {
      const manipulated = await manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );

      processedUri = manipulated.uri;

      const fileInfo = await FileSystem.getInfoAsync(processedUri);
      if (!fileInfo.exists) {
        throw new Error('Processed image not found');
      }

      fileSizeMB = fileInfo.size / (1024 * 1024);
      if (fileSizeMB > 10) {
        throw new Error('Image must be under 10MB');
      }

      mimeType = 'image/jpeg';
    }

    if (type === 'video') {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('Video file not found');
      }

      fileSizeMB = fileInfo.size / (1024 * 1024);
      if (fileSizeMB > 50) {
        throw new Error('Video must be under 50MB');
      }

      mimeType = 'video/mp4';
    }

    // Presign
    const presignRes = await api.post('/media/presign', {
      mediaType: type,
      mimeType,
      fileSizeMB: Math.ceil(fileSizeMB),
    });

    const { uploadUrl, key } = presignRes.data.data;

    // Upload to S3
    const base64 = await FileSystem.readAsStringAsync(processedUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: mimeType });

    await axios.put(uploadUrl, blob, {
      headers: {
        'Content-Type': mimeType,
        'x-amz-acl': 'public-read',
      },
    });

    // Create story
    const storyRes = await api.post('/stories', {
      key,
      mediaType: type,
    });

    return storyRes.data;
  } catch (err) {
    console.error('❌ uploadStory error:', err?.response?.data || err.message);
    throw err;
  }
};

/* =========================
   GET STORY FEED
========================= */
export const getStoryFeed = async () => {
  const res = await api.get('/stories/feed');
  return res.data;
};

/* =========================
   DELETE STORY
========================= */
export const deleteStory = async (storyId) => {
  const res = await api.delete(`/stories/${storyId}`); // ✅ FIXED: Changed backtick to parentheses
  return res.data;
};

/* =========================
   MARK STORIES AS SEEN
========================= */
export const markStoriesSeen = async (storyIds = []) => {
  if (!Array.isArray(storyIds) || storyIds.length === 0) return;
  const res = await api.post('/stories/seen', { storyIds });
  return res.data;
};

/* =========================
   REACT TO STORY
   BACKEND: POST /stories/:id/react
========================= */
export const reactToStory = async (storyId, reaction) => {
  if (!storyId || !reaction) {
    throw new Error('storyId and reaction are required');
  }
  const res = await api.post(
    `/stories/${storyId}/react`,
    { reaction }
  );
  return res.data;
};

/* =========================
   GET STORY VIEWERS
========================= */
export const getStoryViewers = async (storyId) => {
  const res = await api.get(`/stories/${storyId}/viewers`); // ✅ FIXED: Changed backtick to parentheses
  return res.data;
};