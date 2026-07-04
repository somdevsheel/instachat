// const mongoose = require('mongoose');

// /**
//  * ======================================================
//  * REPORT MODEL
//  * ======================================================
//  * - Users report posts, reels, stories, comments, or accounts
//  * - Admin reviews and takes action
//  */

// const ReportSchema = new mongoose.Schema(
//   {
//     /* =========================
//        WHO REPORTED
//     ========================= */
//     reporter: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//       index: true,
//     },

//     /* =========================
//        WHAT WAS REPORTED
//     ========================= */
//     targetType: {
//       type: String,
//       enum: ['post', 'reel', 'story', 'comment', 'user'],
//       required: true,
//     },

//     // Reference to the reported content
//     targetPost: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Post',
//     },
//     targetReel: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Reel',
//     },
//     targetStory: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Story',
//     },
//     targetComment: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Comment',
//     },
//     targetUser: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//     },

//     /* =========================
//        REPORT DETAILS
//     ========================= */
//     reason: {
//       type: String,
//       enum: [
//         'spam',
//         'harassment',
//         'hate_speech',
//         'violence',
//         'nudity',
//         'false_information',
//         'scam',
//         'intellectual_property',
//         'self_harm',
//         'other',
//       ],
//       required: true,
//     },

//     description: {
//       type: String,
//       trim: true,
//       maxlength: 1000,
//       default: '',
//     },

//     /* =========================
//        ADMIN ACTION
//     ========================= */
//     status: {
//       type: String,
//       enum: ['pending', 'reviewing', 'resolved', 'dismissed'],
//       default: 'pending',
//       index: true,
//     },

//     reviewedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//     },

//     reviewedAt: {
//       type: Date,
//     },

//     actionTaken: {
//       type: String,
//       enum: [
//         'none',
//         'content_removed',
//         'user_warned',
//         'user_suspended',
//         'user_banned',
//         'dismissed',
//       ],
//       default: 'none',
//     },

//     adminNotes: {
//       type: String,
//       trim: true,
//       maxlength: 2000,
//       default: '',
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// /* =========================
//    INDEXES
// ========================= */
// ReportSchema.index({ status: 1, createdAt: -1 });
// ReportSchema.index({ targetType: 1, status: 1 });
// ReportSchema.index({ reporter: 1, createdAt: -1 });

// module.exports = mongoose.model('Report', ReportSchema);






const mongoose = require('mongoose');

/**
 * ======================================================
 * REPORT MODEL
 * ======================================================
 * - Users report posts, reels, stories, comments, or accounts
 * - Admin reviews and takes action
 */

const ReportSchema = new mongoose.Schema(
  {
    /* =========================
       WHO REPORTED
    ========================= */
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    /* =========================
       WHAT WAS REPORTED
    ========================= */
    targetType: {
      type: String,
      enum: ['post', 'reel', 'story', 'comment', 'user'],
      required: true,
    },

    // Reference to the reported content
    targetPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },
    targetReel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reel',
    },
    targetStory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Story',
    },
    targetComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    /* =========================
       REPORT DETAILS
    ========================= */
    reason: {
      type: String,
      enum: [
        'spam',
        'harassment',
        'hate_speech',
        'violence',
        'nudity',
        'false_information',
        'scam',
        'intellectual_property',
        'self_harm',
        'other',
      ],
      required: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },

    /* =========================
       ADMIN ACTION
    ========================= */
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'resolved', 'dismissed'],
      default: 'pending',
      index: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    reviewedAt: {
      type: Date,
    },

    actionTaken: {
      type: String,
      enum: [
        'none',
        'content_removed',
        'user_warned',
        'user_suspended',
        'user_banned',
        'dismissed',
      ],
      default: 'none',
    },

    adminNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

/* =========================
   INDEXES
========================= */
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ targetType: 1, status: 1 });
ReportSchema.index({ reporter: 1, createdAt: -1 });

module.exports = mongoose.model('Report', ReportSchema);