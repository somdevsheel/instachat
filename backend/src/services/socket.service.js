const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const redis = require('../config/redis');

let io;

/**
 * ======================================================
 * SOCKET RATE LIMITER (REDIS)
 * ======================================================
 */
const allowSocketEvent = async (userId, event, limit, windowSeconds) => {
  try {
    const key = `socket:${event}:${userId}`;
    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }

    return count <= limit;
  } catch {
    // Fail-open: never block sockets
    return true;
  }
};

/**
 * ======================================================
 * INITIALIZE SOCKET.IO SERVER
 * ======================================================
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
   * =========================
   * AUTH MIDDLEWARE (JWT)
   * =========================
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
    } catch {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  /**
   * =========================
   * CONNECTION
   * =========================
   */
  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`⚡ Socket Connected: ${socket.user.username} (${socket.id})`);

    // Personal room
    socket.join(userId);
    socket.emit('connected');

    /**
     * USER ONLINE (REDIS)
     */
    const setOnline = async () => {
      try {
        await redis.set(
          `user:${userId}:online`,
          socket.id,
          'EX',
          30
        );
      } catch {}
    };

    await setOnline();

    socket.presenceInterval = setInterval(setOnline, 15000);

    /**
     * JOIN CHAT
     */
    socket.on('join_chat', async (chatId) => {
      if (!chatId) return;

      const allowed = await allowSocketEvent(
        userId,
        'join_chat',
        10,
        10
      );

      if (!allowed) return;
      socket.join(chatId);
    });

    /**
     * TYPING
     */
    socket.on('typing', async (chatId) => {
      if (!chatId) return;

      const allowed = await allowSocketEvent(
        userId,
        'typing',
        5,
        5
      );

      if (!allowed) return;

      socket.to(chatId).emit('typing', {
        userId,
        username: socket.user.username,
      });
    });

    socket.on('stop_typing', (chatId) => {
      if (!chatId) return;
      socket.to(chatId).emit('stop_typing', { userId });
    });

    /**
     * NEW MESSAGE
     */
    socket.on('new_message', async (message) => {
      if (
        !message ||
        !message.chat ||
        !message.chat.users ||
        typeof message.text !== 'string'
      ) {
        return;
      }

      const allowed = await allowSocketEvent(
        userId,
        'new_message',
        20,
        10
      );

      if (!allowed) return;

      message.chat.users.forEach((chatUser) => {
        const chatUserId = chatUser._id.toString();
        if (chatUserId === userId) return;

        io.to(chatUserId).emit('message_received', {
          _id: message._id,
          chat: message.chat._id || message.chat,
          sender: message.sender,
          text: message.text,
          createdAt: message.createdAt,
          encryptionMode: 'plain',
        });
      });
    });

    /**
     * DISCONNECT
     */
    socket.on('disconnect', async () => {
      console.log(`🔌 Socket Disconnected: ${socket.user.username}`);

      if (socket.presenceInterval) {
        clearInterval(socket.presenceInterval);
      }

      try {
        await redis.del(`user:${userId}:online`);
      } catch {}

      try {
        await User.findByIdAndUpdate(userId, {
          lastSeen: new Date(),
        });
      } catch {}

      socket.leave(userId);
    });
  });
};

/**
 * ======================================================
 * GET SOCKET.IO INSTANCE
 * ======================================================
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

/**
 * ======================================================
 * 🔥 GET SOCKET ID BY USER ID (REDIS)
 * ======================================================
 */
const getSocketIdByUserId = async (userId) => {
  if (!userId) return null;

  try {
    return await redis.get(`user:${userId}:online`);
  } catch {
    return null;
  }
};

module.exports = {
  initSocket,
  getIO,
  getSocketIdByUserId, // ✅ REQUIRED EXPORT
};
