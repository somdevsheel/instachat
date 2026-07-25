// import api from '../services/api';
// import { Alert } from 'react-native';

// /**
//  * ======================================================
//  * REELS API
//  * ======================================================
//  * - Presigned upload
//  * - CRUD operations
//  * - Engagement (like, view)
//  */

// /* ======================================================
//    GET PRESIGNED URL FOR REEL UPLOAD
// ====================================================== */
// export const getReelPresignedUrl = async (mimeType, fileSizeMB) => {
//   try {
//     if (!mimeType) {
//       throw new Error('mimeType is required');
//     }

//     const res = await api.post('/reels/presign', {
//       mimeType,
//       fileSizeMB,
//     });

//     if (!res?.data?.success) {
//       throw new Error('Failed to get presigned URL');
//     }

//     return res.data;
//   } catch (err) {
//     console.error(
//       '❌ getReelPresignedUrl error:',
//       err?.response?.data || err.message
//     );
//     throw err;
//   }
// };

// /* ======================================================
//    UPLOAD VIDEO TO S3 (PRESIGNED)
// ====================================================== */
// export const uploadVideoToS3 = async (uploadUrl, videoUri, mimeType) => {
//   try {
//     // Fetch the video file as blob
//     const response = await fetch(videoUri);
//     const blob = await response.blob();

//     // Upload to S3 using presigned URL
//     const uploadRes = await fetch(uploadUrl, {
//       method: 'PUT',
//       body: blob,
//       headers: {
//         'Content-Type': mimeType,
//       },
//     });

//     if (!uploadRes.ok) {
//       throw new Error(`S3 upload failed: ${uploadRes.status}`);
//     }

//     console.log('✅ Video uploaded to S3');
//     return true;
//   } catch (err) {
//     console.error('❌ uploadVideoToS3 error:', err.message);
//     throw err;
//   }
// };

// /* ======================================================
//    CREATE REEL (AFTER S3 UPLOAD)
// ====================================================== */
// export const createReel = async (payload) => {
//   try {
//     if (!payload?.videoKey) {
//       throw new Error('videoKey is required');
//     }

//     const res = await api.post('/reels', payload);

//     if (!res?.data?.success) {
//       throw new Error('Failed to create reel');
//     }

//     return res.data;
//   } catch (err) {
//     console.error(
//       '❌ createReel error:',
//       err?.response?.data || err.message
//     );
//     throw err;
//   }
// };

// /* ======================================================
//    GET REELS FEED
// ====================================================== */
// export const getReelsFeed = async (page = 1, limit = 10) => {
//   try {
//     const res = await api.get(`/reels/feed?page=${page}&limit=${limit}`);

//     if (!res?.data?.success) {
//       throw new Error('Failed to fetch reels');
//     }

//     return res.data;
//   } catch (err) {
//     console.error(
//       '❌ getReelsFeed error:',
//       err?.response?.data || err.message
//     );
//     throw err;
//   }
// };

// /* ======================================================
//    GET SINGLE REEL
// ====================================================== */
// export const getReelById = async (reelId) => {
//   try {
//     if (!reelId) {
//       throw new Error('Reel ID is required');
//     }

//     const res = await api.get(`/reels/${reelId}`);

//     if (!res?.data?.success) {
//       throw new Error('Failed to fetch reel');
//     }

//     return res.data;
//   } catch (err) {
//     console.error(
//       '❌ getReelById error:',
//       err?.response?.data || err.message
//     );
//     throw err;
//   }
// };

// /* ======================================================
//    GET USER'S REELS
// ====================================================== */
// export const getUserReels = async (userId) => {
//   try {
//     if (!userId) {
//       throw new Error('User ID is required');
//     }

//     const res = await api.get(`/reels/user/${userId}`);

//     if (!res?.data?.success) {
//       throw new Error('Failed to fetch user reels');
//     }

//     return res.data;
//   } catch (err) {
//     console.error(
//       '❌ getUserReels error:',
//       err?.response?.data || err.message
//     );
//     throw err;
//   }
// };

// /* ======================================================
//    LIKE / UNLIKE REEL
// ====================================================== */
// export const likeReel = async (reelId) => {
//   try {
//     if (!reelId) {
//       throw new Error('Reel ID is required');
//     }

