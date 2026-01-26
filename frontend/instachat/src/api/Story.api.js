import api from '../services/api';
import axios from 'axios';
// ✅ Use legacy API to avoid deprecation warnings
import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

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
      // ✅ Process image to ensure it's in JPEG format
      console.log('🖼️ Processing image...');
      
      const manipulated = await manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }], // Resize to reasonable size
        { 
          compress: 0.8, 
          format: SaveFormat.JPEG // ✅ Force JPEG format
        }
      );

      processedUri = manipulated.uri;
      console.log('✅ Image processed:', processedUri);

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(processedUri);
      console.log('📊 Image file info:', fileInfo);

      if (!fileInfo.exists) {
        throw new Error('Processed image file not found');
      }

      fileSizeMB = fileInfo.size / (1024 * 1024);
      
      if (fileSizeMB > 10) {
        throw new Error('Image must be under 10MB');
      }

      mimeType = 'image/jpeg';

      console.log('📊 Image details:', {
        size: fileSizeMB.toFixed(2) + ' MB',
        mimeType: mimeType,
      });
    } else if (type === 'video') {
      // For video
      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log('📊 Video file info:', fileInfo);

      if (!fileInfo.exists) {
        throw new Error('Video file not found');
      }

      fileSizeMB = fileInfo.size / (1024 * 1024);
      
      if (fileSizeMB > 50) {
        throw new Error('Video must be under 50MB');
      }

      mimeType = 'video/mp4';

      console.log('📊 Video details:', {
        size: fileSizeMB.toFixed(2) + ' MB',
        mimeType: mimeType,
      });
    }

    // Step 2: Get presigned URL
    const presignRes = await api.post('/media/presign', {
      mediaType: type,
      mimeType: mimeType,
      fileSizeMB: Math.ceil(fileSizeMB),
    });

    if (!presignRes.data?.success) {
      throw new Error('Failed to get upload URL');
    }

    const { uploadUrl, key } = presignRes.data.data;
    console.log('🔑 Got presigned URL, key:', key);

    // Step 3: Upload to S3 using axios with proper headers
    console.log('⬆️ Uploading to S3...');
    console.log('📤 Upload URL:', uploadUrl.substring(0, 100) + '...');
    
    // Read file as base64 then convert to blob
    const base64 = await FileSystem.readAsStringAsync(processedUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Convert base64 to binary
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Create proper blob with correct MIME type
    const blob = new Blob([bytes], { type: mimeType });
    console.log('📦 Blob created:', { size: blob.size, type: blob.type });

    const uploadResponse = await axios.put(uploadUrl, blob, {
      headers: {
        'Content-Type': mimeType,
        'x-amz-acl': 'public-read', // Ensure public read access
      },
      timeout: 120000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        console.log('📤 Upload progress:', percentCompleted + '%');
      },
    });

    console.log('✅ Upload response:', uploadResponse.status);

    // Step 4: Create story record
    const storyRes = await api.post('/stories', {
      key,
      mediaType: type,
    });

    if (!storyRes.data?.success) {
      throw new Error('Failed to create story');
    }

    console.log('✅ Story created:', storyRes.data.data._id);

    return storyRes.data;
  } catch (err) {
    console.error('❌ uploadStory error:', err?.response?.data || err.message);
    throw err;
  }
};

export const getStoryFeed = async () => {
  try {
    const res = await api.get('/stories/feed');

    if (!res?.data?.success) {
      throw new Error('Failed to fetch stories');
    }

    return res.data;
  } catch (err) {
    console.error('❌ getStoryFeed error:', err?.response?.data || err.message);
    throw err;
  }
};

export const deleteStory = async (storyId) => {
  try {
    const res = await api.delete(`/stories/${storyId}`);
    return res.data;
  } catch (err) {
    console.error('❌ deleteStory error:', err?.response?.data || err.message);
    throw err;
  }
};



/* =========================
   MARK STORIES AS SEEN
   POST /api/v1/stories/seen
========================= */
export const markStoriesSeen = async (storyIds = []) => {
  try {
    if (!Array.isArray(storyIds) || storyIds.length === 0) {
      return;
    }

    const res = await api.post('/stories/seen', {
      storyIds,
    });

    if (!res?.data?.success) {
      throw new Error('Failed to mark stories as seen');
    }

    return res.data;
  } catch (err) {
    console.error(
      '❌ markStoriesSeen error:',
      err?.response?.data || err.message
    );
    throw err;
  }
};
