import api from '../services/api';

export const getNotifications = async () => {
  // GET /api/v1/notifications
  const res = await api.get('/notifications');
  return res.data;
};

export const markNotificationsRead = async () => {
  // PUT /api/v1/notifications/read
  const res = await api.put('/notifications/read');
  return res.data;
};