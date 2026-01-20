import api from '../services/api';

/* ======================================================
   UPLOAD STORY (IMAGE / VIDEO)
====================================================== */
export const uploadStory = async (uri, type) => {
  try {
    if (!uri || !type) {
      throw new Error('Story uri and type are required');
    }

    const isVideo = type === 'video';

    const formData = new FormData();
    formData.append('media', {
      uri,
      name: isVideo ? 'story.mp4' : 'story.jpg',
      type: isVideo ? 'video/mp4' : 'image/jpeg',
    });

    const res = await api.post('/stories', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!res?.data?.success) {
      throw new Error('Story upload failed');
    }

    return res.data;
  } catch (err) {
    console.error(
      '❌ uploadStory error:',
      err?.response?.data || err.message
    );
    throw err;
  }
};

/* ======================================================
   GET STORY FEED
====================================================== */
export const getStoryFeed = async () => {
  try {
    const res = await api.get('/stories/feed', {
      headers: {
        'Cache-Control': 'no-store',
      },
    });

    if (!res?.data?.success) {
      throw new Error('Failed to fetch stories');
    }

    return res.data;
  } catch (err) {
    console.error(
      '❌ getStoryFeed error:',
      err?.response?.data || err.message
    );
    throw err;
  }
};
