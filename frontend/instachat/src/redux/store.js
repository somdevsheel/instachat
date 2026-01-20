import { configureStore } from '@reduxjs/toolkit';

import authReducer from './slices/authSlice';
import feedReducer from './slices/feedSlice';
import chatReducer from './slices/chatSlice';
import storyReducer from './slices/storySlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    feed: feedReducer,
    chat: chatReducer,
    stories: storyReducer,
  },

  // React Native + sockets + FormData = non-serializable values
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),

  devTools: __DEV__,
});

export default store;
