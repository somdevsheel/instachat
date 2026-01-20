import api from '../services/api';

export const getInbox = async () => {
  // GET /api/v1/chats
  const res = await api.get('/chats');
  return res.data;
};

export const getChatHistory = async (userId) => {
  // GET /api/v1/chats/history/:userId
  const res = await api.get(`/chats/history/${userId}`);
  return res.data;
};

export const sendMessage = async (recipientId, content) => {
  // POST /api/v1/chats/message
  const res = await api.post('/chats/message', { recipientId, content });
  return res.data;
};