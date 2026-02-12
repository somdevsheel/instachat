import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getFeed, likePost } from '../../api/Posts.api';

/* =========================
   FETCH FEED
========================= */
export const fetchFeed = createAsyncThunk(
  'feed/fetchFeed',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getFeed();

      // backend returns: { success, data }
      if (!res?.success) {
        throw new Error('Invalid feed response');
      }

      return res.data || [];
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || 'Failed to load feed'
      );
    }
  }
);

/* =========================
   LIKE / UNLIKE POST
========================= */
export const toggleLike = createAsyncThunk(
  'feed/toggleLike',
  async (postId, { rejectWithValue }) => {
    try {
      if (!postId) {
        throw new Error('Post ID is required');
      }

      const res = await likePost(postId);

      // backend returns: { success, data: { liked, likesCount } }
      if (!res?.success) {
        throw new Error('Like failed');
      }

      return {
        postId,
        liked: res.data.liked,
        likesCount: res.data.likesCount,
      };
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || err.message || 'Failed to like post'
      );
    }
  }
);

/* =========================
   SLICE
========================= */
const feedSlice = createSlice({
  name: 'feed',

  initialState: {
    posts: [],
    loading: false,
    error: null,
  },

  reducers: {
    clearFeed: (state) => {
      state.posts = [];
      state.loading = false;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      /* ================= FETCH FEED ================= */
      .addCase(fetchFeed.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchFeed.fulfilled, (state, action) => {
        state.loading = false;

        // Trust backend isLiked if present, else default false
        state.posts = action.payload.map(post => ({
          ...post,
          isLiked: post.isLiked ?? false,
          likesCount: post.likesCount ?? 0,
        }));
      })

      .addCase(fetchFeed.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ================= LIKE POST ================= */
      .addCase(toggleLike.fulfilled, (state, action) => {
        const { postId, liked, likesCount } = action.payload;

        const post = state.posts.find(p => p._id === postId);
        if (!post) return;

        post.isLiked = liked;
        post.likesCount = likesCount;
      })

      .addCase(toggleLike.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearFeed } = feedSlice.actions;
export default feedSlice.reducer;
