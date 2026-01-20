// const express = require('express');
// const postController = require('../../controllers/post.controller');
// const reelController = require('../../controllers/reel.controller');
// const { protect } = require('../../middlewares/auth.middleware');
// const upload = require('../../middlewares/upload.middleware');

// const router = express.Router();

// // =========================================================================
// // POST ROUTES (Images)
// // =========================================================================

// // Updated function name: getPosts -> getFeed
// // router.get('/posts', protect, postController.getFeed);
// router.get('/', protect, postController.getFeed);

// // Create a new post
// router.post('/posts', protect, postController.createPost);


// // Updated function name: getPost -> getPostById
// router.get('/posts/:postId', protect, postController.getPostById);

// // post like
// router.put('/posts/:id/like', protect, postController.likePost);

// router.get('/posts/user/:userId', protect, postController.getUserPosts);

// // Get all comments for a post
// router.get('/posts/:postId/comments', protect, postController.getComments);

// // Add a comment to a post
// router.post('/posts/:postId/comments', protect, postController.addComment);

// // =========================================================================
// // REEL ROUTES (Videos)
// // =========================================================================

// router.get('/reels', protect, reelController.getReels);
// router.post('/reels', protect, upload.single('video'), reelController.createReel);
// router.get('/reels/:reelId', protect, reelController.getReel);

// module.exports = router;







const express = require('express');
const postController = require('../../controllers/post.controller');
const { protect } = require('../../middlewares/auth.middleware');

const router = express.Router();

/**
 * ======================================================
 * POST ROUTES
 * ======================================================
 */

// Get feed (all posts)
router.get('/', protect, postController.getFeed);

// Create post
router.post('/posts', protect, postController.createPost);

// Get single post
router.get('/posts/:postId', protect, postController.getPostById);

// Like/unlike post
router.put('/posts/:id/like', protect, postController.likePost);

// Get user posts
router.get('/posts/user/:userId', protect, postController.getUserPosts);

// Get comments
router.get('/posts/:postId/comments', protect, postController.getComments);

// Add comment
router.post('/posts/:postId/comments', protect, postController.addComment);

// Delete post
router.delete('/posts/:postId', protect, postController.deletePost);

module.exports = router;


// const express = require('express');
// const postController = require('../../controllers/post.controller');
// const { protect } = require('../../middlewares/auth.middleware');

// const router = express.Router();

// /**
//  * ======================================================
//  * FEED / POST ROUTES
//  * ======================================================
//  */

// // Get feed (all posts)
// router.get('/', protect, postController.getFeed);

// // Create post
// router.post('/posts', protect, postController.createPost);

// // Get single post
// router.get('/posts/:postId', protect, postController.getPostById);

// // Like / Unlike post
// router.put('/posts/:id/like', protect, postController.likePost);

// // Get user posts
// router.get('/posts/user/:userId', protect, postController.getUserPosts);

// // Get comments for a post
// router.get('/posts/:postId/comments', protect, postController.getComments);

// // Add comment to a post
// router.post('/posts/:postId/comments', protect, postController.addComment);

// // Delete post
// router.delete('/posts/:postId', protect, postController.deletePost);

// module.exports = router;
