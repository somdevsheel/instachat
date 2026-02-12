// const { Server } = require('socket.io');
// const User = require('./models/user.model');
// const redis = require('./config/redis');

// /**
//  * ======================================================
//  * SOCKET SERVICE
//  * ======================================================
//  * - User presence (Redis)
//  * - Messaging
//  * - Notifications
//  * - Feed realtime updates
//  * - Socket rate limiting (Redis)
//  */

// const socketService = (server, app) => {
//   const io = new Server(server, {
//     cors: {
//       origin: '*',
//       methods: ['GET', 'POST'],
//     },
//   });

//   // Make io accessible inside controllers
//   if (app) {
//     app.set('io', io);
//   }

//   /**
//    * =========================
//    * SOCKET RATE LIMITER
//    * =========================
//    */
//   const allowSocketEvent = async (userId, event, limit, windowSeconds) => {
//     try {
//       const key = `socket:${event}:${userId}`;
//       const count = await redis.incr(key);

//       if (count === 1) {
//         await redis.expire(key, windowSeconds);
//       }

//       return count <= limit;
//     } catch (err) {
//       // Fail-open: never block socket if Redis fails
//       return true;
//     }
//   };

//   io.on('connection', (socket) => {
//     console.log('⚡ Socket connected:', socket.id);

//     /**
//      * =========================
//      * USER PRESENCE (REDIS)
//      * =========================
//      */
//     socket.on('join', async (userId) => {
//       if (!userId) return;

//       socket.userId = userId;
//       socket.join(userId);

//       try {
//         await redis.set(
//           `user:${userId}:online`,
//           socket.id,
//           'EX',
//           30 // TTL seconds
//         );
//       } catch (err) {
//         // silent fail
//       }

//       io.emit('userStatus', {
//         userId,
//         status: 'online',
//       });

//       console.log(`👤 User online: ${userId}`);

//       // Heartbeat to refresh TTL
//       socket.presenceInterval = setInterval(async () => {
//         try {
//           await redis.set(
//             `user:${userId}:online`,
//             socket.id,
//             'EX',
//             30
//           );
//         } catch (err) {
//           // silent
//         }
//       }, 15000);
//     });

//     /**
//      * =========================
//      * PRIVATE MESSAGING
//      * =========================
//      */
//     socket.on('sendMessage', async (data) => {
//       if (!data?.recipientId || !socket.userId) return;

//       const allowed = await allowSocketEvent(
//         socket.userId,
//         'sendMessage',
//         20,
//         10
//       );

//       if (!allowed) return;

//       io.to(data.recipientId).emit('newMessage', data);

//       io.to(data.recipientId).emit('notification', {
//         type: 'NEW_MESSAGE',
//         from: data.senderId,
//         text: 'Sent you a message',
//       });
//     });

//     /**
//      * =========================
//      * SOCIAL NOTIFICATIONS
//      * =========================
//      */
//     socket.on('sendNotification', async (data) => {
//       if (!data?.recipientId || !socket.userId) return;

//       const allowed = await allowSocketEvent(
//         socket.userId,
//         'sendNotification',
//         10,
//         10
//       );

//       if (!allowed) return;

//       io.to(data.recipientId).emit('notification', data);
//     });

//     /**
//      * =========================
//      * DISCONNECT
//      * =========================
//      */
//     socket.on('disconnect', async () => {
//       if (socket.presenceInterval) {
//         clearInterval(socket.presenceInterval);
//       }

//       if (socket.userId) {
//         try {
//           await redis.del(`user:${socket.userId}:online`);
//         } catch (err) {
//           // silent
//         }

//         try {
//           await User.findByIdAndUpdate(socket.userId, {
//             lastSeen: new Date(),
//           });
//         } catch (err) {
//           // silent
//         }

//         io.emit('userStatus', {
//           userId: socket.userId,
//           status: 'offline',
//         });

//         console.log(`👤 User offline: ${socket.userId}`);
//       }

//       console.log('❌ Socket disconnected:', socket.id);
//     });
//   });

//   /**
//    * =========================
//    * SERVER-SIDE EMITTERS
//    * =========================
//    */

//   const emitPostLike = ({ postId, userId, liked, likesCount }) => {
//     if (!postId) return;

//     io.emit('post_like_updated', {
//       postId,
//       userId,
//       liked,
//       likesCount,
//     });
//   };

//   const emitNewPost = (post) => {
//     if (!post) return;
//     io.emit('new_post', post);
//   };

//   return {
//     io,
//     emitPostLike,
//     emitNewPost,
//   };
// };

