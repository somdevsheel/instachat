const catchAsync = require('../utils/catchAsync');
const Note = require('../models/Note');

const NOTE_LIFETIME_MS = 24 * 60 * 60 * 1000;

/**
 * ======================================================
 * GET MY ACTIVE NOTE
 * GET /api/v1/notes/me
 * ======================================================
 */
exports.getMyNote = catchAsync(async (req, res) => {
  const note = await Note.findOne({ user: req.user.id });

  res.status(200).json({
    success: true,
    data: note,
  });
});

/**
 * ======================================================
 * CREATE / REPLACE MY NOTE
 * POST /api/v1/notes
 * ======================================================
 */
exports.setNote = catchAsync(async (req, res) => {
  const text = (req.body.text || '').trim();

  if (!text) {
    return res.status(400).json({
      success: false,
      message: 'Note text is required',
    });
  }

  const note = await Note.findOneAndUpdate(
    { user: req.user.id },
    {
      user: req.user.id,
      text,
      expiresAt: new Date(Date.now() + NOTE_LIFETIME_MS),
    },
    { upsert: true, new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: note,
  });
});

/**
 * ======================================================
 * DELETE MY NOTE
 * DELETE /api/v1/notes
 * ======================================================
 */
exports.deleteNote = catchAsync(async (req, res) => {
  await Note.deleteOne({ user: req.user.id });

  res.status(200).json({
    success: true,
  });
});
