import api from '../services/api';

/**
 * ======================================================
 * REQUEST PRESIGNED S3 UPLOAD URL
 * POST /api/v1/media/presign
 * ======================================================
 *
 * @param {Object} params
 * @param {'image'|'video'} params.mediaType
 * @param {string} params.mimeType
 * @param {number} params.fileSizeMB
 *
 * @returns {Promise<{success: boolean, data: {uploadUrl: string, key: string, expiresIn: number}}>}
 */
export const getPresignedUploadUrl = async ({
  mediaType,
  mimeType,
  fileSizeMB,
}) => {
  try {
    console.log('📡 Requesting presign:', {
      mediaType,
      mimeType,
      fileSizeMB,
    });

    const res = await api.post('/media/presign', {
      mediaType,
      mimeType,
      fileSizeMB,
    });

    /**
     * Backend response shape:
     * {
     *   success: true,
     *   data: {
     *     uploadUrl,
     *     key,
     *     expiresIn
     *   }
     * }
     */
    if (!res?.data?.success) {
      throw new Error(res?.data?.message || 'Presign failed');
    }

    console.log('📦 Presign API response:', res.data);

    return res.data;
  } catch (error) {
    console.error(
      '❌ Presign request failed:',
      error?.response?.data || error.message
    );
    throw error;
  }
};
