// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import Storage from '../../utils/storage';
// import api from '../../services/api';
// import { login, register, getMe } from '../../api/Auth.api';
// import { initSocket, disconnectSocket } from '../../services/socket';
// import { cacheProfileImage } from '../../utils/profileImageCache';

// /* =========================
//    ASYNC THUNKS
// ========================= */

// /* =========================
//    REGISTER (OTP FLOW)
//    ❌ DO NOT AUTO-LOGIN
// ========================= */
// export const registerUser = createAsyncThunk(
//   'auth/register',
//   async (data, { rejectWithValue }) => {
//     try {
//       const res = await register(data);

//       // ❌ Do NOT store token/user here
//       // ❌ Do NOT init socket
//       // OTP flow requires manual login

//       return res;
//     } catch (err) {
//       return rejectWithValue(
//         err?.response?.data?.message || 'Registration failed'
//       );
//     }
//   }
// );

// /* =========================
//    LOGIN (FIXED)
// ========================= */
// export const loginUser = createAsyncThunk(
//   'auth/login',
//   async ({ email, password }, { rejectWithValue }) => {
//     try {
//       // 🔥 CRITICAL FIX:
//       // Clear any stale session before login
//       await Storage.clearSession();

//       const res = await login(email, password);

//       // Defensive check
//       if (!res?.token || !res?.user) {
//         throw new Error('Invalid login response');
//       }

//       await Storage.setToken(res.token);
//       await Storage.setUser(res.user);

//       // ✅ Socket only after successful login
//       initSocket();

//       return res;
//     } catch (err) {
//       return rejectWithValue(
//         err?.response?.data?.message || 'Invalid email or password'
//       );
//     }
//   }
// );

// /* =========================
//    LOAD CURRENT USER
// ========================= */
// export const loadUser = createAsyncThunk(
//   'auth/loadUser',
//   async (_, { rejectWithValue }) => {
//     try {
//       const res = await getMe();
//       const user = res.data;

//       let cachedPath = null;
//       if (user.profilePicture) {
//         cachedPath = await cacheProfileImage(user.profilePicture);
//       }

//       return {
//         ...user,
//         profilePictureCached: cachedPath,
//       };
//     } catch {
//       return rejectWithValue('Session expired');
//     }
//   }
// );

// /* =========================
//    UPDATE PROFILE
// ========================= */
// export const updateProfile = createAsyncThunk(
//   'auth/updateProfile',
//   async (formData, { rejectWithValue }) => {
//     try {
//       const res = await api.put('/users/update', formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       });

//       const updatedUser = res.data.data;

//       let cachedPath = null;
//       if (updatedUser.profilePicture) {
//         cachedPath = await cacheProfileImage(updatedUser.profilePicture);
//       }

//       return {
//         ...updatedUser,
//         profilePictureCached: cachedPath,
//       };
//     } catch (err) {
//       return rejectWithValue(
//         err?.response?.data?.message || 'Profile update failed'
//       );
//     }
//   }
// );

// /* =========================
//    SLICE
// ========================= */

// const authSlice = createSlice({
//   name: 'auth',

//   initialState: {
//     user: null,
//     isAuthenticated: false,
//     loading: true,
//     unreadMessages: {},
//   },

//   reducers: {
//     logout: (state) => {
//       state.user = null;
//       state.isAuthenticated = false;
//       state.loading = false;
//       state.unreadMessages = {};

//       Storage.clearSession();
//       disconnectSocket();
//     },

//     incrementUnread: (state, action) => {
//       const senderId = action.payload;
//       state.unreadMessages[senderId] =
//         (state.unreadMessages[senderId] || 0) + 1;
//     },

//     clearUnread: (state, action) => {
//       delete state.unreadMessages[action.payload];
//     },
//   },

//   extraReducers: (builder) => {
//     builder
//       /* LOGIN */
//       .addCase(loginUser.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(loginUser.fulfilled, (state, action) => {
//         state.user = action.payload.user;
//         state.isAuthenticated = true;
//         state.loading = false;
//       })
//       .addCase(loginUser.rejected, (state) => {
//         state.loading = false;
//         state.isAuthenticated = false;
//       })

//       /* REGISTER (OTP) */
//       .addCase(registerUser.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(registerUser.fulfilled, (state) => {
//         // ❌ User is NOT logged in after OTP signup
//         state.loading = false;
//         state.isAuthenticated = false;
//       })
//       .addCase(registerUser.rejected, (state) => {
//         state.loading = false;
//       })

//       /* LOAD USER */
//       .addCase(loadUser.fulfilled, (state, action) => {
//         state.user = action.payload;
//         state.isAuthenticated = true;
//         state.loading = false;
//       })
//       .addCase(loadUser.rejected, (state) => {
//         state.user = null;
//         state.isAuthenticated = false;
//         state.loading = false;
//       })

//       /* UPDATE PROFILE */
//       .addCase(updateProfile.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(updateProfile.fulfilled, (state, action) => {
//         state.user = {
//           ...state.user,
//           ...action.payload,
//         };
//         state.loading = false;
//       })
//       .addCase(updateProfile.rejected, (state) => {
//         state.loading = false;
//       });
//   },
// });

// export const {
//   logout,
//   incrementUnread,
//   clearUnread,
// } = authSlice.actions;

// export default authSlice.reducer;









