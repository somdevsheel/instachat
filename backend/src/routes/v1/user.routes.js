// const express = require('express');
// const router = express.Router();

// const userController = require('../../controllers/user.controller');
// const { protect } = require('../../middlewares/auth.middleware');
// const upload = require('../../middlewares/upload.middleware');
// const passwordRateLimiter = require('../../middlewares/passwordRateLimiter');

// /* ==============================
//    SEARCH (MUST BE FIRST)
// ============================== */

// router.get('/mutual', protect, userController.getMutualFollowers);
// router.get('/search', protect, userController.searchUsers);

// /* ==============================
//    SUGGESTIONS
// ============================== */

// router.get('/suggestions', protect, userController.getSuggestedUsers);

// /* ==============================
//    PROFILE
// ============================== */

// router.get('/profile/:username', protect, userController.getUserProfile);

// router.put(
//   '/update',
//   protect,
//   upload.single('avatar'),
//   userController.updateUserProfile
// );

// /* ==============================
//    🔐 PASSWORD UPDATE (ADD THIS)
// ============================== */

// router.patch(
//   '/update-password',
//   protect,
//   passwordRateLimiter,
//   userController.updatePassword
// );

// /* ==============================
//    FOLLOW / UNFOLLOW
// ============================== */

// router.post('/follow/:id', protect, userController.followUser);

// /* ==============================
//    FOLLOWERS / FOLLOWING (LAST)
// ============================== */

// router.get('/:id/:type', protect, userController.getFollowList);

// module.exports = router;






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
   🔐 PASSWORD UPDATE
============================== */

router.patch(
  '/update-password',
  protect,
  passwordRateLimiter,
  userController.updatePassword
);

/* ==============================
   📋 ACCOUNT SETTINGS (NEW)
============================== */

router.get('/account-info', protect, userController.getAccountInfo);
router.patch('/account-info', protect, userController.updateAccountInfo);
router.delete('/delete-account', protect, userController.deleteAccount);

/* ==============================
   🔒 PRIVACY SETTINGS (NEW)
============================== */

router.get('/privacy', protect, userController.getPrivacySettings);
router.patch('/privacy', protect, userController.updatePrivacySettings);

// Block / Unblock
router.post('/block/:id', protect, userController.blockUser);
router.get('/blocked', protect, userController.getBlockedUsers);

// Mute / Unmute
router.post('/mute/:id', protect, userController.muteUser);
router.get('/muted', protect, userController.getMutedUsers);

/* ==============================
   🛡️ SECURITY SETTINGS (NEW)
============================== */

router.get('/login-activity', protect, userController.getLoginActivity);
router.patch('/two-factor', protect, userController.toggleTwoFactor);

/* ==============================
   FOLLOW / UNFOLLOW
============================== */

router.post('/follow/:id', protect, userController.followUser);

/* ==============================
   FOLLOWERS / FOLLOWING (LAST)
============================== */

router.get('/:id/:type', protect, userController.getFollowList);

module.exports = router;