import api from '../services/api';

/* ================================
   GET COMMENTS FOR A POST
================================ */
export const getComments = async postId => {
  try {
    if (!postId) {
      throw new Error('Post ID is required');
    }

    const res = await api.get(
      `/feed/posts/${postId}/comments`
    );

    return res.data;
  } catch (err) {
    console.error(
      '❌ getComments error:',
      err?.response?.data || err.message
    );
    throw err;
  }
};

/* ================================
   ADD COMMENT TO POST
================================ */
export const addComment = async (postId, text) => {
  try {
    if (!postId || !text?.trim()) {
      throw new Error('Post ID and comment text required');
    }

    const res = await api.post(
      `/feed/posts/${postId}/comments`,
      { text: text.trim() }
    );

    return res.data;
  } catch (err) {
    console.error(
      '❌ addComment error:',
      err?.response?.data || err.message
    );
    throw err;
  }
};
