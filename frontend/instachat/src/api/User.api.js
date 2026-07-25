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








// import api from '../services/api';

// /* ==============================
//    SEARCH
// ============================== */

// export const searchUsers = async (query) => {
//   const res = await api.get(`/users/search?q=${query}`);
//   return res.data;
// };

// /* ==============================
//    PROFILE
// ============================== */

// export const getUserProfile = async (username) => {
//   const res = await api.get(`/users/profile/${username}`);
//   return res.data;
// };

// export const getMyProfile = async () => {
//   const res = await api.get('/auth/me');
//   return res.data;
// };

// export const updateUserProfile = async (formData) => {
//   const res = await api.put('/users/update', formData, {
//     headers: {
//       'Content-Type': 'multipart/form-data',
//     },
//   });
//   return res.data;
// };

// /* ==============================
//    FOLLOW
// ============================== */

// export const followUser = async (userId) => {
//   const res = await api.post(`/users/follow/${userId}`);
//   return res.data;
// };

// export const getSuggestedUsers = async () => {
//   const res = await api.get('/users/suggestions');
//   return res.data;
// };

// export const toggleFollowUser = async (userId) => {
//   const res = await api.post(`/users/follow/${userId}`);
//   return res.data;
// };

// export const getFollowList = async (userId, type) => {
//   const res = await api.get(`/users/${userId}/${type}`);
//   return res.data;
// };

// /* ==============================
//    📋 ACCOUNT SETTINGS (NEW)
// ============================== */

// export const getAccountInfo = async () => {
//   const res = await api.get('/users/account-info');
//   return res.data;
// };

// export const updateAccountInfo = async (data) => {
//   const res = await api.patch('/users/account-info', data);
//   return res.data;
// };

// export const deleteAccount = async (password) => {
//   const res = await api.delete('/users/delete-account', {
//     data: { password },
//   });
//   return res.data;
// };

// /* ==============================
//    🔒 PRIVACY SETTINGS (NEW)
// ============================== */

// export const getPrivacySettings = async () => {
//   const res = await api.get('/users/privacy');
//   return res.data;
// };

// export const updatePrivacySettings = async (data) => {
//   const res = await api.patch('/users/privacy', data);
//   return res.data;
// };

// export const blockUser = async (userId) => {
//   const res = await api.post(`/users/block/${userId}`);
//   return res.data;
// };

// export const getBlockedUsers = async () => {
//   const res = await api.get('/users/blocked');
//   return res.data;
// };

// export const muteUser = async (userId) => {
//   const res = await api.post(`/users/mute/${userId}`);
//   return res.data;
// };

// export const getMutedUsers = async () => {
//   const res = await api.get('/users/muted');
//   return res.data;
// };

// /* ==============================
//    🛡️ SECURITY SETTINGS (NEW)
// ============================== */

// export const getLoginActivity = async () => {
//   const res = await api.get('/users/login-activity');
//   return res.data;
// };

// export const toggleTwoFactor = async () => {
//   const res = await api.patch('/users/two-factor');
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
   💜 CLOSE FRIENDS
============================== */

export const getCloseFriendsCandidates = async () => {
  const res = await api.get('/users/close-friends/manage');
  return res.data;
};

export const toggleCloseFriend = async (userId) => {
  const res = await api.put(`/users/close-friends/${userId}`);
  return res.data;
};

/* ==============================
   📋 ACCOUNT SETTINGS
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
   🔒 PRIVACY SETTINGS
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
   🛡️ SECURITY SETTINGS
============================== */

export const getLoginActivity = async () => {
  const res = await api.get('/users/login-activity');
  return res.data;
};

export const toggleTwoFactor = async () => {
  try {
    const res = await api.patch('/users/two-factor');
    const data = res.data;

    // ✅ Log raw response so you can verify the shape during development
    console.log('[toggleTwoFactor] raw response:', JSON.stringify(data));

    // ✅ Normalize response — handles all common backend shapes:
    //
    //   Shape A: { success: true, twoFactorEnabled: true, message: '...' }
    //   Shape B: { success: true, data: { twoFactorEnabled: true }, message: '...' }
    //   Shape C: { twoFactorEnabled: true, message: '...' }
    //   Shape D: { data: { twoFactorEnabled: true } }

    const twoFactorEnabled =
      typeof data.twoFactorEnabled === 'boolean'
        ? data.twoFactorEnabled
        : typeof data.data?.twoFactorEnabled === 'boolean'
        ? data.data.twoFactorEnabled
        : typeof data.user?.twoFactorEnabled === 'boolean'
        ? data.user.twoFactorEnabled
        : null;

    if (twoFactorEnabled === null) {
      // Backend responded but we couldn't find the field — log and throw
      console.warn(
        '[toggleTwoFactor] Could not find twoFactorEnabled in response:',
        JSON.stringify(data)
      );
      throw new Error('Unexpected response format from server');
    }

    return {
      success: data.success ?? true,
      twoFactorEnabled,
      message:
        data.message ??
        (twoFactorEnabled
          ? 'Two-factor authentication enabled'
          : 'Two-factor authentication disabled'),
    };
  } catch (err) {
    // ✅ Detailed error logging so you can see exactly what went wrong
    console.error('[toggleTwoFactor] status :', err?.response?.status);
    console.error('[toggleTwoFactor] data   :', JSON.stringify(err?.response?.data));
    console.error('[toggleTwoFactor] message:', err?.message);
    throw err; // re-throw so SecuritySettingsScreen catch block handles it
  }
};

/* ==============================
   PUSH NOTIFICATIONS
============================== */

export const registerPushToken = async (token) => {
  const res = await api.post('/users/push-token', { token });
  return res.data;
};

export const removePushToken = async (token) => {
  const res = await api.delete('/users/push-token', { data: { token } });
  return res.data;
};