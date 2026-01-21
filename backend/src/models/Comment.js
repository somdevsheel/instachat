const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // A comment belongs to EITHER a Post OR a Reel
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  reel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reel'
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  
  // --- Nested Comments (Replies) ---
  // If this field exists, this comment is a reply to another comment
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },

  // --- Engagement ---
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likesCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true // Useful for sorting "Newest First"
});

// --- Validation: Ensure comment targets something ---
// We don't want a "floating" comment that belongs to nothing.
CommentSchema.pre('save', function(next) {
  if (!this.post && !this.reel) {
    return next(new Error('Comment must belong to a Post or a Reel'));
  }
  next();
});

// --- Indexes ---
// 1. Fetch comments for a specific post quickly
CommentSchema.index({ post: 1, createdAt: -1 });

// 2. Fetch comments for a specific reel quickly
CommentSchema.index({ reel: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', CommentSchema);