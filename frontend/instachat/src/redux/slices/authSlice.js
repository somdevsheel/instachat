import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Storage from '../../utils/storage';
import api from '../../services/api';
import { login, register, getMe } from '../../api/Auth.api';
import { initSocket, disconnectSocket } from '../../services/socket';
import { cacheProfileImage } from '../../utils/profileImageCache';

/* =========================
   ASYNC THUNKS
========================= */

// REGISTER
export const registerUser = createAsyncThunk(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      const res = await register(data);

      await Storage.setToken(res.token);
      await Storage.setUser(res.user);

      // ✅ Socket only (no crypto)
      initSocket();

      return res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || 'Registration failed'
      );
    }
  }
);

// LOGIN
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await login(email, password);

      await Storage.setToken(res.token);
      await Storage.setUser(res.user);

      // ✅ Socket only (no crypto)
      initSocket();

      return res;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || 'Login failed'
      );
    }
  }
);

// LOAD CURRENT USER (AUTO LOGIN)
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
  },

  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.unreadMessages = {};

      Storage.clearSession();
      disconnectSocket();
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
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(loginUser.rejected, (state) => {
        state.loading = false;
      })

      .addCase(registerUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state) => {
        state.loading = false;
      })

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

export const { logout, incrementUnread, clearUnread } = authSlice.actions;
export default authSlice.reducer;
