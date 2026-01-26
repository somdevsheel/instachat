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

  // Get user's following list
  const currentUser = await User.findById(userId).select('following');

  // Fetch stories from following + own stories
  const stories = await Story.find({
    user: { $in: [...currentUser.following, userId] },
  })
    .populate('user', 'username profilePicture')
    .sort({ createdAt: -1 });

  // Group stories by user
  const groupedStories = {};

  stories.forEach(story => {
    const uid = story.user._id.toString();

    // ✅ IMPORTANT: compute seen status per story
    const isSeen =
  story.user._id.toString() === userId
    ? true // 👈 owner always treated as seen
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
      isSeen, // ✅ frontend will use this
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
    { _id: { $in: storyIds } },
    { $addToSet: { seenBy: userId } }
  );

  res.status(200).json({
    success: true,
    message: 'Stories marked as seen',
  });
});
