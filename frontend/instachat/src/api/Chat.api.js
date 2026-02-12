// import api from '../services/api';

// /**
//  * ============================
//  * GET RECENT CHATS (INBOX)
//  * GET /api/v1/chats
//  * ============================
//  */
// export const getInbox = async () => {
//   const res = await api.get('/chats');
//   return res.data;
// };

// /**
//  * ============================
//  * GET OR CREATE 1–1 CHAT
//  * GET /api/v1/chats/with/:userId
//  * ============================
//  */
// export const getOrCreateChat = async (userId) => {
//   const res = await api.get(`/chats/with/${userId}`);
//   return res.data;
// };

// /**
//  * ============================
//  * GET CHAT HISTORY
//  * GET /api/v1/chats/:chatId
//  * ============================
//  */
// export const getChatHistory = async (chatId) => {
//   const res = await api.get(`/chats/${chatId}`);
//   return res.data;
// };

// /**
//  * ============================
//  * SEND NORMAL MESSAGE
//  * POST /api/v1/chats/message
//  * ============================
//  */
// export const sendMessage = async ({
//   chatId,
//   receiverId,
//   text,
// }) => {
//   const res = await api.post('/chats/message', {
//     chatId,
//     receiverId,
//     text,
//   });
//   return res.data;
// };

// /**
//  * ============================
//  * SEND STORY REPLY
//  * POST /api/v1/chats/story-reply
//  * ============================
//  */
// export const sendStoryReply = async ({
//   storyId,
//   receiverId,
//   text,
// }) => {
//   const res = await api.post('/chats/story-reply', {
//     storyId,
//     receiverId,
//     text,
//   });
//   return res.data;
// };

// /**
//  * ============================
//  * MARK CHAT AS READ
//  * POST /api/v1/chats/:chatId/read
//  * ============================
//  */
// export const markChatRead = async (chatId) => {
//   const res = await api.post(`/chats/${chatId}/read`);
//   return res.data;
// };

// /**
//  * ============================
//  * GET UNREAD MESSAGE COUNT
//  * GET /api/v1/chats/unread-count
//  * ============================
//  */
// export const getUnreadCount = async () => {
//   try {
//     const res = await api.get('/chats/unread-count');
//     return res.data;
//   } catch (error) {
//     console.error('❌ getUnreadCount error:', error);
//     return { success: false, data: { count: 0 } };
//   }
// };







import api from '../services/api';

/**
 * ============================
 * GET RECENT CHATS (INBOX)
 * GET /api/v1/chats
 * ============================
 */
export const getInbox = async () => {
  const res = await api.get('/chats');
  return res.data;
};

/**
 * ============================
 * GET OR CREATE 1–1 CHAT
 * GET /api/v1/chats/with/:userId
 * ============================
 */
export const getOrCreateChat = async (userId) => {
  const res = await api.get(`/chats/with/${userId}`);
  return res.data;
};

/**
 * ============================
 * GET CHAT HISTORY
 * GET /api/v1/chats/:chatId
 * ============================
 */
export const getChatHistory = async (chatId) => {
  const res = await api.get(`/chats/${chatId}`);
  return res.data;
};

/**
 * ============================
 * SEND NORMAL MESSAGE
 * POST /api/v1/chats/message
 * ============================
 */
export const sendMessage = async ({
  chatId,
  receiverId,
  text,
}) => {
  const res = await api.post('/chats/message', {
    chatId,
    receiverId,
    text,
  });
  return res.data;
};

/**
 * ============================
 * SEND STORY REPLY
 * POST /api/v1/chats/story-reply
 * ============================
 */
export const sendStoryReply = async ({
  storyId,
  receiverId,
  text,
}) => {
  const res = await api.post('/chats/story-reply', {
    storyId,
    receiverId,
    text,
  });
  return res.data;
};

/**
 * ============================
 * MARK CHAT AS READ
 * POST /api/v1/chats/:chatId/read
 * ============================
 */
export const markChatRead = async (chatId) => {
  const res = await api.post(`/chats/${chatId}/read`);
  return res.data;
};

/**
 * ============================
 * GET UNREAD MESSAGE COUNT
 * GET /api/v1/chats/unread-count
 * ============================
 */
export const getUnreadCount = async () => {
  try {
    const res = await api.get('/chats/unread-count');
    return res.data;
  } catch (error) {
    console.error('❌ getUnreadCount error:', error);
    return { success: false, data: { count: 0 } };
  }
};

/**
 * ============================
 * MARK ALL MESSAGES AS READ
 * POST /api/v1/chats/mark-all-read
 * ============================
 */
export const markAllAsRead = async () => {
  try {
    const res = await api.post('/chats/mark-all-read');
    return res.data;
  } catch (error) {
    console.error('❌ markAllAsRead error:', error);
    throw error;
  }
};