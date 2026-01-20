import api from '../services/api';

export const register = async (userData) => {
  const res = await api.post('/auth/register', userData);
  return res.data;
};

export const login = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

export const logout = async () => {
  const res = await api.post('/auth/logout');
  return res.data;
};

// change password
export const changePassword = async (currentPassword, newPassword) => {
  const res = await api.put('/auth/change-password', {
    currentPassword,
    newPassword,
  });
  return res.data;
};

// ✅ ADD THIS
export const getMe = async () => {
  // GET /api/v1/auth/me
  const res = await api.get('/auth/me');
  return res.data;
};