//     const res = await api.put(`/reels/${reelId}/like`);

//     if (!res?.data?.success) {
//       throw new Error('Like request failed');
//     }

//     return res.data;
//   } catch (err) {
//     console.error(
//       '❌ likeReel error:',
//       err?.response?.data || err.message
//     );
//     Alert.alert('Error', 'Failed to like reel');
//     throw err;
//   }
// };

// /* ======================================================
//    INCREMENT VIEW COUNT
// ====================================================== */
// export const incrementReelView = async (reelId) => {
//   try {
//     if (!reelId) {
//       throw new Error('Reel ID is required');
//     }

//     const res = await api.put(`/reels/${reelId}/view`);

//     // Silent fail - don't throw error for view count
//     return res?.data || { success: true };
//   } catch (err) {
//     // Silent fail for view tracking
//     console.warn('⚠️ incrementReelView error:', err.message);
//     return { success: false };
//   }
// };

// /* ======================================================
//    DELETE REEL
// ====================================================== */
// export const deleteReel = async (reelId) => {
//   try {
//     if (!reelId) {
//       throw new Error('Reel ID is required');
//     }

//     const res = await api.delete(`/reels/${reelId}`);

//     if (!res?.data?.success) {
//       throw new Error('Failed to delete reel');
//     }

//     return res.data;
//   } catch (err) {
//     console.error(
//       '❌ deleteReel error:',
//       err?.response?.data || err.message
//     );
//     Alert.alert('Error', 'Failed to delete reel');
//     throw err;
//   }
// };

// /* ======================================================
//    FULL UPLOAD FLOW (HELPER)
// ====================================================== */
// export const uploadReelWithPresign = async (videoUri, caption = '', duration = 0) => {
//   try {
//     // 1. Determine mime type
//     const filename = videoUri.split('/').pop();
//     const extension = filename.split('.').pop().toLowerCase();
    
//     const mimeTypes = {
//       mp4: 'video/mp4',
//       mov: 'video/quicktime',
//       mkv: 'video/x-matroska',
//     };
    
//     const mimeType = mimeTypes[extension] || 'video/mp4';

//     // 2. Get presigned URL
//     console.log('📤 Getting presigned URL...');
//     const presignRes = await getReelPresignedUrl(mimeType);
//     const { uploadUrl, key } = presignRes.data;

//     // 3. Upload to S3
//     console.log('📤 Uploading video to S3...');
//     await uploadVideoToS3(uploadUrl, videoUri, mimeType);

//     // 4. Create reel in database
//     console.log('📤 Creating reel record...');
//     const reelRes = await createReel({
//       videoKey: key,
//       caption,
//       duration,
//     });

//     console.log('✅ Reel upload complete!');
//     return reelRes;
//   } catch (err) {
//     console.error('❌ uploadReelWithPresign error:', err.message);
//     throw err;
//   }
// };






// import api from '../services/api';
// import { Alert } from 'react-native';

// /**
//  * ======================================================
//  * REELS API
//  * ======================================================
//  * - Presigned upload
//  * - CRUD operations
//  * - Engagement (like, view)
//  */

// /* ======================================================
//    GET PRESIGNED URL FOR REEL UPLOAD
// ====================================================== */
// export const getReelPresignedUrl = async (mimeType, fileSizeMB) => {
//   try {
//     if (!mimeType) {
//       throw new Error('mimeType is required');
//     }

//     const res = await api.post('/reels/presign', {
//       mimeType,
//       fileSizeMB,
//     });

//     if (!res?.data?.success) {
//       throw new Error('Failed to get presigned URL');
//     }

//     return res.data;
//   } catch (err) {
//     console.error(
//       '❌ getReelPresignedUrl error:',
//       err?.response?.data || err.message
//     );
//     throw err;
//   }
// };

// /* ======================================================
//    UPLOAD VIDEO TO S3 (PRESIGNED)
// ====================================================== */
// export const uploadVideoToS3 = async (uploadUrl, videoUri, mimeType) => {
//   try {
//     // Fetch the video file as blob
//     const response = await fetch(videoUri);
//     const blob = await response.blob();

