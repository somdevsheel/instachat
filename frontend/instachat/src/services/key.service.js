import api from './api';

export const fetchUserKeys = async (userId) => {
  const res = await api.get(`/keys/${userId}`);
  return res.data.data;
};
