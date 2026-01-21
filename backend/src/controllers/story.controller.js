const Story = require('../models/Story');
const catchAsync = require('../utils/catchAsync');

/* ===========================
   CREATE STORY
   POST /api/v1/stories
=========================== */
exports.createStory = catchAsync(async (req, res) => {
  const userId = req.user.id;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Story media is required',
    });
  }

  // Detect media type
  const mediaType = req.file.mimetype.startsWith('video')
    ? 'video'
    : 'image';

  // Support S3 or local storage
  const mediaKey =
    req.file.key ||           // S3
    req.file.filename ||      // local
    req.file.originalname;

  const mediaUrl =
    req.file.location ||      // S3
    req.file.path;            // local

  const story = await Story.create({
    user: userId,
    media: {
      type: mediaType,
      key: mediaKey,
      url: mediaUrl,
    },
    // expiresAt auto-set by pre-save hook (24h)
  });

  await story.populate('user', 'username profilePicture');

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
  const stories = await Story.find()
    .populate('user', 'username profilePicture')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    results: stories.length,
    data: stories,
  });
});
