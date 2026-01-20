// const express = require('express');
// const userController = require('../../controllers/user.controller');
// const { protect } = require('../../middlewares/auth.middleware');
// const upload = require('../../middlewares/upload.middleware');
// const authController = require('../../controllers/auth.controller');


// const router = express.Router();

// /* ==============================
//    SEARCH (⚠️ MUST BE FIRST)
// ============================== */

// // GET /api/v1/users/search?q=
// router.get('/mutual', protect, userController.getMutualFollowers);
// router.get('/search', protect, userController.searchUsers);


// /* ==============================
//    SUGGESTIONS
// ============================== */

// // GET /api/v1/users/suggestions
// router.get('/suggestions', protect, userController.getSuggestedUsers);

// /* ==============================
//    PROFILE
// ============================== */

// // GET /api/v1/users/profile/:username
// router.get('/profile/:username', protect, userController.getUserProfile);

// // PUT /api/v1/users/update
// router.put(
//   '/update',
//   protect,
//   upload.single('avatar'),
//   userController.updateUserProfile
// );

// /* ==============================
//    FOLLOW / UNFOLLOW
// ============================== */

// // POST /api/v1/users/follow/:id
// router.post('/follow/:id', protect, userController.followUser);

// /* ==============================
//    FOLLOWERS / FOLLOWING (LAST)
// ============================== */

// // GET /api/v1/users/:id/followers
// // GET /api/v1/users/:id/following
// router.get('/:id/:type', protect, userController.getFollowList);



// router.post('/login', authController.login);
// router.get('/me', protect, authController.getMe);





// module.exports = router;



const express = require('express');
const router = express.Router();

const userController = require('../../controllers/user.controller');
const { protect } = require('../../middlewares/auth.middleware');
const upload = require('../../middlewares/upload.middleware');

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
   FOLLOW / UNFOLLOW
============================== */

router.post('/follow/:id', protect, userController.followUser);

/* ==============================
   FOLLOWERS / FOLLOWING (LAST)
============================== */

router.get('/:id/:type', protect, userController.getFollowList);

module.exports = router;
