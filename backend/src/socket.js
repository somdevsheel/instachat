const { Server } = require('socket.io');

/**
 * ======================================================
 * SOCKET SERVICE
 * ======================================================
 * - User presence
 * - Messaging
 * - Notifications
 * - Feed realtime updates
 */

const socketService = (server, app) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Make io accessible inside controllers
  if (app) {
    app.set('io', io);
  }

  /**
   * Track online users
   * Map<userId, socketId>
   */
  const onlineUsers = new Map();

  io.on('connection', socket => {
    console.log('⚡ Socket connected:', socket.id);

    /* =========================
       USER PRESENCE
    ========================= */
    socket.on('join', userId => {
      if (!userId) return;

      socket.join(userId);
      onlineUsers.set(userId, socket.id);

      io.emit('userStatus', {
        userId,
        status: 'online',
      });

      console.log(`👤 User online: ${userId}`);
    });

    /* =========================
       PRIVATE MESSAGING
    ========================= */
    socket.on('sendMessage', data => {
      if (!data?.recipientId) return;

      io.to(data.recipientId).emit('newMessage', data);

      io.to(data.recipientId).emit('notification', {
        type: 'NEW_MESSAGE',
        from: data.senderId,
        text: 'Sent you a message',
      });
    });

    /* =========================
       ⚠️ LEGACY CLIENT LIKE EVENT
       (NO LOGIC – BACKWARD SAFE)
    ========================= */
    socket.on('like_post', () => {
      // Do nothing intentionally
      // Likes are emitted ONLY by backend controllers
    });

    /* =========================
       SOCIAL NOTIFICATIONS
    ========================= */
    socket.on('sendNotification', data => {
      if (!data?.recipientId) return;
      io.to(data.recipientId).emit('notification', data);
    });

    /* =========================
       DISCONNECT
    ========================= */
    socket.on('disconnect', () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);

          io.emit('userStatus', {
            userId,
            status: 'offline',
          });

          console.log(`👤 User offline: ${userId}`);
          break;
        }
      }

      console.log('❌ Socket disconnected:', socket.id);
    });
  });

  /* =========================
     SERVER-SIDE EMITTERS
     (USED BY CONTROLLERS)
  ========================= */

  const emitPostLike = ({ postId, userId, liked, likesCount }) => {
    if (!postId) return;

    io.emit('post_like_updated', {
      postId,
      userId,
      liked,
      likesCount,
    });

    console.log('📡 post_like_updated:', {
      postId,
      likesCount,
    });
  };

  const emitNewPost = post => {
    if (!post) return;
    io.emit('new_post', post);
  };

  return {
    io,
    emitPostLike,
    emitNewPost,
  };
};

module.exports = socketService;
