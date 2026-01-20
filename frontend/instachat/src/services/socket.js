import { io } from 'socket.io-client';
import Storage from '../utils/storage';

const SOCKET_URL = 'http://192.168.1.3:5000';

let socket = null;

/* ============================
   Initialize Socket
============================ */
export const initSocket = async () => {
  // Prevent duplicate connections
  if (socket) return socket;

  const token = await Storage.getToken();
  if (!token) {
    console.warn('⚠️ Socket not initialized: No token');
    return null;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token, // backend supports token via auth
    },
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  /* ============================
     Core Connection Events
  ============================ */
  socket.on('connect', () => {
    console.log('✅ Socket Connected:', socket.id);
    socket.emit('connected');
  });

  socket.on('disconnect', reason => {
    console.log('❌ Socket Disconnected:', reason);
  });

  socket.on('connect_error', err => {
    console.error('❌ Socket Connection Error:', err.message);
  });

  /* ============================
     Chat Events (Global)
  ============================ */

  // Incoming message (for inbox + open chat)
  socket.on('message_received', message => {
    console.log('📩 Message received:', message);
  });

  // Typing indicators
  socket.on('typing', username => {
    console.log(`✍️ ${username} is typing...`);
  });

  socket.on('stop_typing', () => {
    console.log('✋ Typing stopped');
  });

  return socket;
};

/* ============================
   Join Chat Room
   (Call when opening chat screen)
============================ */
export const joinChatRoom = chatId => {
  if (!socket || !chatId) return;
  socket.emit('join_chat', chatId);
};

/* ============================
   Leave Chat Room (optional)
============================ */
export const leaveChatRoom = chatId => {
  if (!socket || !chatId) return;
  socket.emit('leave_chat', chatId);
};

/* ============================
   Send New Message (Socket)
   NOTE: DB save still happens via REST
============================ */
export const emitNewMessage = message => {
  if (!socket || !message) return;
  socket.emit('new_message', message);
};

/* ============================
   Typing Indicators
============================ */
export const emitTyping = chatId => {
  if (!socket || !chatId) return;
  socket.emit('typing', chatId);
};

export const emitStopTyping = chatId => {
  if (!socket || !chatId) return;
  socket.emit('stop_typing', chatId);
};

/* ============================
   Get Socket Instance
============================ */
export const getSocket = () => socket;

/* ============================
   Disconnect Socket (Logout)
============================ */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('🔌 Socket fully disconnected');
  }
};