import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Storage from '../../utils/storage';
import api from '../../services/api';
import { login, register, getMe, verify2FA as verify2FAApi } from '../../api/Auth.api';
import { initSocket, disconnectSocket } from '../../services/socket';
import { cacheProfileImage } from '../../utils/profileImageCache';

/* =========================
   ASYNC THUNKS
========================= */

/* =========================
   REGISTER (OTP FLOW)
   ❌ DO NOT AUTO-LOGIN
========================= */
export const registerUser = createAsyncThunk(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      const res = await register(data);
      return res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || 'Registration failed'
      );
    }
  }
);

/* =========================
   LOGIN (WITH 2FA SUPPORT)
========================= */
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      // 🔥 Clear any stale session before login
      await Storage.clearSession();

      const res = await login(email, password);

      // ✅ 2FA REQUIRED — don't store token yet
      if (res.requires2FA) {
        return {
          requires2FA: true,
          tempUserId: res.tempUserId,
          email: res.email,
        };
      }

      // ✅ NORMAL LOGIN — no 2FA
      if (!res?.token || !res?.user) {
        throw new Error('Invalid login response');
      }

      await Storage.setToken(res.token);
      await Storage.setUser(res.user);

      initSocket();

      return {
        requires2FA: false,
        token: res.token,
        user: res.user,
      };
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || 'Invalid email or password'
      );
    }
  }
);

/* =========================
   VERIFY 2FA (NEW)
========================= */
export const verify2FA = createAsyncThunk(
  'auth/verify2FA',
  async ({ email, otp, tempUserId }, { rejectWithValue }) => {
    try {
      const res = await verify2FAApi({ email, otp, tempUserId });

      if (!res?.token || !res?.user) {
        throw new Error('Invalid 2FA response');
      }

      await Storage.setToken(res.token);
      await Storage.setUser(res.user);

      initSocket();

      return {
        token: res.token,
        user: res.user,
      };
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || 'Verification failed'
      );
    }
  }
);

/* =========================
   LOAD CURRENT USER
========================= */
export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getMe();
      const user = res.data;

      let cachedPath = null;
      if (user.profilePicture) {
        cachedPath = await cacheProfileImage(user.profilePicture);
      }

      return {
        ...user,
        profilePictureCached: cachedPath,
      };
    } catch {
      return rejectWithValue('Session expired');
    }
  }
);

/* =========================
   UPDATE PROFILE
========================= */
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (formData, { rejectWithValue }) => {
    try {
      const res = await api.put('/users/update', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const updatedUser = res.data.data;

      let cachedPath = null;
      if (updatedUser.profilePicture) {
        cachedPath = await cacheProfileImage(updatedUser.profilePicture);
      }

      return {
        ...updatedUser,
        profilePictureCached: cachedPath,
      };
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || 'Profile update failed'
      );
    }
  }
);

/* =========================
   SLICE
========================= */

const authSlice = createSlice({
  name: 'auth',

  initialState: {
    user: null,
    isAuthenticated: false,
    loading: true,
    unreadMessages: {},

    // 2FA state
    requires2FA: false,
    twoFactorEmail: null,
    twoFactorTempUserId: null,
  },

  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.unreadMessages = {};
      state.requires2FA = false;
      state.twoFactorEmail = null;
      state.twoFactorTempUserId = null;

      Storage.clearSession();
      disconnectSocket();
    },

    // ✅ Clear 2FA state (e.g., user goes back to login)
    clear2FA: (state) => {
      state.requires2FA = false;
      state.twoFactorEmail = null;
      state.twoFactorTempUserId = null;
    },

    incrementUnread: (state, action) => {
      const senderId = action.payload;
      state.unreadMessages[senderId] =
        (state.unreadMessages[senderId] || 0) + 1;
    },

    clearUnread: (state, action) => {
      delete state.unreadMessages[action.payload];
    },
  },

  extraReducers: (builder) => {
    builder
      /* LOGIN */
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        if (action.payload.requires2FA) {
          // 🔐 2FA required — stay unauthenticated
          state.requires2FA = true;
          state.twoFactorEmail = action.payload.email;
          state.twoFactorTempUserId = action.payload.tempUserId;
          state.isAuthenticated = false;
          state.loading = false;
        } else {
          // ✅ Normal login
          state.user = action.payload.user;
          state.isAuthenticated = true;
          state.loading = false;
          state.requires2FA = false;
          state.twoFactorEmail = null;
          state.twoFactorTempUserId = null;
        }
      })
      .addCase(loginUser.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
      })

      /* VERIFY 2FA */
      .addCase(verify2FA.pending, (state) => {
        state.loading = true;
      })
      .addCase(verify2FA.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.loading = false;
        state.requires2FA = false;
        state.twoFactorEmail = null;
        state.twoFactorTempUserId = null;
      })
      .addCase(verify2FA.rejected, (state) => {
        state.loading = false;
        // Keep 2FA state so user can retry
      })

      /* REGISTER (OTP) */
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
      })
      .addCase(registerUser.rejected, (state) => {
        state.loading = false;
      })

      /* LOAD USER */
      .addCase(loadUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(loadUser.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
      })

      /* UPDATE PROFILE */
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = {
          ...state.user,
          ...action.payload,
        };
        state.loading = false;
      })
      .addCase(updateProfile.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const {
  logout,
  clear2FA,
  incrementUnread,
  clearUnread,
} = authSlice.actions;

export default authSlice.reducer;