//     // Upload to S3 using presigned URL
//     const uploadRes = await fetch(uploadUrl, {
//       method: 'PUT',
//       body: blob,
//       headers: {
//         'Content-Type': mimeType,
//       },
//     });

//     if (!uploadRes.ok) {
//       throw new Error(`S3 upload failed: ${uploadRes.status}`);
//     }

//     console.log('✅ Video uploaded to S3');
//     return true;
//   } catch (err) {
//     console.error('❌ uploadVideoToS3 error:', err.message);
//     throw err;
//   }
// };

// /* ======================================================
//    CREATE REEL (AFTER S3 UPLOAD)
// ====================================================== */
// export const createReel = async (payload) => {
//   try {
//     if (!payload?.videoKey) {
//       throw new Error('videoKey is required');
//     }

//     const res = await api.post('/reels', payload);

//     if (!res?.data?.success) {
//       throw new Error('Failed to create reel');
//     }

//     return res.data;
//   } catch (err) {
//     console.error(
//       '❌ createReel error:',
//       err?.response?.data || err.message
//     );
//     throw err;
//   }
// };

// /* ======================================================
//    GET REELS FEED
// ====================================================== */
// export const getReelsFeed = async (page = 1, limit = 10) => {
//   try {
//     console.log('🎬 API: Fetching reels feed...', { page, limit });
    
//     const res = await api.get(`/reels/feed?page=${page}&limit=${limit}`);

//     console.log('🎬 API: Reels response:', {
//       success: res?.data?.success,
//       count: res?.data?.data?.length,
//       firstReel: res?.data?.data?.[0] ? {
//         id: res.data.data[0]._id,
//         videoUrl: res.data.data[0].videoUrl,
//       } : null,
//     });

//     if (!res?.data?.success) {
//       throw new Error('Failed to fetch reels');
//     }

//     return res.data;
//   } catch (err) {
//     console.error(
//       '❌ getReelsFeed error:',
//       err?.response?.data || err.message
//     );
//     throw err;
//   }
// };

// /* ======================================================
//    GET SINGLE REEL
// ====================================================== */
// export const getReelById = async (reelId) => {
//   try {
//     if (!reelId) {
//       throw new Error('Reel ID is required');
//     }

//     const res = await api.get(`/reels/${reelId}`);

//     if (!res?.data?.success) {
//       throw new Error('Failed to fetch reel');
//     }

//     return res.data;
//   } catch (err) {
//     console.error(
//       '❌ getReelById error:',
//       err?.response?.data || err.message
//     );
//     throw err;
//   }
// };

// /* ======================================================
//    GET USER'S REELS
// ====================================================== */
// export const getUserReels = async (userId) => {
//   try {
//     if (!userId) {
//       throw new Error('User ID is required');
//     }

//     const res = await api.get(`/reels/user/${userId}`);

//     if (!res?.data?.success) {
//       throw new Error('Failed to fetch user reels');
//     }

//     return res.data;
//   } catch (err) {
//     console.error(
//       '❌ getUserReels error:',
//       err?.response?.data || err.message
//     );
//     throw err;
//   }
// };

// /* ======================================================
//    LIKE / UNLIKE REEL
// ====================================================== */
// export const likeReel = async (reelId) => {
//   try {
//     if (!reelId) {
//       throw new Error('Reel ID is required');
//     }

//     const res = await api.put(`/reels/${reelId}/like`);

//     if (!res?.data?.success) {
//       throw new Error('Like request failed');
//     }

//     return res.data;
//   } catch (err) {
//     console.error(
//       '❌ likeReel error:',
//       err?.response?.data || err.message
//     );
//     Alert.alert('Error', 'Failed to like reel');
//     throw err;
//   }
// };

// /* ======================================================
//    INCREMENT VIEW COUNT
// ====================================================== */
// export const incrementReelView = async (reelId) => {
//   try {
//     if (!reelId) {
//       throw new Error('Reel ID is required');
//     }

//     const res = await api.put(`/reels/${reelId}/view`);

//     // Silent fail - don't throw error for view count
//     return res?.data || { success: true };
//   } catch (err) {
//     // Silent fail for view tracking
//     console.warn('⚠️ incrementReelView error:', err.message);
//     return { success: false };
//   }
// };

