// const express = require('express');
// const reelController = require('../../controllers/reel.controller');
// const { protect } = require('../../middlewares/auth.middleware');
// const upload = require('../../middlewares/upload.middleware');

// const router = express.Router();

// // GET /api/v1/reels/feed
// router.get('/feed', protect, reelController.getReels);

// // POST /api/v1/reels (create reel)
// // FIELD NAME: video
// router.post(
//   '/',
//   protect,
//   upload.single('video'),
//   reelController.createReel
// );

// // GET /api/v1/reels/:reelId
// router.get('/:reelId', protect, reelController.getReel);

// module.exports = router;





// const express = require('express');
// const reelController = require('../../controllers/reel.controller');
// const { protect } = require('../../middlewares/auth.middleware');

// const router = express.Router();

// console.log('🎬 Reel routes loading...');

// /**
//  * ======================================================
//  * REEL ROUTES
//  * ======================================================
//  * Base: /api/v1/reels
//  */

// /* =========================
//    PRESIGNED UPLOAD
// ========================= */
// router.post('/presign', protect, reelController.getPresignedUrl);

// /* =========================
//    FEED & DISCOVERY
// ========================= */
// router.get('/feed', protect, reelController.getReels);

// /* =========================
//    USER REELS
// ========================= */
// router.get('/user/:userId', protect, reelController.getUserReels);

// /* =========================
//    CRUD
// ========================= */
// router.post('/', protect, reelController.createReel);
// router.get('/:reelId', protect, reelController.getReel);
// router.delete('/:reelId', protect, reelController.deleteReel);

// /* =========================
//    ENGAGEMENT
// ========================= */
// router.put('/:reelId/like', protect, reelController.toggleLike);
// router.put('/:reelId/view', protect, reelController.incrementView);

// console.log('✅ Reel routes loaded');

// module.exports = router;




// const express = require('express');
// const reelController = require('../../controllers/reel.controller');
// const { protect } = require('../../middlewares/auth.middleware');

// const router = express.Router();

// console.log('🎬 Reel routes loading...');

// /**
//  * ======================================================
//  * REEL ROUTES
//  * ======================================================
//  * Base: /api/v1/reels
//  */

// /* =========================
//    PRESIGNED UPLOAD
// ========================= */
// router.post('/presign', protect, reelController.getPresignedUrl);

// /* =========================
//    FEED & DISCOVERY
// ========================= */
// router.get('/feed', protect, reelController.getReels);

// /* =========================
//    USER REELS
// ========================= */
// router.get('/user/:userId', protect, reelController.getUserReels);

// /* =========================
//    CRUD
// ========================= */
// router.post('/', protect, reelController.createReel);
// router.get('/:reelId', protect, reelController.getReel);
// router.delete('/:reelId', protect, reelController.deleteReel);

// /* =========================
//    ENGAGEMENT
// ========================= */
// router.put('/:reelId/like', protect, reelController.toggleLike);
// router.put('/:reelId/view', protect, reelController.incrementView);

// /* =========================
//    COMMENTS
// ========================= */
// router.post('/:reelId/comments', protect, reelController.addComment);
// router.get('/:reelId/comments', protect, reelController.getComments);

// console.log('✅ Reel routes loaded');

// module.exports = router;






const express = require('express');
const reelController = require('../../controllers/reel.controller');
const { protect } = require('../../middlewares/auth.middleware');

const router = express.Router();

console.log('🎬 Reel routes loading...');

/**
 * ======================================================
 * REEL ROUTES
 * ======================================================
 * Base: /api/v1/reels
 */

/* =========================
   PRESIGNED UPLOAD
========================= */
router.post('/presign', protect, reelController.getPresignedUrl);

/* =========================
   FEED & DISCOVERY
========================= */
router.get('/feed', protect, reelController.getReels);

/* =========================
   USER REELS
========================= */
router.get('/user/:userId', protect, reelController.getUserReels);

/* =========================
   CRUD
========================= */
router.post('/', protect, reelController.createReel);
router.get('/:reelId', protect, reelController.getReel);
router.delete('/:reelId', protect, reelController.deleteReel);

/* =========================
   ENGAGEMENT
========================= */
router.put('/:reelId/like', protect, reelController.toggleLike);
router.put('/:reelId/view', protect, reelController.incrementView);

/* =========================
   COMMENTS
========================= */
router.post('/:reelId/comments', protect, reelController.addComment);
router.get('/:reelId/comments', protect, reelController.getComments);

console.log('✅ Reel routes loaded');

module.exports = router;