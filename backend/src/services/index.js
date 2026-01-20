// const authService = require('./auth.service');
// const userService = require('./user.service');
// const feedService = require('./feed.service');
// const socketService = require('./socket.service');
// const postService = require('./post.service');
// const reelService = require('./reel.service');
// const chatService = require('./chat.service');
// const notificationService = require('./notification.service'); // <--- ADD THIS

// module.exports = {
//   authService,
//   userService,
//   feedService,
//   socketService,
//   postService,
//   reelService,
//   chatService,
//   notificationService, // <--- ADD THIS
// };


// const express = require('express');
// const authRoutes = require('./v1/auth.routes');
// const chatRoutes = require('./v1/chat.routes');
// const userRoutes = require('./v1/user.routes');
// const keyRoutes = require('./v1/key.routes');
// const feedRoutes = require('./v1/feed.routes');
// const mediaRoutes = require('./v1/media.routes');

// const router = express.Router();

// router.use('/auth', authRoutes);
// router.use('/chats', chatRoutes);
// router.use('/users', userRoutes);
// router.use('/keys', keyRoutes);
// router.use('/feed', feedRoutes);
// router.use('/media', mediaRoutes);

// module.exports = router;





/**
 * ======================================================
 * SERVICES BARREL EXPORT
 * ======================================================
 * Centralized export for all services
 */

const authService = require('./auth.service');
const chatService = require('./chat.service');
const userService = require('./user.service');
const notificationService = require('./notification.service');
const postService = require('./post.service');
const mediaService = require('./media.service');

module.exports = {
  authService,
  chatService,
  userService,
  notificationService,
  postService,
  mediaService,
};