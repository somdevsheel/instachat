import * as SocketIO from 'socket.io-client';
import Storage from '../utils/storage';
import store from '../redux/store';
import {
  addNotification
} from '../redux/slices/notificationSlice';
import {
  setUnreadCount,
  incrementUnreadCount,
} from '../redux/slices/chatSlice';
import Toast from 'react-native-toast-message';

const SOCKET_URL = "https://api.grownoww.com";
// const SOCKET_URL = 'http://192.168.1.3:5000';

let socket = null;

export const initSocket = async () => {
  if (socket) return socket;

  const token = await Storage.getToken();
  if (!token) {
    console.warn('⚠️ Socket not initialized: No token');
    return null;
  }

  socket = SocketIO.io(SOCKET_URL, {
    auth: { token },
    transports: ['polling', 'websocket'],
    upgrade: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log('✅ Socket Connected:', socket.id);
    socket.emit('connected');
    
    const state = store.getState();
    const userId = state.auth.user?._id;
    if (userId) {
      socket.emit('user:online', userId);
      console.log('👤 User registered for notifications:', userId);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('❌ Socket Connection Error:', err.message);
  });

  socket.on('message_received', (message) => {
    console.log('📩 Message received:', message);
    // The unread count will be updated via unread_count_updated event
  });

  socket.on('typing', (username) => {
    console.log(`✏️ ${username} is typing...`);
  });

  socket.on('stop_typing', () => {
    console.log('✋ Typing stopped');
  });

  socket.on('notification:new', (notification) => {
    console.log('🔔 New notification received:', notification);
    
    store.dispatch(addNotification(notification));

    Toast.show({
      type: 'info',
      text1: notification.sender?.username || 'New Notification',
      text2: notification.message,
      position: 'top',
      visibilityTime: 3000,
      topOffset: 50,
      onPress: () => {
        Toast.hide();
      },
    });
  });

  // ✅ NEW: Listen for unread count updates
  socket.on('unread_count_updated', (data) => {
    console.log('📬 Unread count updated:', data.count);
    store.dispatch(setUnreadCount(data.count));
  });

  return socket;
};

export const joinChatRoom = (chatId) => {
  if (!socket || !chatId) return;
  socket.emit('join_chat', chatId);
};

export const leaveChatRoom = (chatId) => {
  if (!socket || !chatId) return;
  socket.emit('leave_chat', chatId);
};

export const emitNewMessage = (message) => {
  if (!socket || !message) return;
  socket.emit('new_message', message);
};

export const emitTyping = (chatId) => {
  if (!socket || !chatId) return;
  socket.emit('typing', chatId);
};

export const emitStopTyping = (chatId) => {
  if (!socket || !chatId) return;
  socket.emit('stop_typing', chatId);
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('🔌 Socket fully disconnected');
  }
};