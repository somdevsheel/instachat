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