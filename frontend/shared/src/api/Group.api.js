import api from '../services/api';

export const getGroups = async () => {
  const res = await api.get('/groups');
  return res.data;
};

export const createGroup = async ({ name, description }) => {
  const res = await api.post('/groups', { name, description });
  return res.data;
};

export const getGroupById = async (groupId) => {
  const res = await api.get(`/groups/${groupId}`);
  return res.data;
};

export const toggleGroupMembership = async (groupId) => {
  const res = await api.put(`/groups/${groupId}/membership`);
  return res.data;
};
