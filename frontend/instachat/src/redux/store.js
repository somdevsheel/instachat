// import { configureStore } from '@reduxjs/toolkit';
// import authReducer from './slices/authSlice';
// import feedReducer from './slices/feedSlice';
// import chatReducer from './slices/chatSlice';
// import storyReducer from './slices/storySlice';
// import notificationReducer from './slices/notificationSlice';

// const store = configureStore({
//   reducer: {
//     auth: authReducer,
//     feed: feedReducer,
//     chat: chatReducer,
//     stories: storyReducer,
//     notifications: notificationReducer,
//   },
//   middleware: (getDefaultMiddleware) =>
//     getDefaultMiddleware({
//       serializableCheck: false,
//     }),
//   devTools: __DEV__,
// });

// export default store;







import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import feedReducer from './slices/feedSlice';
import chatReducer from './slices/chatSlice';
import storyReducer from './slices/storySlice';
import notificationReducer from './slices/notificationSlice';
import reelReducer from './slices/reelSlice'; // ✅ NEW

const store = configureStore({
  reducer: {
    auth: authReducer,
    feed: feedReducer,
    chat: chatReducer,
    stories: storyReducer,
    notifications: notificationReducer,
    reels: reelReducer, // ✅ NEW
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools: __DEV__,
});

export default store;