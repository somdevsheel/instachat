import api from '../services/api';

// 1. Search Users
export const searchUsers = async (query) => {
  const res = await api.get(`/users/search?q=${query}`);
  return res.data;
};

// 2. Get User Profile
export const getUserProfile = async (username) => {
  const res = await api.get(`/users/profile/${username}`);
  return res.data;
};

// 3. Get My Profile
export const getMyProfile = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};

// 4. Update Profile
export const updateUserProfile = async (formData) => {
  const res = await api.put('/users/update', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

// 5. Follow User
export const followUser = async (userId) => {
  const res = await api.post(`/users/follow/${userId}`);
  return res.data;
};

// ⭐ Suggested Users
export const getSuggestedUsers = async () => {
  const res = await api.get('/users/suggestions');
  return res.data;
};

// ⭐ Toggle Follow
export const toggleFollowUser = async (userId) => {
  const res = await api.post(`/users/follow/${userId}`);
  return res.data;
};

// ✅ FIXED: Correct parameter order (userId, type)
export const getFollowList = async (userId, type) => {
  const res = await api.get(`/users/${userId}/${type}`);
  return res.data;
};