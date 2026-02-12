// import api from '../services/api';

// // 1. Search Users
// export const searchUsers = async (query) => {
//   const res = await api.get(`/users/search?q=${query}`);
//   return res.data;
// };

// // 2. Get User Profile
// export const getUserProfile = async (username) => {
//   const res = await api.get(`/users/profile/${username}`);
//   return res.data;
// };

// // 3. Get My Profile
// export const getMyProfile = async () => {
//   const res = await api.get('/auth/me');
//   return res.data;
// };

// // 4. Update Profile
// export const updateUserProfile = async (formData) => {
//   const res = await api.put('/users/update', formData, {
//     headers: {
//       'Content-Type': 'multipart/form-data',
//     },
//   });
//   return res.data;
// };

// // 5. Follow User
// export const followUser = async (userId) => {
//   const res = await api.post(`/users/follow/${userId}`);
//   return res.data;
// };

// // ⭐ Suggested Users
// export const getSuggestedUsers = async () => {
//   const res = await api.get('/users/suggestions');
//   return res.data;
// };

// // ⭐ Toggle Follow
// export const toggleFollowUser = async (userId) => {
//   const res = await api.post(`/users/follow/${userId}`);
//   return res.data;
// };

// // ✅ FIXED: Correct parameter order (userId, type)
// export const getFollowList = async (userId, type) => {
//   const res = await api.get(`/users/${userId}/${type}`);
//   return res.data;
// };








import api from '../services/api';

/* ==============================
   SEARCH
============================== */

export const searchUsers = async (query) => {
  const res = await api.get(`/users/search?q=${query}`);
  return res.data;
};

/* ==============================
   PROFILE
============================== */

export const getUserProfile = async (username) => {
  const res = await api.get(`/users/profile/${username}`);
  return res.data;
};

export const getMyProfile = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};

export const updateUserProfile = async (formData) => {
  const res = await api.put('/users/update', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

/* ==============================
   FOLLOW
============================== */

export const followUser = async (userId) => {
  const res = await api.post(`/users/follow/${userId}`);
  return res.data;
};

export const getSuggestedUsers = async () => {
  const res = await api.get('/users/suggestions');
  return res.data;
};

export const toggleFollowUser = async (userId) => {
  const res = await api.post(`/users/follow/${userId}`);
  return res.data;
};

export const getFollowList = async (userId, type) => {
  const res = await api.get(`/users/${userId}/${type}`);
  return res.data;
};

/* ==============================
   📋 ACCOUNT SETTINGS (NEW)
============================== */

export const getAccountInfo = async () => {
  const res = await api.get('/users/account-info');
  return res.data;
};

export const updateAccountInfo = async (data) => {
  const res = await api.patch('/users/account-info', data);
  return res.data;
};

export const deleteAccount = async (password) => {
  const res = await api.delete('/users/delete-account', {
    data: { password },
  });
  return res.data;
};

/* ==============================
   🔒 PRIVACY SETTINGS (NEW)
============================== */

export const getPrivacySettings = async () => {
  const res = await api.get('/users/privacy');
  return res.data;
};

export const updatePrivacySettings = async (data) => {
  const res = await api.patch('/users/privacy', data);
  return res.data;
};

export const blockUser = async (userId) => {
  const res = await api.post(`/users/block/${userId}`);
  return res.data;
};

export const getBlockedUsers = async () => {
  const res = await api.get('/users/blocked');
  return res.data;
};

export const muteUser = async (userId) => {
  const res = await api.post(`/users/mute/${userId}`);
  return res.data;
};

export const getMutedUsers = async () => {
  const res = await api.get('/users/muted');
  return res.data;
};

/* ==============================
   🛡️ SECURITY SETTINGS (NEW)
============================== */

export const getLoginActivity = async () => {
  const res = await api.get('/users/login-activity');
  return res.data;
};

export const toggleTwoFactor = async () => {
  const res = await api.patch('/users/two-factor');
  return res.data;
};