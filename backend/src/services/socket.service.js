const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

let io;

// Store online users (userId -> socketId)
const onlineUsers = new Map();

/**
 * Initialize Socket.io Server
 */
const initSocket = (server) => {
  io = socketIo(server, {
    pingTimeout: 60000,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  /**
   * AUTH MIDDLEWARE (JWT)
   */
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        socket.handshake.headers?.authorization;

      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  /**
   * CONNECTION
   */
  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();

    console.log(`⚡ Socket Connected: ${socket.user.username} (${socket.id})`);

    // Track online user
    onlineUsers.set(userId, socket.id);

    // Personal room (notifications, direct emits)
    socket.join(userId);

    socket.emit('connected');

    /**
     * JOIN CHAT ROOM
     * roomId = chatId
     */
    socket.on('join_chat', (chatId) => {
      if (!chatId) return;
      socket.join(chatId);
      console.log(`👥 ${socket.user.username} joined chat ${chatId}`);
    });

    /**
     * TYPING INDICATOR
     */
    socket.on('typing', (chatId) => {
      socket.to(chatId).emit('typing', {
        userId,
        username: socket.user.username,
      });
    });

    socket.on('stop_typing', (chatId) => {
      socket.to(chatId).emit('stop_typing', { userId });
    });

    /**
     * NEW MESSAGE
     * Message already saved via REST API
     */
    socket.on('new_message', (message) => {
      if (!message || !message.chat || !message.chat.users) return;

      message.chat.users.forEach((chatUser) => {
        const chatUserId = chatUser._id.toString();

        // Do not send to sender
        if (chatUserId === userId) return;

        // Emit to user's personal room
        io.to(chatUserId).emit('message_received', message);
      });
    });

    /**
     * DISCONNECT
     */
    socket.on('disconnect', () => {
      console.log(`🔌 Socket Disconnected: ${socket.user.username}`);
      onlineUsers.delete(userId);
      socket.leave(userId);
    });
  });
};

/**
 * Get Socket.IO instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

/**
 * Get online users (optional helper)
 */
const isUserOnline = (userId) => {
  return onlineUsers.has(userId.toString());
};

module.exports = {
  initSocket,
  getIO,
  isUserOnline,
};
