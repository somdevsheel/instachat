// const mongoose = require('mongoose');

// const messageSchema = new mongoose.Schema(
//   {
//     chat: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Chat',
//       required: true,
//       index: true,
//     },

//     sender: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//     },

//     receiver: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//     },

//     text: {
//       type: String,
//       trim: true,
//     },

//     // ✅ STORY REPLY SUPPORT
//     story: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Story',
//       default: null,
//     },

//     encryptionMode: {
//       type: String,
//       enum: ['plain', 'e2ee'],
//       default: 'plain',
//     },

//     type: {
//       type: String,
//       enum: ['text', 'image', 'video'],
//       default: 'text',
//     },

//     readBy: [
//       {
//         user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//         readAt: { type: Date, default: Date.now },
//       },
//     ],

//     deletedForEveryone: { type: Boolean, default: false },
//     deletedAt: Date,
//     deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model('Message', messageSchema);





const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    text: {
      type: String,
      trim: true,
    },

    // ✅ STORY REPLY SUPPORT
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Story',
      default: null,
    },

    // ✅ SHARED POST SUPPORT
    sharedPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
    },

    // ✅ SHARED REEL SUPPORT
    sharedReel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reel',
      default: null,
    },

    // ✅ ATTACHMENT SUPPORT (photo/video sent directly in a message)
    attachment: {
      type: new mongoose.Schema(
        {
          type: {
            type: String,
            enum: ['image', 'video'],
            required: true,
          },
          originalKey: {
            type: String,
            required: true,
          },
          variants: {
            original: {
              type: String,
              required: true,
            },
            thumbnail: {
              type: String,
              default: null,
            },
          },
        },
        { _id: false }
      ),
      required: false,
      default: undefined,
    },

    encryptionMode: {
      type: String,
      enum: ['plain', 'e2ee'],
      default: 'plain',
    },

    type: {
      type: String,
      enum: ['text', 'image', 'video', 'shared_post', 'shared_reel'],
      default: 'text',
    },

    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],

    deletedForEveryone: { type: Boolean, default: false },
    deletedAt: Date,
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);