import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getStoryFeed } from '../../api/Story.api';

/* =========================
   FETCH STORIES
========================= */
export const fetchStories = createAsyncThunk(
  'stories/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getStoryFeed();

      // Expected backend shape:
      // { success: true, stories: [...] }
      if (!res || !Array.isArray(res.stories)) {
        return [];
      }

      return res.stories;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || 'Failed to load stories'
      );
    }
  }
);

/* =========================
   SLICE
========================= */
const storySlice = createSlice({
  name: 'stories',

  initialState: {
    list: [],
    loading: false,
    error: null,
  },

  reducers: {
    clearStories: (state) => {
      state.list = [];
      state.loading = false;
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchStories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchStories.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload; // always array
      })

      .addCase(fetchStories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearStories } = storySlice.actions;
export default storySlice.reducer;
