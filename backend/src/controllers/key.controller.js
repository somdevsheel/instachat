const Key = require('../models/key.model');
const chatKeyService = require('../services/chatKey.service');
const catchAsync = require('../utils/catchAsync');

/**
 * ======================================================
 * GET USER PUBLIC KEY
 * GET /api/v1/keys/:userId
 * ======================================================
 */
exports.getUserKeys = catchAsync(async (req, res) => {
  const { userId } = req.params;

  if (!userId || userId === 'undefined') {
    return res.status(400).json({
      success: false,
      message: 'Invalid userId',
    });
  }

  const userKey = await Key.findOne({ user: userId });

  if (!userKey) {
    return res.status(404).json({
      success: false,
      message: 'Public key not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      publicKey: userKey.identityPublicKey,
    },
  });
});

/**
 * ======================================================
 * UPLOAD PUBLIC KEY
 * POST /api/v1/keys
 * ======================================================
 */
exports.upsertKeys = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { identityPublicKey } = req.body;

  if (!identityPublicKey) {
    return res.status(400).json({
      success: false,
      message: 'identityPublicKey is required',
    });
  }

  const key = await Key.findOneAndUpdate(
    { user: userId },
    { identityPublicKey },
    { upsert: true, new: true }
  );

  return res.status(200).json({
    success: true,
    message: 'Public key saved',
    data: {
      publicKey: key.identityPublicKey,
    },
  });
});

/**
 * ======================================================
 * GET ALL CHAT KEYS (For Login Sync)
 * GET /api/v1/keys/sync-chat-keys
 * ======================================================
 */
exports.syncChatKeys = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const chatKeys = await chatKeyService.getAllChatKeysForUser(userId);

  res.status(200).json({
    success: true,
    results: chatKeys.length,
    data: chatKeys,
  });
});