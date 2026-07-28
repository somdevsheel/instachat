import api from '../services/api';

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
    const res = await api.put(`/feed/posts/${postId}/like`);
    if (!res?.data?.success) {
      throw new Error('Like request failed');
    }
    return res.data;
  } catch (err) {
    console.error(
      '❌ likePost error:',
      err?.response?.data || err.message
    );
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
    const res = await api.get(`/feed/posts/${postId}`);
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
   DELETE POST
====================================================== */
export const deletePost = async (postId) => {
  try {
    if (!postId) {
      throw new Error('Post ID is required');
    }
    const res = await api.delete(`/feed/posts/${postId}`);
    if (!res?.data?.success) {
      throw new Error('Failed to delete post');
    }
    return res.data;
  } catch (err) {
    console.error(
      '❌ deletePost error:',
      err?.response?.data || err.message
    );
    throw err;
  }
};

/* ======================================================
   SAVE / UNSAVE POST
====================================================== */
export const toggleSavePost = async (postId) => {
  try {
    if (!postId) {
      throw new Error('Post ID is required');
    }
    const res = await api.put(`/feed/posts/${postId}/save`);
    if (!res?.data?.success) {
      throw new Error('Save request failed');
    }
    return res.data;
  } catch (err) {
    console.error('❌ toggleSavePost error:', err?.response?.data || err.message);
    throw err;
  }
};

export const sharePost = async (postId) => {
  try {
    if (!postId) {
      throw new Error('Post ID is required');
    }
    const res = await api.put(`/feed/posts/${postId}/share`);
    if (!res?.data?.success) {
      throw new Error('Share request failed');
    }
    return res.data;
  } catch (err) {
    console.error('❌ sharePost error:', err?.response?.data || err.message);
    throw err;
  }
};

export const repostPost = async (postId, caption) => {
  try {
    if (!postId) {
      throw new Error('Post ID is required');
    }
    const res = await api.post(`/feed/posts/${postId}/repost`, { caption });
    if (!res?.data?.success) {
      throw new Error('Repost request failed');
    }
    return res.data;
  } catch (err) {
    console.error('❌ repostPost error:', err?.response?.data || err.message);
    throw err;
  }
};

export const getSavedPosts = async () => {
  try {
    const res = await api.get('/feed/saved');
    if (!res?.data?.success) {
      throw new Error('Failed to fetch saved posts');
    }
    return res.data;
  } catch (err) {
    console.error('❌ getSavedPosts error:', err?.response?.data || err.message);
    throw err;
  }
};

/* ======================================================
   TRENDING HASHTAGS
====================================================== */
export const getTrending = async () => {
  try {
    const res = await api.get('/feed/trending');
    if (!res?.data?.success) {
      throw new Error('Failed to fetch trending hashtags');
    }
    return res.data;
  } catch (err) {
    console.error('❌ getTrending error:', err?.response?.data || err.message);
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
