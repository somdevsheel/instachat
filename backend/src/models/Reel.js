const mongoose = require('mongoose');

const ReelSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  videoUrl: {
    type: String,
    required: [true, 'Video URL is required']
  },
  videoKey: {
    type: String, // S3 Key
    required: true,
    select: false 
  },
  // FIX 1: Make thumbnailUrl optional
  thumbnailUrl: {
    type: String,
    required: false, // Changed from true to false
    default: ""
  },
  caption: {
    type: String,
    maxlength: [200, 'Reel captions should be short (max 200 chars)'],
    trim: true
  },
  // FIX 2: Make duration optional or default to 0
  duration: {
    type: Number, // In seconds
    required: false, // Changed from true to false
    default: 0
  },
  
  // --- Engagement Metrics ---
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  shareCount: {
    type: Number,
    default: 0
  },
  viewsCount: {
    type: Number,
    default: 0,
    index: true 
  },

  musicTrack: {
    type: String,
    default: 'Original Audio'
  }
}, {
  timestamps: true
});

ReelSchema.index({ viewsCount: -1, createdAt: -1 });

module.exports = mongoose.model('Reel', ReelSchema);