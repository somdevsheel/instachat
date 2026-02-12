const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');

const router = express.Router();

router.post('/force-reset-password', async (req, res) => {
  try {
    const { userId, newPassword } = req.body;

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    return res.json({
      success: true,
      message: 'Password force reset DONE',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Reset failed' });
  }
});

module.exports = router;
