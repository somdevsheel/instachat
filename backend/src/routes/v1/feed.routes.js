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
// router.put('/posts/:id/like', protect, postController.likePost);
router.put('/posts/:postId/like', protect, postController.likePost);

// Get user posts
router.get('/posts/user/:userId', protect, postController.getUserPosts);

// Get comments
router.get('/posts/:postId/comments', protect, postController.getComments);

// Add comment
router.post('/posts/:postId/comments', protect, postController.addComment);

// Delete post
router.delete('/posts/:postId', protect, postController.deletePost);

module.exports = router;