// /* ======================================================
//    DELETE REEL
// ====================================================== */
// export const deleteReel = async (reelId) => {
//   try {
//     if (!reelId) {
//       throw new Error('Reel ID is required');
//     }

//     const res = await api.delete(`/reels/${reelId}`);

//     if (!res?.data?.success) {
//       throw new Error('Failed to delete reel');
//     }

//     return res.data;
//   } catch (err) {
//     console.error(
//       '❌ deleteReel error:',
//       err?.response?.data || err.message
//     );
//     Alert.alert('Error', 'Failed to delete reel');
//     throw err;
//   }
// };

// /* ======================================================
//    FULL UPLOAD FLOW (HELPER)
// ====================================================== */
// export const uploadReelWithPresign = async (videoUri, caption = '', duration = 0) => {
//   try {
//     // 1. Determine mime type
//     const filename = videoUri.split('/').pop();
//     const extension = filename.split('.').pop().toLowerCase();
    
//     const mimeTypes = {
//       mp4: 'video/mp4',
//       mov: 'video/quicktime',
//       mkv: 'video/x-matroska',
//     };
    
//     const mimeType = mimeTypes[extension] || 'video/mp4';

//     // 2. Get presigned URL
//     console.log('📤 Getting presigned URL...');
//     const presignRes = await getReelPresignedUrl(mimeType);
//     const { uploadUrl, key } = presignRes.data;

//     // 3. Upload to S3
//     console.log('📤 Uploading video to S3...');
//     await uploadVideoToS3(uploadUrl, videoUri, mimeType);

//     // 4. Create reel in database
//     console.log('📤 Creating reel record...');
//     const reelRes = await createReel({
//       videoKey: key,
//       caption,
//       duration,
//     });

//     console.log('✅ Reel upload complete!');
//     return reelRes;
//   } catch (err) {
//     console.error('❌ uploadReelWithPresign error:', err.message);
//     throw err;
//   }
// };








// import api from '../services/api';
// import { Alert } from 'react-native';

// /**
//  * ======================================================
//  * REELS API
//  * ======================================================
//  * - Presigned upload
//  * - CRUD operations
//  * - Engagement (like, view)
//  */

// /* ======================================================
//    GET PRESIGNED URL FOR REEL UPLOAD
// ====================================================== */
// export const getReelPresignedUrl = async (mimeType, fileSizeMB) => {
//   try {
//     if (!mimeType) {
//       throw new Error('mimeType is required');
//     }

//     const res = await api.post('/reels/presign', {
//       mimeType,
//       fileSizeMB,
//     });

//     if (!res?.data?.success) {
//       throw new Error('Failed to get presigned URL');
//     }

//     return res.data;
//   } catch (err) {
//     console.error(
//       '❌ getReelPresignedUrl error:',
//       err?.response?.data || err.message
//     );
//     throw err;
//   }
// };

// /* ======================================================
//    UPLOAD VIDEO TO S3 (PRESIGNED)
// ====================================================== */
// export const uploadVideoToS3 = async (uploadUrl, videoUri, mimeType) => {
//   try {
//     // Fetch the video file as blob
//     const response = await fetch(videoUri);
//     const blob = await response.blob();

//     // Upload to S3 using presigned URL
//     const uploadRes = await fetch(uploadUrl, {
//       method: 'PUT',
//       body: blob,
//       headers: {
//         'Content-Type': mimeType,
//       },
//     });

//     if (!uploadRes.ok) {
//       throw new Error(`S3 upload failed: ${uploadRes.status}`);
//     }

//     console.log('✅ Video uploaded to S3');
//     return true;
//   } catch (err) {
//     console.error('❌ uploadVideoToS3 error:', err.message);
//     throw err;
//   }
// };

// /* ======================================================
//    CREATE REEL (AFTER S3 UPLOAD)
// ====================================================== */
// export const createReel = async (payload) => {
//   try {
//     if (!payload?.videoKey) {
//       throw new Error('videoKey is required');
//     }

//     const res = await api.post('/reels', payload);

//     if (!res?.data?.success) {
//       throw new Error('Failed to create reel');
//     }

//     return res.data;
//   } catch (err) {
//     console.error(
//       '❌ createReel error:',
//       err?.response?.data || err.message
//     );
//     throw err;
//   }
// };

