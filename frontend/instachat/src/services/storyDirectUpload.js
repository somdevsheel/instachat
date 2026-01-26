import * as FileSystem from 'expo-file-system/legacy';
import api from './api';

/**
 * Direct Story Upload (Expo SDK 54+ safe)
 */
export const uploadStoryDirect = async ({
  uri,
  mimeType = 'image/jpeg',
}) => {
  if (!uri) {
    throw new Error('Missing file URI');
  }

  // 1️⃣ Get presigned URL
  const presignRes = await api.post('/media/presign', {
    mediaType: mimeType.startsWith('video')
      ? 'video'
      : 'image',
    mimeType,
  });

  const { uploadUrl, key } = presignRes.data.data;

  // 2️⃣ Upload directly to S3
  const result = await FileSystem.uploadAsync(
    uploadUrl,
    uri,
    {
      httpMethod: 'PUT',
      headers: {
        'Content-Type': mimeType,
      },
    }
  );

  if (result.status !== 200) {
    throw new Error(`S3 upload failed (${result.status})`);
  }

  // 3️⃣ Create story record
  await api.post('/stories', {
    key,
    mediaType: mimeType.startsWith('video')
      ? 'video'
      : 'image',
  });

  return true;
};
