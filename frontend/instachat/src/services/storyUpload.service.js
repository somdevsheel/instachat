import * as ImagePicker from 'expo-image-picker';
import api from './api';

// ================================
// Pick Story Image
// ================================
export const pickStoryImage = async () => {
  const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Media permission denied');
  }

  const result =
    await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

  if (result.canceled) return null;

  return result.assets[0];
};

// ================================
// Upload Image to S3 (Presigned PUT)
// ================================
export const uploadStoryToS3 = async ({
  uri,
  mimeType,
}) => {
  const presignRes = await api.post(
    '/media/presign',
    {
      mediaType: 'image',
      mimeType,
    }
  );

  const { uploadUrl, key } =
    presignRes.data.data;

  const fileRes = await fetch(uri);
  const blob = await fileRes.blob();

  const s3Res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': mimeType,
    },
    body: blob,
  });

  if (!s3Res.ok) {
    throw new Error('S3 upload failed');
  }

  return key;
};

// ================================
// Create Story
// ================================
export const createStory = async () => {
  const image = await pickStoryImage();
  if (!image) return;

  const key = await uploadStoryToS3({
    uri: image.uri,
    mimeType:
      image.mimeType || 'image/jpeg',
  });

  await api.post('/stories', {
    key,
    mediaType: 'image',
  });
};
