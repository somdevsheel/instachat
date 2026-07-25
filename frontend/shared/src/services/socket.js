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

let SOCKET_URL = 'http://localhost:5000';

// Same pattern as configureApiBaseUrl — each consuming app sets its own
// backend URL at startup instead of this package hardcoding one.
export const configureSocketUrl = (url) => {
  SOCKET_URL = url;
};

let socket = null;
// initSocket() is async (it awaits the stored token), so a caller that
// invokes it while a previous call is still in flight would otherwise
// race and spin up a second socket.io connection. Caching the in-flight
// promise makes concurrent callers (e.g. SocketInitializer on boot and a
// chat screen mounting moments later) all resolve to the same socket.
let connecting = null;

export const initSocket = () => {
  if (socket) return Promise.resolve(socket);
  if (connecting) return connecting;

  connecting = (async () => {
    const token = await Storage.getToken();
    if (!token) {
      console.warn('⚠️ Socket not initialized: No token');
      connecting = null;
      return null;
    }

    const s = SocketIO.io(SOCKET_URL, {
      auth: { token },
      transports: ['polling', 'websocket'],
      upgrade: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    s.on('connect', () => {
      console.log('✅ Socket Connected:', s.id);
      s.emit('connected');

      const state = store.getState();
      const userId = state.auth.user?._id;
      if (userId) {
        s.emit('user:online', userId);
        console.log('👤 User registered for notifications:', userId);
      }
    });

    s.on('disconnect', (reason) => {
      console.log('❌ Socket Disconnected:', reason);
    });

    s.on('connect_error', (err) => {
      console.error('❌ Socket Connection Error:', err.message);
    });

    s.on('message_received', (message) => {
      console.log('📩 Message received:', message);
      // The unread count will be updated via unread_count_updated event
    });

    s.on('typing', (username) => {
      console.log(`✏️ ${username} is typing...`);
    });

    s.on('stop_typing', () => {
      console.log('✋ Typing stopped');
    });

    s.on('notification:new', (notification) => {
      console.log('🔔 New notification received:', notification);

      // Toast/UI feedback is intentionally not handled here — this package
      // is shared across platforms with different toast implementations.
      // Consuming apps should render a toast by observing the notifications
      // slice (e.g. a top-level listener component watching for new items).
      store.dispatch(addNotification(notification));
    });

    // ✅ NEW: Listen for unread count updates
    s.on('unread_count_updated', (data) => {
      console.log('📬 Unread count updated:', data.count);
      store.dispatch(setUnreadCount(data.count));
    });

    socket = s;
    connecting = null;
    return s;
  })();

  return connecting;
};

// These fire-and-forget helpers used to read the module-level `socket`
// variable directly, which is `null` until initSocket()'s async token
// lookup resolves. A caller invoked in that window (e.g. a chat screen
// mounting right after login) would silently no-op forever, since
// nothing re-checks `socket` once it becomes available. Routing them
// through initSocket() means they always wait for the real connection.
export const joinChatRoom = async (chatId) => {
  if (!chatId) return;
  const s = await initSocket();
  s?.emit('join_chat', chatId);
};

export const leaveChatRoom = async (chatId) => {
  if (!chatId) return;
  const s = await initSocket();
  s?.emit('leave_chat', chatId);
};

export const emitNewMessage = async (message) => {
  if (!message) return;
  const s = await initSocket();
  s?.emit('new_message', message);
};

export const emitTyping = async (chatId) => {
  if (!chatId) return;
  const s = await initSocket();
  s?.emit('typing', chatId);
};

export const emitStopTyping = async (chatId) => {
  if (!chatId) return;
  const s = await initSocket();
  s?.emit('stop_typing', chatId);
};

// Synchronous accessor — returns null until initSocket() has resolved at
// least once. Safe to use for call sites that only run well after boot
// (e.g. in response to a user action), but new code that needs the
// socket at mount time should prefer `await initSocket()`.
export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  connecting = null;
  console.log('🔌 Socket fully disconnected');
};