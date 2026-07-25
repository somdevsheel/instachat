import api from '../services/api';

// `uploadStory` is intentionally not here — the mobile app's version reads
// the file via expo-file-system, which doesn't exist on web. Each platform
// provides its own upload implementation (e.g. frontend/web uses
// fetch+Blob against this same /media/presign + POST /stories flow) and
// calls createStoryRecord below once the file is on S3.
export const createStoryRecord = async ({ key, mediaType }) => {
  const res = await api.post('/stories', { key, mediaType });
  return res.data;
};

/* =========================
   GET STORY FEED
========================= */
export const getStoryFeed = async () => {
  const res = await api.get('/stories/feed');
  return res.data;
};

/* =========================
   DELETE STORY
========================= */
export const deleteStory = async (storyId) => {
  const res = await api.delete(`/stories/${storyId}`);
  return res.data;
};

/* =========================
   MARK STORIES AS SEEN
========================= */
export const markStoriesSeen = async (storyIds = []) => {
  if (!Array.isArray(storyIds) || storyIds.length === 0) return;
  const res = await api.post('/stories/seen', { storyIds });
  return res.data;
};

/* =========================
   REACT TO STORY
   BACKEND: POST /stories/:id/react
========================= */
export const reactToStory = async (storyId, reaction) => {
  if (!storyId || !reaction) {
    throw new Error('storyId and reaction are required');
  }
  const res = await api.post(`/stories/${storyId}/react`, { reaction });
  return res.data;
};

/* =========================
   GET STORY VIEWERS
========================= */
export const getStoryViewers = async (storyId) => {
  const res = await api.get(`/stories/${storyId}/viewers`);
  return res.data;
};