// module.exports = socketService;



const { Server } = require('socket.io');
const User = require('./models/user.model');
const redis = require('./config/redis');

/**
 * ======================================================
 * SOCKET SERVICE
 * ======================================================
 * - User presence (Redis)
 * - Messaging
 * - Notifications
 * - Feed realtime updates
 * - Reels realtime updates ✅ NEW
 * - Socket rate limiting (Redis)
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
   * =========================
   * SOCKET RATE LIMITER
   * =========================
   */
  const allowSocketEvent = async (userId, event, limit, windowSeconds) => {
    try {
      const key = `socket:${event}:${userId}`;
      const count = await redis.incr(key);

      if (count === 1) {
        await redis.expire(key, windowSeconds);
      }

      return count <= limit;
    } catch (err) {
      // Fail-open: never block socket if Redis fails
      return true;
    }
  };

  io.on('connection', (socket) => {
    console.log('⚡ Socket connected:', socket.id);

    /**
     * =========================
     * USER PRESENCE (REDIS)
     * =========================
     */
    socket.on('join', async (userId) => {
      if (!userId) return;

      socket.userId = userId;
      socket.join(userId);

      try {
        await redis.set(
          `user:${userId}:online`,
          socket.id,
          'EX',
          30 // TTL seconds
        );
      } catch (err) {
        // silent fail
      }

      io.emit('userStatus', {
        userId,
        status: 'online',
      });

      console.log(`👤 User online: ${userId}`);

      // Heartbeat to refresh TTL
      socket.presenceInterval = setInterval(async () => {
        try {
          await redis.set(
            `user:${userId}:online`,
            socket.id,
            'EX',
            30
          );
        } catch (err) {
          // silent
        }
      }, 15000);
    });

    /**
     * =========================
     * PRIVATE MESSAGING
     * =========================
     */
    socket.on('sendMessage', async (data) => {
      if (!data?.recipientId || !socket.userId) return;

      const allowed = await allowSocketEvent(
        socket.userId,
        'sendMessage',
        20,
        10
      );

      if (!allowed) return;

      io.to(data.recipientId).emit('newMessage', data);

      io.to(data.recipientId).emit('notification', {
        type: 'NEW_MESSAGE',
        from: data.senderId,
        text: 'Sent you a message',
      });
    });

    /**
     * =========================
     * SOCIAL NOTIFICATIONS
     * =========================
     */
    socket.on('sendNotification', async (data) => {
      if (!data?.recipientId || !socket.userId) return;

      const allowed = await allowSocketEvent(
        socket.userId,
        'sendNotification',
        10,
        10
      );

      if (!allowed) return;

      io.to(data.recipientId).emit('notification', data);
    });

    /**
     * =========================
     * DISCONNECT
     * =========================
     */
    socket.on('disconnect', async () => {
      if (socket.presenceInterval) {
        clearInterval(socket.presenceInterval);
      }

      if (socket.userId) {
        try {
          await redis.del(`user:${socket.userId}:online`);
        } catch (err) {
          // silent
        }

        try {
          await User.findByIdAndUpdate(socket.userId, {
            lastSeen: new Date(),
          });
        } catch (err) {
          // silent
        }

        io.emit('userStatus', {
          userId: socket.userId,
          status: 'offline',
        });

        console.log(`👤 User offline: ${socket.userId}`);
      }

      console.log('❌ Socket disconnected:', socket.id);
    });
  });

  /**
   * =========================
   * SERVER-SIDE EMITTERS
   * =========================
   */

  /* -------- POSTS -------- */
  const emitPostLike = ({ postId, userId, liked, likesCount }) => {
    if (!postId) return;

    io.emit('post_like_updated', {
      postId,
      userId,
      liked,
      likesCount,
    });
  };

  const emitNewPost = (post) => {
    if (!post) return;
    io.emit('new_post', post);
  };

  /* -------- REELS ✅ NEW -------- */
  const emitReelLike = ({ reelId, userId, liked, likesCount }) => {
    if (!reelId) return;

    io.emit('reel_like_updated', {
      reelId,
      userId,
      liked,
      likesCount,
    });
  };

  const emitNewReel = (reel) => {
    if (!reel) return;
    io.emit('new_reel', reel);
  };

  const emitReelDeleted = (reelId) => {
    if (!reelId) return;
    io.emit('reel_deleted', { reelId });
  };

  return {
    io,
    // Posts
    emitPostLike,
    emitNewPost,
    // Reels ✅ NEW
    emitReelLike,
    emitNewReel,
    emitReelDeleted,
  };
};

module.exports = socketService;