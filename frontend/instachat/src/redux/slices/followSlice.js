import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { followUser } from '../../api/User.api';

/* =========================
   TOGGLE FOLLOW / UNFOLLOW
========================= */
export const toggleFollow = createAsyncThunk(
  'follow/toggle',
  async (userId, { rejectWithValue }) => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const res = await followUser(userId);

      // Expecting backend: { success, data: { following, followersCount } }
      if (!res?.success) {
        throw new Error('Follow action failed');
      }

      return {
        userId,
        following: res.data?.following,
        followersCount: res.data?.followersCount,
      };
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || err.message || 'Follow failed'
      );
    }
  }
);

/* =========================
   SLICE
========================= */
const followSlice = createSlice({
  name: 'follow',

  initialState: {
    loading: false,
    error: null,
    lastAction: null, // optional: useful for UI sync
  },

  reducers: {
    clearFollowError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(toggleFollow.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(toggleFollow.fulfilled, (state, action) => {
        state.loading = false;
        state.lastAction = action.payload;
      })

      .addCase(toggleFollow.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearFollowError } = followSlice.actions;
export default followSlice.reducer;
