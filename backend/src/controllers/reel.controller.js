const Reel = require('../models/reel.model');
const catchAsync = require('../utils/catchAsync');

/**
 * GET /api/v1/reels/feed
 */
exports.getReels = catchAsync(async (req, res) => {
  const reels = await Reel.find()
    .populate('user', 'username profilePicture')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: reels,
  });
});

/**
 * POST /api/v1/reels
 */
exports.createReel = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Video file required',
    });
  }

  const reel = await Reel.create({
    user: req.user.id,
    videoUrl: req.file.location || req.file.path,
    caption: req.body.caption || '',
  });

  res.status(201).json({
    success: true,
    data: reel,
  });
});

/**
 * GET /api/v1/reels/:reelId
 */
exports.getReel = catchAsync(async (req, res) => {
  const reel = await Reel.findById(req.params.reelId)
    .populate('user', 'username profilePicture');

  if (!reel) {
    return res.status(404).json({
      success: false,
      message: 'Reel not found',
    });
  }

  res.status(200).json({
    success: true,
    data: reel,
  });
});
