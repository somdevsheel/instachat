import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStoryFeed } from '../../api/Story.api';

const VIEWED_STORIES_KEY = '@instachat_viewed_stories';

/* =========================
   FETCH STORIES
========================= */
export const fetchStories = createAsyncThunk(
  'stories/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getStoryFeed();
      console.log('📊 Story feed response:', res);

      if (!res || !res.data) {
        return [];
      }

      return res.data;
    } catch (err) {
      console.error('❌ Fetch stories error:', err);
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
    viewedStoryIds: [],
  },

  reducers: {
    clearStories: (state) => {
      state.list = [];
      state.loading = false;
      state.error = null;
      state.viewedStoryIds = [];
      AsyncStorage.removeItem(VIEWED_STORIES_KEY);
    },

    addStory: (state, action) => {
      const newStory = action.payload;
      const userGroup = state.list.find(
        g => g.user._id === newStory.user._id
      );

      if (userGroup) {
        userGroup.stories.unshift(newStory);
      } else {
        state.list.unshift({
          user: newStory.user,
          stories: [newStory],
        });
      }
    },

    // ✅ MARK STORIES AS VIEWED (PERSISTED)
    markStoriesViewed: (state, action) => {
      const storyIds = action.payload;

      storyIds.forEach(id => {
        if (!state.viewedStoryIds.includes(id)) {
          state.viewedStoryIds.push(id);
        }
      });

      AsyncStorage.setItem(
        VIEWED_STORIES_KEY,
        JSON.stringify(state.viewedStoryIds)
      );
    },

    // ✅ RESTORE VIEWED STORIES ON APP LOAD
    setViewedStories: (state, action) => {
      state.viewedStoryIds = action.payload || [];
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
        state.list = action.payload;
      })
      .addCase(fetchStories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

/* =========================
   EXPORTS
========================= */
export const {
  clearStories,
  addStory,
  markStoriesViewed,
  setViewedStories,
} = storySlice.actions;

export default storySlice.reducer;
