import api from '../services/api';

/**
 * GET /api/v1/notes/me
 */
export const getMyNote = async () => {
  const res = await api.get('/notes/me');
  return res.data;
};

/**
 * POST /api/v1/notes
 */
export const setNote = async (text) => {
  const res = await api.post('/notes', { text });
  return res.data;
};

/**
 * DELETE /api/v1/notes
 */
export const deleteNote = async () => {
  const res = await api.delete('/notes');
  return res.data;
};
