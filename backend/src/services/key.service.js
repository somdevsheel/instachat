import api from './api';

export const fetchUserKeys = async (userId) => {
  const res = await api.get(`/keys/${userId}`);
  return res.data.data;
};

// ✅ ADD THIS
export const uploadPublicKey = async (identityPublicKey) => {
  const res = await api.post('/keys', { identityPublicKey });
  return res.data;
};