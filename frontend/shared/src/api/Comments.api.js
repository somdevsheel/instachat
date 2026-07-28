import api from '../services/api';

/* ================================
   GET TOP-LEVEL COMMENTS FOR A POST
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
   ADD COMMENT (OR REPLY) TO POST
================================ */
export const addComment = async (postId, text, replyTo) => {
  try {
    if (!postId || !text?.trim()) {
      throw new Error('Post ID and comment text required');
    }

    const res = await api.post(
      `/feed/posts/${postId}/comments`,
      { text: text.trim(), replyTo: replyTo || undefined }
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

/* ================================
   GET REPLIES TO A COMMENT
================================ */
export const getCommentReplies = async commentId => {
  try {
    if (!commentId) {
      throw new Error('Comment ID is required');
    }

    const res = await api.get(`/feed/comments/${commentId}/replies`);
    return res.data;
  } catch (err) {
    console.error(
      '❌ getCommentReplies error:',
      err?.response?.data || err.message
    );
    throw err;
  }
};

/* ================================
   LIKE / UNLIKE A COMMENT
================================ */
export const toggleCommentLike = async commentId => {
  try {
    if (!commentId) {
      throw new Error('Comment ID is required');
    }

    const res = await api.put(`/feed/comments/${commentId}/like`);
    return res.data;
  } catch (err) {
    console.error(
      '❌ toggleCommentLike error:',
      err?.response?.data || err.message
    );
    throw err;
  }
};
