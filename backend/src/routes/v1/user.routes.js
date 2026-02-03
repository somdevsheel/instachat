const express = require('express');
const router = express.Router();

const userController = require('../../controllers/user.controller');
const { protect } = require('../../middlewares/auth.middleware');
const upload = require('../../middlewares/upload.middleware');
const passwordRateLimiter = require('../../middlewares/passwordRateLimiter');

/* ==============================
   SEARCH (MUST BE FIRST)
============================== */

router.get('/mutual', protect, userController.getMutualFollowers);
router.get('/search', protect, userController.searchUsers);

/* ==============================
   SUGGESTIONS
============================== */

router.get('/suggestions', protect, userController.getSuggestedUsers);

/* ==============================
   PROFILE
============================== */

router.get('/profile/:username', protect, userController.getUserProfile);

router.put(
  '/update',
  protect,
  upload.single('avatar'),
  userController.updateUserProfile
);

/* ==============================
   🔐 PASSWORD UPDATE (ADD THIS)
============================== */

router.patch(
  '/update-password',
  protect,
  passwordRateLimiter,
  userController.updatePassword
);

/* ==============================
   FOLLOW / UNFOLLOW
============================== */

router.post('/follow/:id', protect, userController.followUser);

/* ==============================
   FOLLOWERS / FOLLOWING (LAST)
============================== */

router.get('/:id/:type', protect, userController.getFollowList);

module.exports = router;
