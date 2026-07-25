import * as FileSystem from 'expo-file-system/legacy';
import { getPresignedUploadUrl } from '../api/Media.api';

/**
 * Uploads a picked image/video asset directly to S3 via a presigned URL,
 * mirroring the pattern already used for avatars (EditProfileScreen.js).
 * Returns the S3 key + resolved media type for attaching to a message.
 */
export async function uploadChatMedia(asset) {
  const mediaType = asset.type === 'video' ? 'video' : 'image';
  const mimeType = asset.mimeType || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg');

  const fileInfo = await FileSystem.getInfoAsync(asset.uri);
  const fileSizeMB = fileInfo.exists ? fileInfo.size / (1024 * 1024) : 0;

  const presignRes = await getPresignedUploadUrl({
    mediaType,
    mimeType,
    fileSizeMB,
    context: 'chat',
  });

  const { uploadUrl, key } = presignRes.data;

  const blob = await fetch(asset.uri).then((res) => res.blob());

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': mimeType },
    body: blob,
  });

  if (!uploadRes.ok) {
    throw new Error('Upload to storage failed');
  }

  return { key, mediaType };
}
