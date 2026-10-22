const socketIo = require('socket.io');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Chat = require('../models/chat.model');
const redis = require('../config/redis');
const verifyAuthToken = require('../utils/verifyAuthToken');
const { createAdapter } = require('@socket.io/redis-adapter');

/**
 * With more than one server process (PM2 cluster, several instances),
 * a user's socket can be on any of them. The Redis adapter relays
 * io.to(room).emit(...) across processes so events still arrive.
 *
 *   SOCKET_ADAPTER=redis|memory   (default: redis in production)
 */
const useRedisAdapter =
  (process.env.SOCKET_ADAPTER ||
    (process.env.NODE_ENV === 'production' ? 'redis' : 'memory')) === 'redis';
const { corsOriginValidator } = require('../config/cors');
const logger = require('../utils/logger');

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
      origin: corsOriginValidator,
      methods: ['GET', 'POST'],
    },
  });

  if (useRedisAdapter) {
    const pubClient = redis.duplicate();
    const subClient = redis.duplicate();
    [pubClient, subClient].forEach((c) =>
      c.on('error', (err) => logger.error('🔴 Socket.IO Redis adapter error:', err.message))
    );
    io.adapter(
      createAdapter(pubClient, subClient, {
        // Channel prefix; set per environment if several share one Redis.
        key: process.env.SOCKET_ADAPTER_KEY || 'socket.io',
      })
    );
    logger.info('🔁 Socket.IO using Redis adapter');
  }

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

      socket.user = await verifyAuthToken(token);
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
    logger.debug(`⚡ Socket Connected: ${socket.user.username} (${socket.id})`);

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
      if (!chatId || !mongoose.isValidObjectId(chatId)) return;

      const allowed = await allowSocketEvent(
        userId,
        'join_chat',
        10,
        10
      );

      if (!allowed) return;

      // Only participants may join a chat room — otherwise anyone could
      // listen to typing events for arbitrary chats.
      try {
        const isParticipant = await Chat.exists({
          _id: chatId,
          participants: userId,
        });
        if (!isParticipant) return;
      } catch {
        return;
      }

      socket.join(chatId.toString());
    });

    socket.on('leave_chat', (chatId) => {
      if (!chatId) return;
      socket.leave(chatId.toString());
    });

    /**
     * TYPING
     */
    socket.on('typing', async (chatId) => {
      if (!chatId || !socket.rooms.has(chatId.toString())) return;

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
      if (!chatId || !socket.rooms.has(chatId.toString())) return;
      socket.to(chatId.toString()).emit('stop_typing', { userId });
    });

    // NOTE: messages are delivered server-side by the REST sendMessage
    // controller (which persists + emits `message_received`). There is
    // intentionally no client-driven `new_message` relay: it let any
    // client push forged messages to arbitrary users.

    /**
     * DISCONNECT
     */
    socket.on('disconnect', async () => {
      logger.debug(`🔌 Socket Disconnected: ${socket.user.username}`);

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
