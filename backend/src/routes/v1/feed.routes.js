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

// Trending hashtags
router.get('/trending', protect, postController.getTrending);

// Saved posts
router.get('/saved', protect, postController.getSavedPosts);
router.put('/posts/:postId/save', protect, postController.toggleSavePost);

// Share count
router.put('/posts/:postId/share', protect, postController.sharePost);

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

// Add comment (or reply, via { replyTo } in the body)
router.post('/posts/:postId/comments', protect, postController.addComment);

// Repost a post
router.post('/posts/:postId/repost', protect, postController.repostPost);

// Replies to a specific comment
router.get('/comments/:commentId/replies', protect, postController.getCommentReplies);

// Like/unlike a comment
router.put('/comments/:commentId/like', protect, postController.toggleCommentLike);

// Delete post
router.delete('/posts/:postId', protect, postController.deletePost);

module.exports = router;
