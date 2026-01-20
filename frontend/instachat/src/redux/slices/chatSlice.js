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
 * Fetch chat messages
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
 * Send encrypted message
 * ✅ Now includes plaintext for local display
 */
export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ chatId, receiverId, encryptedPayloads, plaintext }, { rejectWithValue }) => {
    try {
      console.log('🔐 Sending encrypted message:', {
        chatId,
        receiverId,
        payloadCount: encryptedPayloads?.length,
      });

      const response = await api.post('/chats/message', {
        chatId,
        receiverId,
        encryptedPayloads,
      });

      console.log('✅ Message sent successfully');
      
      // ✅ Return both the message and plaintext for local storage
      return {
        message: response.data.data,
        plaintext, // Store locally so we can display our own messages
      };
    } catch (error) {
      console.error('❌ Send message error:', error.response?.data || error.message);
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
    // ✅ Store plaintext of sent messages (in-memory only)
    sentMessagesPlaintext: {}, // { messageId: plaintext }
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

      // Update last message in chats list
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

    clearMessages: state => {
      state.messages = [];
      state.activeChat = null;
      state.sentMessagesPlaintext = {};
    },

    clearChats: state => {
      state.chats = [];
      state.messages = [];
      state.activeChat = null;
      state.sentMessagesPlaintext = {};
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
      .addCase(sendMessage.pending, state => {
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { message, plaintext } = action.payload;
        
        // Add to messages
        const exists = state.messages.some(
          msg => msg._id === message._id
        );
        if (!exists) {
          state.messages.push(message);
        }

        // ✅ Store plaintext for this message
        if (plaintext) {
          state.sentMessagesPlaintext[message._id] = plaintext;
        }

        // Update last message in chats list
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

      // Delete Message
      .addCase(deleteMessage.fulfilled, (state, action) => {
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

        // Clean up plaintext storage
        delete state.sentMessagesPlaintext[messageId];
      });
  },
});

export const {
  setActiveChat,
  addMessage,
  messageDeleted,
  markChatRead,
  clearMessages,
  clearChats,
} = chatSlice.actions;

export default chatSlice.reducer;