import { mediaApi } from '@instachat/shared';

/**
 * Uploads a File (from an <input type="file">) directly to S3 via a
 * presigned URL, then returns the S3 key for the caller to attach to a
 * post/story/reel record. Mirrors the fetch+Blob pattern already used by
 * the mobile app's avatar upload (EditProfileScreen.js) — works on web
 * because File objects are already Blobs, no filesystem access needed.
 */
export async function uploadMediaFile(file, context) {
  const mediaType = file.type.startsWith('video') ? 'video' : 'image';
  const fileSizeMB = file.size / (1024 * 1024);

  const presignRes = await mediaApi.getPresignedUploadUrl({
    mediaType,
    mimeType: file.type,
    fileSizeMB,
    context,
  });

  const { uploadUrl, key } = presignRes.data;

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error('Upload to storage failed');
  }

  return { key, mediaType };
}
