export { default as store } from './redux/store';

export {
  loginUser,
  verify2FA,
  loadUser,
  updateProfile,
  logout,
  clear2FA,
  incrementUnread,
  clearUnread,
} from './redux/slices/authSlice';

export { fetchFeed, toggleLike, clearFeed } from './redux/slices/feedSlice';

export {
  fetchChats,
  getOrCreateChat,
  fetchMessages,
  sendMessage,
  deleteMessage,
  fetchUnreadCount,
  setActiveChat,
  addMessage,
  messageDeleted,
  markChatRead,
  clearMessages,
  clearChats,
} from './redux/slices/chatSlice';

export {
  fetchStories,
  clearStories,
  addStory,
  markStoriesViewed,
  setViewedStories,
} from './redux/slices/storySlice';

export {
  fetchReels,
  toggleReelLike,
  trackReelView,
  deleteReel as deleteReelThunk,
  addNewReel,
} from './redux/slices/reelSlice';

export { toggleFollow } from './redux/slices/followSlice';

export {
  setNotifications,
  addNotification,
  setUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotifications,
} from './redux/slices/notificationSlice';

export { default as api, configureApiBaseUrl } from './services/api';
export {
  initSocket,
  joinChatRoom,
  leaveChatRoom,
  emitNewMessage,
  emitTyping,
  emitStopTyping,
  getSocket,
  disconnectSocket,
  configureSocketUrl,
} from './services/socket';

export { default as Storage } from './utils/storage';
export { default as feedEvents } from './utils/feedEvents';

export { default as colors } from './theme/colors';

export * as authApi from './api/Auth.api';
export * as chatApi from './api/Chat.api';
export * as commentsApi from './api/Comments.api';
export * as mediaApi from './api/Media.api';
export * as notificationApi from './api/Notification.api';
export * as postsApi from './api/Posts.api';
export * as reelsApi from './api/reels.api';
export * as reportApi from './api/report.api';
export * as userApi from './api/User.api';
export * as storyApi from './api/Story.api';
export * as groupApi from './api/Group.api';
export * as eventApi from './api/Event.api';
export * as marketplaceApi from './api/Marketplace.api';
