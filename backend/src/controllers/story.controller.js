const Story = require('../models/Story');
const User = require('../models/user.model');
const catchAsync = require('../utils/catchAsync');

const CDN_BASE_URL =
  process.env.CDN_BASE_URL ||
  `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

/* ===========================
   CREATE STORY
   POST /api/v1/stories
=========================== */
exports.createStory = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { key, mediaType } = req.body;

  console.log('📸 Creating story:', { userId, key, mediaType });

  if (!key || !mediaType) {
    return res.status(400).json({
      success: false,
      message: 'key and mediaType are required',
    });
  }

  if (!['image', 'video'].includes(mediaType)) {
    return res.status(400).json({
      success: false,
      message: 'mediaType must be image or video',
    });
  }

  const mediaUrl = `${CDN_BASE_URL}/${key}`;

  const story = await Story.create({
    user: userId,
    media: {
      type: mediaType,
      key: key,
      url: mediaUrl,
    },
  });

  await story.populate('user', 'username profilePicture');

  console.log('✅ Story created:', story._id);

  res.status(201).json({
    success: true,
    data: story,
  });
});

/* ===========================
   GET STORY FEED
   GET /api/v1/stories/feed
=========================== */
exports.getStoryFeed = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const currentUser = await User.findById(userId).select('following');

  const stories = await Story.find({
    user: { $in: [...currentUser.following, userId] },
  })
    .populate('user', 'username profilePicture')
    .sort({ createdAt: -1 });

  const groupedStories = {};

  stories.forEach(story => {
    // 🔒 CRITICAL SAFETY CHECK
    if (!story.user || !story.user._id) {
      return; // skip broken story
    }

    const uid = story.user._id.toString();

    const isSeen =
      uid === userId
        ? true
        : Array.isArray(story.seenBy) &&
          story.seenBy.some(id => id.toString() === userId);

    if (!groupedStories[uid]) {
      groupedStories[uid] = {
        user: story.user,
        stories: [],
      };
    }

    groupedStories[uid].stories.push({
      ...story.toObject(),
      isSeen,
    });
  });

  res.status(200).json({
    success: true,
    results: Object.keys(groupedStories).length,
    data: Object.values(groupedStories),
  });
});

/* ===========================
   DELETE STORY
   DELETE /api/v1/stories/:id
=========================== */
exports.deleteStory = catchAsync(async (req, res) => {
  const story = await Story.findById(req.params.id);

  if (!story) {
    return res.status(404).json({
      success: false,
      message: 'Story not found',
    });
  }

  // Only owner can delete
  if (story.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized',
    });
  }

  await story.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Story deleted',
  });
});

/* ===========================
   MARK STORIES AS SEEN
   POST /api/v1/stories/seen
=========================== */
exports.markStoriesSeen = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { storyIds } = req.body;

  if (!Array.isArray(storyIds) || storyIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'storyIds array is required',
    });
  }

  await Story.updateMany(
    {
      _id: { $in: storyIds },
      user: { $ne: userId }, // Don't mark own stories as seen
    },
    { $addToSet: { seenBy: userId } }
  );

  res.status(200).json({
    success: true,
    message: 'Stories marked as seen',
  });
});

/* ===========================
   GET STORY VIEWERS (WITH REACTIONS)
   GET /api/v1/stories/:id/viewers
=========================== */
exports.getStoryViewers = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate('seenBy', 'username profilePicture')
      .populate('reactions.user', 'username profilePicture')
      .select('seenBy user reactions');

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found',
      });
    }

    // Only story owner can view viewers
    if (story.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Create a map of reactions by user ID for quick lookup
    const reactionsMap = new Map();
    if (story.reactions && story.reactions.length > 0) {
      story.reactions.forEach(reaction => {
        if (reaction.user && reaction.user._id) {
          reactionsMap.set(reaction.user._id.toString(), {
            type: reaction.emoji, // Using 'emoji' field from your schema
            createdAt: reaction.createdAt,
          });
        }
      });
    }

    // Combine viewers with their reactions
    const viewersWithReactions = (story.seenBy || []).map(viewer => {
      const viewerId = viewer._id.toString();
      const reaction = reactionsMap.get(viewerId);

      return {
        _id: viewer._id,
        username: viewer.username,
        profilePicture: viewer.profilePicture,
        // Add reaction data if exists
        reaction: reaction
          ? {
              type: reaction.type,
              createdAt: reaction.createdAt,
            }
          : null,
      };
    });

    // Sort: users with reactions first, then by reaction time (most recent first)
    viewersWithReactions.sort((a, b) => {
      // Users with reactions come first
      if (a.reaction && !b.reaction) return -1;
      if (!a.reaction && b.reaction) return 1;

      // If both have reactions, sort by reaction time (most recent first)
      if (a.reaction && b.reaction) {
        return new Date(b.reaction.createdAt) - new Date(a.reaction.createdAt);
      }

      // Neither has reactions, maintain original order
      return 0;
    });

    return res.status(200).json({
      success: true,
      count: viewersWithReactions.length,
      data: viewersWithReactions,
    });
  } catch (error) {
    console.error('Error getting story viewers:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/* ===========================
   REACT TO STORY
   POST /api/v1/stories/:id/react
=========================== */
exports.reactToStory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reaction } = req.body; // reaction = emoji

    if (!reaction || typeof reaction !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Reaction emoji is required',
      });
    }

    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found',
      });
    }

    // Initialize reactions array if it doesn't exist
    if (!story.reactions) {
      story.reactions = [];
    }

    // Remove previous reaction by same user
    story.reactions = story.reactions.filter(
      r => r.user.toString() !== userId
    );

    // Add new reaction
    story.reactions.push({
      user: userId,
      emoji: reaction,
      createdAt: new Date(),
    });

    await story.save();

    return res.status(200).json({
      success: true,
      message: 'Reaction added',
    });
  } catch (error) {
    console.error('Error reacting to story:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/* ===========================
   GET STORY REACTIONS
   GET /api/v1/stories/:id/reactions
=========================== */
exports.getStoryReactions = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id).populate(
      'reactions.user',
      'username profilePicture'
    );

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: story.reactions || [],
    });
  } catch (error) {
    console.error('Error getting story reactions:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};