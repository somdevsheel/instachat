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
import reelReducer from './slices/reelSlice';

// `__DEV__` is a React Native/Metro global — doesn't exist in a plain
// browser bundle, so this package (used by both) checks for it safely
// instead of assuming either bundler's convention.
const isDev =
  typeof __DEV__ !== 'undefined'
    ? __DEV__
    : typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';

const store = configureStore({
  reducer: {
    auth: authReducer,
    feed: feedReducer,
    chat: chatReducer,
    stories: storyReducer,
    notifications: notificationReducer,
    reels: reelReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools: isDev,
});

export default store;