// /* ======================================================
//    GET REELS FEED
// ====================================================== */
// export const getReelsFeed = async (page = 1, limit = 10) => {
//   try {
//     console.log('🎬 API: Fetching reels feed...', { page, limit });
    
//     const res = await api.get(`/reels/feed?page=${page}&limit=${limit}`);

//     console.log('🎬 API: Reels response:', {
//       success: res?.data?.success,
//       count: res?.data?.data?.length,
//       firstReel: res?.data?.data?.[0] ? {
//         id: res.data.data[0]._id,
//         videoUrl: res.data.data[0].videoUrl,
//       } : null,
//     });

//     if (!res?.data?.success) {
//       throw new Error('Failed to fetch reels');
//     }

//     return res.data;
//   } catch (err) {
//     console.error(
//       '❌ getReelsFeed error:',
//       err?.response?.data || err.message
//     );
//     throw err;
//   }
// };

// /* ======================================================
//    GET SINGLE REEL
// ====================================================== */
// export const getReelById = async (reelId) => {
//   try {
//     if (!reelId) {
//       throw new Error('Reel ID is required');
//     }

//     const res = await api.get(`/reels/${reelId}`);

//     if (!res?.data?.success) {
//       throw new Error('Failed to fetch reel');
//     }

//     return res.data;
//   } catch (err) {
//     console.error(
//       '❌ getReelById error:',
//       err?.response?.data || err.message
//     );
//     throw err;
//   }
// };

// /* ======================================================
//    GET USER'S REELS
// ====================================================== */
// export const getUserReels = async (userId) => {
//   try {
//     if (!userId) {
//       throw new Error('User ID is required');
//     }

//     const res = await api.get(`/reels/user/${userId}`);

//     if (!res?.data?.success) {
//       throw new Error('Failed to fetch user reels');
//     }

//     return res.data;
//   } catch (err) {
//     console.error(
//       '❌ getUserReels error:',
//       err?.response?.data || err.message
//     );
//     throw err;
//   }
// };

// /* ======================================================
//    LIKE / UNLIKE REEL
// ====================================================== */
// export const likeReel = async (reelId) => {
//   try {
//     if (!reelId) {
//       throw new Error('Reel ID is required');
//     }

//     const res = await api.put(`/reels/${reelId}/like`);

//     if (!res?.data?.success) {
//       throw new Error('Like request failed');
//     }

//     return res.data;
//   } catch (err) {
//     console.error(
//       '❌ likeReel error:',
//       err?.response?.data || err.message
//     );
//     Alert.alert('Error', 'Failed to like reel');
//     throw err;
//   }
// };

// /* ======================================================
//    INCREMENT VIEW COUNT
// ====================================================== */
// export const incrementReelView = async (reelId) => {
//   try {
//     if (!reelId) {
//       throw new Error('Reel ID is required');
//     }

//     const res = await api.put(`/reels/${reelId}/view`);

//     // Silent fail - don't throw error for view count
//     return res?.data || { success: true };
//   } catch (err) {
//     // Silent fail for view tracking
//     console.warn('⚠️ incrementReelView error:', err.message);
//     return { success: false };
//   }
// };

// /* ======================================================
//    DELETE REEL
// ====================================================== */
// export const deleteReel = async (reelId) => {
//   try {
//     if (!reelId) {
//       throw new Error('Reel ID is required');
//     }

//     const res = await api.delete(`/reels/${reelId}`);

//     if (!res?.data?.success) {
//       throw new Error('Failed to delete reel');
//     }

//     return res.data;
//   } catch (err) {
//     console.error(
//       '❌ deleteReel error:',
//       err?.response?.data || err.message
//     );
//     Alert.alert('Error', 'Failed to delete reel');
//     throw err;
//   }
// };

// /* ======================================================
//    ADD COMMENT TO REEL
// ====================================================== */
// export const addReelComment = async (reelId, text) => {
//   try {
//     if (!reelId || !text?.trim()) {
//       throw new Error('Reel ID and comment text are required');
//     }

//     const res = await api.post(`/reels/${reelId}/comments`, {
//       text: text.trim(),
//     });

