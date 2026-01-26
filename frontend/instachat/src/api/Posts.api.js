import api from '../services/api';
import { Alert } from 'react-native';

/* ======================================================
   FEED
====================================================== */
export const getFeed = async () => {
  try {
    const res = await api.get('/feed');
    if (!res?.data?.success) {
      throw new Error('Failed to fetch feed');
    }
    return res.data;
  } catch (err) {
    console.error(
      '❌ getFeed error:',
      err?.response?.data || err.message
    );
    throw err;
  }
};

/* ======================================================
   CREATE POST
====================================================== */
export const createPost = async (payload) => {
  try {
    if (!payload) {
      throw new Error('Post payload is required');
    }
    const res = await api.post('/feed/posts', payload);
    if (!res?.data?.success) {
      throw new Error('Create post failed');
    }
    return res.data;
  } catch (err) {
    console.error(
      '❌ createPost error:',
      err?.response?.data || err.message
    );
    throw err;
  }
};

/* ======================================================
   LIKE / UNLIKE POST
====================================================== */
export const likePost = async (postId) => {
  try {
    if (!postId) {
      throw new Error('Post ID is required');
    }
    const res = await api.put(`/feed/posts/${postId}/like`); // ✅ Fixed
    if (!res?.data?.success) {
      throw new Error('Like request failed');
    }
    return res.data;
  } catch (err) {
    console.error(
      '❌ likePost error:',
      err?.response?.data || err.message
    );
    Alert.alert('Error', 'Failed to like post');
    throw err;
  }
};

/* ======================================================
   COMMENTS
====================================================== */
export const commentOnPost = async (postId, text) => {
  try {
    if (!postId || !text?.trim()) {
      throw new Error('Post ID and comment text are required');
    }
    const res = await api.post(
      `/feed/posts/${postId}/comments`,
      { text: text.trim() }
    );
    if (!res?.data?.success) {
      throw new Error('Failed to add comment');
    }
    return res.data;
  } catch (err) {
    console.error(
      '❌ commentOnPost error:',
      err?.response?.data || err.message
    );
    throw err;
  }
};

/* ======================================================
   GET POST BY ID
====================================================== */
export const getPostById = async (postId) => {
  try {
    if (!postId) {
      throw new Error('Post ID is required');
    }
    const res = await api.get(`/feed/posts/${postId}`); // ✅ Fixed
    if (!res?.data?.success) {
      throw new Error('Failed to fetch post');
    }
    return res.data;
  } catch (err) {
    console.error(
      '❌ getPostById error:',
      err?.response?.data || err.message
    );
    throw err;
  }
};

/* ======================================================
   REELS (UNCHANGED – MULTIPART)
====================================================== */
export const getReelsFeed = async () => {
  try {
    const res = await api.get('/reels/feed');
    if (!res?.data?.success) {
      throw new Error('Failed to fetch reels');
    }
    return res.data;
  } catch (err) {
    console.error(
      '❌ getReelsFeed error:',
      err?.response?.data || err.message
    );
    throw err;
  }
};

export const uploadReel = async (videoUri, caption = '') => {
  try {
    if (!videoUri) {
      throw new Error('Video URI is required');
    }
    const formData = new FormData();
    const filename = videoUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `video/${match[1]}` : 'video/mp4';
    formData.append('video', {
      uri: videoUri,
      name: filename,
      type,
    });
    formData.append('caption', caption);
    const res = await api.post('/reels', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (!res?.data?.success) {
      throw new Error('Reel upload failed');
    }
    return res.data;
  } catch (err) {
    console.error(
      '❌ uploadReel error:',
      err?.response?.data || err.message
    );
    throw err;
  }
};