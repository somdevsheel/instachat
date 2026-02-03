import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

/* =========================
   ASYNC THUNKS
========================= */

/**
 * Fetch recent chats (inbox)
 */
export const fetchChats = createAsyncThunk(
  'chat/fetchChats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/chats');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch chats'
      );
    }
  }
);

/**
 * Get or create 1-1 chat
 */
export const getOrCreateChat = createAsyncThunk(
  'chat/getOrCreateChat',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/chats/with/${userId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create chat'
      );
    }
  }
);

/**
 * Fetch messages of a chat
 */
export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (chatId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/chats/${chatId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch messages'
      );
    }
  }
);

/**
 * Send message
 */
export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ chatId, receiverId, text }, { rejectWithValue }) => {
    try {
      const response = await api.post('/chats/message', {
        chatId,
        receiverId,
        text,
        encryptionMode: 'plain',
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to send message'
      );
    }
  }
);

/**
 * Delete message
 */
export const deleteMessage = createAsyncThunk(
  'chat/deleteMessage',
  async ({ messageId, mode }, { rejectWithValue }) => {
    try {
      await api.post(`/chats/message/${messageId}/delete`, { mode });
      return { messageId, mode };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete message'
      );
    }
  }
);

/**
 * ✅ Fetch unread message count
 */
export const fetchUnreadCount = createAsyncThunk(
  'chat/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/chats/unread-count');
      return response.data.data.count;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch unread count'
      );
    }
  }
);

/* =========================
   SLICE
========================= */

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    chats: [],
    messages: [],
    activeChat: null,
    loading: false,
    chatsLoading: false,
    error: null,
    unreadCount: 0, // ✅ NEW
  },

  reducers: {
    setActiveChat: (state, action) => {
      state.activeChat = action.payload;
    },

    addMessage: (state, action) => {
      const exists = state.messages.some(
        msg => msg._id === action.payload._id
      );
      if (!exists) {
        state.messages.push(action.payload);
      }

      const chatIndex = state.chats.findIndex(
        chat => chat._id === action.payload.chat
      );
      if (chatIndex !== -1) {
        state.chats[chatIndex].lastMessage = action.payload;
        state.chats[chatIndex].updatedAt = action.payload.createdAt;

        const [updatedChat] = state.chats.splice(chatIndex, 1);
        state.chats.unshift(updatedChat);
      }
    },

    messageDeleted: (state, action) => {
      const { messageId, mode } = action.payload;

      if (mode === 'everyone') {
        const msg = state.messages.find(m => m._id === messageId);
        if (msg) {
          msg.deletedForEveryone = true;
          msg.deletedAt = new Date().toISOString();
        }
      } else if (mode === 'me') {
        state.messages = state.messages.filter(
          m => m._id !== messageId
        );
      }
    },

    markChatRead: (state, action) => {
      const { readerId, myUserId } = action.payload;

      state.messages.forEach(msg => {
        if (
          msg.sender?._id === myUserId &&
          !msg.readBy?.some(r => r.user === readerId)
        ) {
          if (!msg.readBy) msg.readBy = [];
          msg.readBy.push({
            user: readerId,
            readAt: new Date().toISOString(),
          });
        }
      });
    },

    // ✅ NEW: Update unread count
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },

    // ✅ NEW: Increment unread count
    incrementUnreadCount: (state) => {
      state.unreadCount += 1;
    },

    // ✅ NEW: Decrement unread count
    decrementUnreadCount: (state, action) => {
      const count = action.payload || 1;
      state.unreadCount = Math.max(0, state.unreadCount - count);
    },

    clearMessages: state => {
      state.messages = [];
      state.activeChat = null;
    },

    clearChats: state => {
      state.chats = [];
      state.messages = [];
      state.activeChat = null;
      state.unreadCount = 0;
    },
  },

  extraReducers: builder => {
    builder
      // Fetch Chats
      .addCase(fetchChats.pending, state => {
        state.chatsLoading = true;
        state.error = null;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.chatsLoading = false;
        state.chats = action.payload;
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.chatsLoading = false;
        state.error = action.payload;
      })

      // Get or Create Chat
      .addCase(getOrCreateChat.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrCreateChat.fulfilled, (state, action) => {
        state.loading = false;

        const exists = state.chats.some(
          chat => chat._id === action.payload._id
        );
        if (!exists) {
          state.chats.unshift(action.payload);
        }
      })
      .addCase(getOrCreateChat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Messages
      .addCase(fetchMessages.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Send Message
      .addCase(sendMessage.fulfilled, (state, action) => {
        const message = action.payload;

        const exists = state.messages.some(
          msg => msg._id === message._id
        );
        if (!exists) {
          state.messages.push(message);
        }

        const chatIndex = state.chats.findIndex(
          chat => chat._id === message.chat
        );
        if (chatIndex !== -1) {
          state.chats[chatIndex].lastMessage = message;
          state.chats[chatIndex].updatedAt = message.createdAt;

          const [updatedChat] = state.chats.splice(chatIndex, 1);
          state.chats.unshift(updatedChat);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload;
      })

      // ✅ Fetch Unread Count
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(fetchUnreadCount.rejected, (state) => {
        state.unreadCount = 0;
      });
  },
});

export const {
  setActiveChat,
  addMessage,
  messageDeleted,
  markChatRead,
  setUnreadCount,
  incrementUnreadCount,
  decrementUnreadCount,
  clearMessages,
  clearChats,
} = chatSlice.actions;

export default chatSlice.reducer;