//     if (!res?.data?.success) {
//       throw new Error('Failed to add comment');
//     }

//     return res.data;
//   } catch (err) {
//     console.error(
//       '❌ addReelComment error:',
//       err?.response?.data || err.message
//     );
//     throw err;
//   }
// };

// /* ======================================================
//    GET REEL COMMENTS
// ====================================================== */
// export const getReelComments = async (reelId) => {
//   try {
//     if (!reelId) {
//       throw new Error('Reel ID is required');
//     }

//     const res = await api.get(`/reels/${reelId}/comments`);

//     if (!res?.data?.success) {
//       throw new Error('Failed to fetch comments');
//     }

//     return res.data;
//   } catch (err) {
//     console.error(
//       '❌ getReelComments error:',
//       err?.response?.data || err.message
//     );
//     throw err;
//   }
// };

// /* ======================================================
//    FULL UPLOAD FLOW (HELPER)
// ====================================================== */
// export const uploadReelWithPresign = async (videoUri, caption = '', duration = 0) => {
//   try {
//     // 1. Determine mime type
//     const filename = videoUri.split('/').pop();
//     const extension = filename.split('.').pop().toLowerCase();
    
//     const mimeTypes = {
//       mp4: 'video/mp4',
//       mov: 'video/quicktime',
//       mkv: 'video/x-matroska',
//     };
    
//     const mimeType = mimeTypes[extension] || 'video/mp4';

//     // 2. Get presigned URL
//     console.log('📤 Getting presigned URL...');
//     const presignRes = await getReelPresignedUrl(mimeType);
//     const { uploadUrl, key } = presignRes.data;

//     // 3. Upload to S3
//     console.log('📤 Uploading video to S3...');
//     await uploadVideoToS3(uploadUrl, videoUri, mimeType);

//     // 4. Create reel in database
//     console.log('📤 Creating reel record...');
//     const reelRes = await createReel({
//       videoKey: key,
//       caption,
//       duration,
//     });

//     console.log('✅ Reel upload complete!');
//     return reelRes;
//   } catch (err) {
//     console.error('❌ uploadReelWithPresign error:', err.message);
//     throw err;
//   }
// };







import api from '../services/api';

/**
 * ======================================================
 * REELS API
 * ======================================================
 */

/* ======================================================
   GET PRESIGNED URL
====================================================== */
export const getReelPresignedUrl = async (mimeType, fileSizeMB) => {
  try {
    if (!mimeType) throw new Error('mimeType is required');

    const res = await api.post('/reels/presign', {
      mimeType,
      fileSizeMB,
    });

    if (!res?.data?.success) {
      throw new Error('Failed to get presigned URL');
    }

    return res.data;
  } catch (err) {
    console.error('❌ getReelPresignedUrl error:', err?.response?.data || err.message);
    throw err;
  }
};

/* ======================================================
   UPLOAD VIDEO TO S3
====================================================== */
export const uploadVideoToS3 = async (uploadUrl, videoUri, mimeType) => {
  try {
    const response = await fetch(videoUri);
    const blob = await response.blob();

    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: {
        'Content-Type': mimeType,
      },
    });

    if (!uploadRes.ok) {
      throw new Error(`S3 upload failed: ${uploadRes.status}`);
    }

    return true;
  } catch (err) {
    console.error('❌ uploadVideoToS3 error:', err.message);
    throw err;
  }
};

/* ======================================================
   CREATE REEL
====================================================== */
export const createReel = async (payload) => {
  try {
    if (!payload?.videoKey) {
      throw new Error('videoKey is required');
    }

    const res = await api.post('/reels', payload);

    if (!res?.data?.success) {
      throw new Error('Failed to create reel');
    }

    return res.data;
  } catch (err) {
    console.error('❌ createReel error:', err?.response?.data || err.message);
    throw err;
  }
};

/* ======================================================
   GET REELS FEED
====================================================== */
export const getReelsFeed = async (page = 1, limit = 10) => {
  try {
    const res = await api.get(`/reels/feed?page=${page}&limit=${limit}`);

    if (!res?.data?.success) {
      throw new Error('Failed to fetch reels');
    }

    return res.data;
  } catch (err) {
    console.error('❌ getReelsFeed error:', err?.response?.data || err.message);
    throw err;
  }
};

/* ======================================================
   GET SINGLE REEL
====================================================== */
export const getReelById = async (reelId) => {
  try {
    if (!reelId) throw new Error('Reel ID is required');

    const res = await api.get(`/reels/${reelId}`);

    if (!res?.data?.success) {
      throw new Error('Failed to fetch reel');
    }

    return res.data;
  } catch (err) {
    console.error('❌ getReelById error:', err?.response?.data || err.message);
    throw err;
  }
};

/* ======================================================
   GET USER REELS
====================================================== */
export const getUserReels = async (userId) => {
  try {
    if (!userId) throw new Error('User ID is required');

    const res = await api.get(`/reels/user/${userId}`);

    if (!res?.data?.success) {
      throw new Error('Failed to fetch user reels');
    }

    return res.data;
  } catch (err) {
    console.error('❌ getUserReels error:', err?.response?.data || err.message);
    throw err;
  }
};

/* ======================================================
   LIKE / UNLIKE
====================================================== */
export const likeReel = async (reelId) => {
  try {
    if (!reelId) throw new Error('Reel ID is required');

    const res = await api.put(`/reels/${reelId}/like`);

    if (!res?.data?.success) {
      throw new Error('Like failed');
    }

    return res.data;
  } catch (err) {
    console.error('❌ likeReel error:', err?.response?.data || err.message);
    throw err;
  }
};

/* ======================================================
   INCREMENT VIEW
====================================================== */
export const incrementReelView = async (reelId) => {
  try {
    if (!reelId) throw new Error('Reel ID is required');

    const res = await api.put(`/reels/${reelId}/view`);

    return res?.data || { success: true };
  } catch (err) {
    console.warn('⚠️ incrementReelView error:', err.message);
    return { success: false };
  }
};

/* ======================================================
   DELETE REEL
====================================================== */
export const deleteReel = async (reelId) => {
  try {
    if (!reelId) throw new Error('Reel ID is required');

    const res = await api.delete(`/reels/${reelId}`);

    if (!res?.data?.success) {
      throw new Error('Delete failed');
    }

    return res.data;
  } catch (err) {
    console.error('❌ deleteReel error:', err?.response?.data || err.message);
    throw err;
  }
};

/* ======================================================
   GET REEL COMMENTS
====================================================== */
export const getReelComments = async (reelId) => {
  try {
    if (!reelId) throw new Error('Reel ID is required');

    const res = await api.get(`/reels/${reelId}/comments`);

    if (!res?.data?.success) {
      throw new Error('Failed to fetch comments');
    }

    return res.data;
  } catch (err) {
    console.error('❌ getReelComments error:', err?.response?.data || err.message);
    throw err;
  }
};

/* ======================================================
   ADD REEL COMMENT
====================================================== */
export const addReelComment = async (reelId, text) => {
  try {
    if (!reelId || !text?.trim()) {
      throw new Error('Reel ID and comment text are required');
    }

    const res = await api.post(`/reels/${reelId}/comments`, {
      text: text.trim(),
    });

    if (!res?.data?.success) {
      throw new Error('Failed to add comment');
    }

    return res.data;
  } catch (err) {
    console.error('❌ addReelComment error:', err?.response?.data || err.message);
    throw err;
  }
};

/* ======================================================
   FULL UPLOAD FLOW
====================================================== */
export const uploadReelWithPresign = async (
  videoUri,
  caption = '',
  duration = 0
) => {
  try {
    const filename = videoUri.split('/').pop();
    const extension = filename.split('.').pop().toLowerCase();

    const mimeTypes = {
      mp4: 'video/mp4',
      mov: 'video/quicktime',
      mkv: 'video/x-matroska',
    };

    const mimeType = mimeTypes[extension] || 'video/mp4';

    const presignRes = await getReelPresignedUrl(mimeType);
    const { uploadUrl, key } = presignRes.data;

    await uploadVideoToS3(uploadUrl, videoUri, mimeType);

    const reelRes = await createReel({
      videoKey: key,
      caption,
      duration,
    });

    return reelRes;
  } catch (err) {
    console.error('❌ uploadReelWithPresign error:', err.message);
    throw err;
  }
};
