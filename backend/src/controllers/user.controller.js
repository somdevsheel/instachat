const User = require('../models/user.model');
const Post = require('../models/Post');
const notificationService = require('../services/notification.service');
const { getUserStatus } = require('../utils/userStatus.util');
const escapeRegex = require('../utils/escapeRegex');
const validator = require('validator');
const Otp = require('../models/Otp.model');
const sendEmail = require('../utils/sendEmail');
const { generateOtp, getOtpExpiry, consumeOtp } = require('../utils/otp');
const { verifyUploadedMedia } = require('../utils/verifyUpload');
const graph = require('../services/graph.service');
const { deleteAccountData } = require('../services/accountDeletion.service');
const { exportUserData } = require('../services/dataExport.service');
const access = require('../services/access.service');
const loadUsersInOrder = require('../utils/loadUsersInOrder');
const logger = require('../utils/logger');
const str = require('../utils/str');

/**
 * CDN BASE URL
 */
const CDN_BASE_URL =
  process.env.CDN_BASE_URL ||
  `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

/* ================================
   🔍 SEARCH USERS
================================ */
exports.searchUsers = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();

    if (!q) {
      return res.status(200).json({ success: true, data: [] });
    }

    const blockedEitherWay = await graph.getBlockedEitherWayIds(req.user.id);
    const users = await User.find({
      username: { $regex: escapeRegex(q), $options: 'i' },
      _id: { $ne: req.user.id, $nin: blockedEitherWay },
    })
      .select('username profilePicture lastSeen activityStatusVisible')
      .limit(50);

    const followingSet = new Set(await graph.getFollowingIds(req.user.id));

    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const status = await getUserStatus(user, req.user);
        return {
          _id: user._id,
          username: user.username,
          profilePicture: user.profilePicture,
          isFollowing: followingSet.has(user._id.toString()),
          online: status.online,
          lastSeen: status.lastSeen,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: usersWithStatus,
    });
  } catch (err) {
    logger.error('Search users error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to search users',
    });
  }
};

/* ================================
   👤 GET USER PROFILE (PUBLIC)
================================ */
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username,
    }).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isSelf = user._id.toString() === req.user.id;
    const relationship = await graph.getRelationship(req.user.id, user._id);

    // Blocked either way: behave as if the account doesn't exist.
    if (relationship.iBlocked || relationship.blockedMe) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const { isFollowing, followsMe } = relationship;
    // Private + not following: show the header, hide the content.
    const isLocked = !!user.isPrivate && !isSelf && !isFollowing;

    const [posts, postsCount, counts, mutual, isRequested] = await Promise.all([
      isLocked
        ? []
        : Post.find({ user: user._id })
            .sort({ createdAt: -1 })
            .select('media caption user createdAt repostOf repostOfModel')
            .populate({
              path: 'repostOf',
              populate: { path: 'user', select: 'username name profilePicture' },
            })
            .lean()
            .then(async (list) =>
              access.redactHiddenReposts(list, await access.getHiddenAuthorIds(req.user.id))
            ),
      Post.countDocuments({ user: user._id }),
      graph.getCounts(user._id),
      // Mutual = people I follow who also follow this profile.
      graph.getMutualFollowersOf(req.user.id, user._id, { limit: 6 }),
      isLocked ? graph.hasRequested(req.user.id, user._id) : false,
    ]);

    const canMessage = isFollowing || followsMe;
    const status = await getUserStatus(user, req.user);
    const mutualPreview = await loadUsersInOrder(
      mutual.ids,
      'username profilePicture'
    );

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        name: user.name || '',
        profilePicture: user.profilePicture,
        bio: user.bio,
        location: user.location || '',
        website: user.website || '',
        isVerified: user.isVerified || false,
        createdAt: user.createdAt,
        postsCount,
        followersCount: counts.followersCount,
        followingCount: counts.followingCount,
        isFollowing,
        isPrivate: !!user.isPrivate,
        isLocked,
        isRequested,
        canMessage,
        online: status.online,
        lastSeen: status.lastSeen,
        mutualCount: mutual.total,
        mutualPreview: mutualPreview.map((f) => ({
          _id: f._id,
          username: f.username,
          profilePicture: f.profilePicture,
        })),
        posts,
      },
    });
  } catch (err) {
    logger.error('Get profile error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load profile',
    });
  }
};

/* ================================
   ✏️ UPDATE PROFILE
================================ */
exports.updateUserProfile = async (req, res) => {
  try {
    const { username, bio, location, website, avatarKey } = req.body;

    for (const [key, val] of Object.entries({ username, bio, location, website })) {
      if (val !== undefined && typeof val !== 'string') {
        return res.status(400).json({
          success: false,
          message: `${key} must be a string`,
        });
      }
    }

    // Build update fields
    const updateFields = {};
    if (username && username.trim().toLowerCase() !== req.user.username) {
      const normalized = username.trim().toLowerCase();
      if (!/^[a-z0-9._]{3,30}$/.test(normalized)) {
        return res.status(400).json({
          success: false,
          message:
            'Username must be 3-30 characters: letters, numbers, dots or underscores',
        });
      }
      const taken = await User.exists({
        username: normalized,
        _id: { $ne: req.user._id },
      });
      if (taken) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken',
        });
      }
      updateFields.username = normalized;
    }
    if (bio !== undefined) updateFields.bio = bio.trim();
    if (location !== undefined) updateFields.location = location.trim();
    if (website !== undefined) updateFields.website = website.trim();
    if (avatarKey) {
      try {
        await verifyUploadedMedia(avatarKey, req.user.id, 'image');
      } catch (err) {
        return res.status(err.statusCode || 400).json({
          success: false,
          message: err.message,
        });
      }
      updateFields.profilePicture = `${CDN_BASE_URL}/${avatarKey}`;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      {
        new: true,
        runValidators: true, // enforce schema length limits on update
        select:
          '_id username email profilePicture bio location website isVerified createdAt',
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
        location: user.location || '',
        website: user.website || '',
        isVerified: user.isVerified || false,
        createdAt: user.createdAt,
        ...(await graph.getCounts(user._id)),
      },
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(err.errors).map((e) => e.message).join(', '),
      });
    }
    logger.error('Update profile error:', err);
    return res.status(500).json({
      success: false,
      message: 'Profile update failed',
    });
  }
};

/* ================================
   🔐 UPDATE PASSWORD
================================ */
exports.updatePassword = async (req, res) => {
  try {
    const currentPassword = str(req.body.currentPassword);
    const newPassword = str(req.body.newPassword);

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters',
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isMatch = await user.isPasswordMatch(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (err) {
    logger.error('Update password error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update password',
    });
  }
};

/* ================================================================
   ========== ACCOUNT SETTINGS ==========
================================================================ */

/* ================================
   📋 GET ACCOUNT INFO
================================ */
exports.getAccountInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      'username email phone name gender dateOfBirth profilePicture twoFactorEnabled'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        username: user.username,
        email: user.email,
        phone: user.phone || '',
        name: user.name || '',
        gender: user.gender || '',
        dateOfBirth: user.dateOfBirth || null,
        profilePicture: user.profilePicture || '',
        twoFactorEnabled: user.twoFactorEnabled || false,
      },
    });
  } catch (err) {
    logger.error('Get account info error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load account info',
    });
  }
};

/* ================================
   📦 DOWNLOAD YOUR DATA
   GET /users/me/export
================================ */
exports.exportMyData = async (req, res) => {
  try {
    const data = await exportUserData(req.user._id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const date = new Date().toISOString().slice(0, 10);
    res.set('Content-Disposition', `attachment; filename="instachat-data-${req.user.username}-${date}.json"`);
    res.set('Cache-Control', 'no-store');
    return res.status(200).json({ success: true, data });
  } catch (err) {
    logger.error('Data export error:', err);
    return res.status(500).json({ success: false, message: 'Failed to export your data' });
  }
};

/* ================================
   ✉️ REQUEST EMAIL CHANGE CODE
   POST /users/account-info/email/request-otp  { email }
   Sends a code to the NEW address; confirm via PATCH /account-info
   with { email, emailOtp }.
================================ */
exports.requestEmailChangeOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (typeof email !== 'string' || !validator.isEmail(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'A valid email is required',
      });
    }

    const newEmail = email.trim().toLowerCase();
    if (newEmail === req.user.email) {
      return res.status(400).json({
        success: false,
        message: 'That is already your email',
      });
    }

    if (await User.exists({ email: newEmail })) {
      return res.status(400).json({
        success: false,
        message: 'Email is already in use',
      });
    }

    await Otp.deleteMany({ user: req.user._id, purpose: 'change-email' });

    const otp = generateOtp();
    await Otp.create({
      email: newEmail,
      user: req.user._id,
      otp,
      purpose: 'change-email',
      expiresAt: getOtpExpiry(),
    });

    await sendEmail({
      to: newEmail,
      subject: 'InstaChat - Confirm your new email',
      text: `Your InstaChat email change code is ${otp}. It is valid for 5 minutes. If you didn't request this, ignore this email.`,
    });

    return res.status(200).json({
      success: true,
      message: 'Verification code sent to your new email',
    });
  } catch (err) {
    logger.error('Request email change OTP error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to send verification code',
    });
  }
};

/* ================================
   ✏️ UPDATE ACCOUNT INFO
================================ */
exports.updateAccountInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const { username, email, emailOtp, phone, name, gender, dateOfBirth } =
      req.body;

    for (const [key, val] of Object.entries({ username, email, phone, name })) {
      if (val !== undefined && typeof val !== 'string') {
        return res.status(400).json({
          success: false,
          message: `${key} must be a string`,
        });
      }
    }

    // Username format + uniqueness check
    if (username && username.trim().toLowerCase() !== user.username) {
      if (!/^[a-z0-9._]{3,30}$/i.test(username.trim())) {
        return res.status(400).json({
          success: false,
          message:
            'Username must be 3-30 characters: letters, numbers, dots or underscores',
        });
      }
      const existing = await User.findOne({
        username: username.trim().toLowerCase(),
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken',
        });
      }
      user.username = username.trim().toLowerCase();
    }

    // Email change: must be confirmed with a code sent to the NEW
    // address (POST /users/account-info/email/request-otp first).
    // Otherwise a hijacked session could silently move the account to an
    // attacker's inbox and lock the owner out via "forgot password".
    let previousEmail = null;
    if (email && email.trim().toLowerCase() !== user.email) {
      const newEmail = email.trim().toLowerCase();
      const existing = await User.findOne({ email: newEmail });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use',
        });
      }

      if (typeof emailOtp !== 'string' || !emailOtp.trim()) {
        return res.status(400).json({
          success: false,
          code: 'EMAIL_OTP_REQUIRED',
          message: 'Enter the verification code sent to your new email',
        });
      }

      const otpRecord = await consumeOtp(Otp, {
        email: newEmail,
        purpose: 'change-email',
        user: user._id,
        otp: emailOtp,
      });
      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired verification code',
        });
      }

      previousEmail = user.email;
      user.email = newEmail;
    }

    if (phone !== undefined) user.phone = phone.trim();
    if (name !== undefined) user.name = name.trim();
    if (gender !== undefined) user.gender = gender;
    if (dateOfBirth !== undefined) {
      user.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    }

    await user.save({ validateBeforeSave: true });

    if (previousEmail) {
      // Best-effort security notice to the old address.
      sendEmail({
        to: previousEmail,
        subject: 'InstaChat - Your email address was changed',
        text: `The email on your InstaChat account (@${user.username}) was changed to ${user.email}. If you didn't do this, contact support immediately.`,
      }).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      message: 'Account updated successfully',
      data: {
        username: user.username,
        email: user.email,
        phone: user.phone,
        name: user.name,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
      },
    });
  } catch (err) {
    logger.error('Update account info error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update account info',
    });
  }
};

/* ================================================================
   ========== PRIVACY SETTINGS ==========
================================================================ */

/* ================================
   🔒 GET PRIVACY SETTINGS
================================ */
exports.getPrivacySettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      'isPrivate activityStatusVisible showReadReceipts'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        isPrivate: user.isPrivate,
        activityStatusVisible: user.activityStatusVisible,
        showReadReceipts: user.showReadReceipts,
      },
    });
  } catch (err) {
    logger.error('Get privacy settings error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load privacy settings',
    });
  }
};

/* ================================
   🔒 UPDATE PRIVACY SETTINGS
================================ */
exports.updatePrivacySettings = async (req, res) => {
  try {
    const { isPrivate, activityStatusVisible, showReadReceipts } = req.body;

    // Build only the fields that were sent
    const updateFields = {};
    if (typeof isPrivate === 'boolean') updateFields.isPrivate = isPrivate;
    if (typeof activityStatusVisible === 'boolean')
      updateFields.activityStatusVisible = activityStatusVisible;
    if (typeof showReadReceipts === 'boolean')
      updateFields.showReadReceipts = showReadReceipts;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, select: 'isPrivate activityStatusVisible showReadReceipts' }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Going public: everyone waiting on a request becomes a follower.
    if (updateFields.isPrivate === false) {
      await graph.acceptAllFollowRequests(req.user.id);
    }

    return res.status(200).json({
      success: true,
      message: 'Privacy settings updated',
      data: {
        isPrivate: user.isPrivate,
        activityStatusVisible: user.activityStatusVisible,
        showReadReceipts: user.showReadReceipts,
      },
    });
  } catch (err) {
    logger.error('Update privacy settings error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update privacy settings',
    });
  }
};

/* ================================
   🚫 BLOCK USER
================================ */
exports.blockUser = async (req, res) => {
  try {
    const targetId = req.params.id;

    if (targetId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot block yourself',
      });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Blocking also removes follows + close friends both ways.
    const { blocked } = await graph.toggleBlock(req.user.id, targetId);

    return res.status(200).json({
      success: true,
      blocked,
      message: `${blocked ? 'Blocked' : 'Unblocked'} @${targetUser.username}`,
    });
  } catch (err) {
    logger.error('Block user error:', err);
    return res.status(500).json({
      success: false,
      message: 'Block action failed',
    });
  }
};

/* ================================
   🚫 GET BLOCKED USERS
================================ */
exports.getBlockedUsers = async (req, res) => {
  try {
    const ids = await graph.getBlockedIds(req.user.id);
    const users = await loadUsersInOrder(ids, 'username profilePicture');

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (err) {
    logger.error('Get blocked users error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load blocked users',
    });
  }
};

/* ================================
   🔇 MUTE / UNMUTE USER
================================ */
exports.muteUser = async (req, res) => {
  try {
    const targetId = req.params.id;

    if (targetId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot mute yourself',
      });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const { muted } = await graph.toggleMute(req.user.id, targetId);

    return res.status(200).json({
      success: true,
      muted,
      message: `${muted ? 'Muted' : 'Unmuted'} @${targetUser.username}`,
    });
  } catch (err) {
    logger.error('Mute user error:', err);
    return res.status(500).json({
      success: false,
      message: 'Mute action failed',
    });
  }
};

/* ================================
   🔇 GET MUTED USERS
================================ */
exports.getMutedUsers = async (req, res) => {
  try {
    const ids = await graph.getMutedIds(req.user.id);
    const users = await loadUsersInOrder(ids, 'username profilePicture');

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (err) {
    logger.error('Get muted users error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load muted users',
    });
  }
};

/* ================================================================
   ========== SECURITY SETTINGS ==========
================================================================ */

/* ================================
   🛡️ GET LOGIN ACTIVITY
================================ */
exports.getLoginActivity = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('loginActivity');

    return res.status(200).json({
      success: true,
      data: user.loginActivity || [],
    });
  } catch (err) {
    logger.error('Get login activity error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load login activity',
    });
  }
};

/* ================================
   🛡️ TOGGLE TWO-FACTOR AUTH
================================ */
exports.registerPushToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Push token is required',
      });
    }

    // A device's token can migrate from another account (logout/login as
    // someone else on the same phone) — drop it everywhere else first.
    await User.updateMany(
      { pushTokens: token },
      { $pull: { pushTokens: token } }
    );

    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { pushTokens: token },
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    logger.error('Register push token error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to register push token',
    });
  }
};

exports.removePushToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Push token is required',
      });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { pushTokens: token },
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    logger.error('Remove push token error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove push token',
    });
  }
};

exports.toggleTwoFactor = async (req, res) => {
  try {
    // Step 1: Get current value
    const user = await User.findById(req.user.id).select('twoFactorEnabled');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const newValue = !user.twoFactorEnabled;

    // Step 2: Atomic update — NO .save(), NO validation
    await User.findByIdAndUpdate(
      req.user.id,
      { $set: { twoFactorEnabled: newValue } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      twoFactorEnabled: newValue,
      message: newValue
        ? 'Two-factor authentication enabled'
        : 'Two-factor authentication disabled',
    });
  } catch (err) {
    logger.error('Toggle 2FA error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update two-factor setting',
    });
  }
};

/* ================================
   🗑️ DELETE ACCOUNT
================================ */
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete account',
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isMatch =
      typeof password === 'string' && (await user.isPasswordMatch(password));
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password',
      });
    }

    // Full erasure: content, messages, media, likes, graph... (see service)
    await deleteAccountData(user._id);

    // End any open realtime connections for this account.
    try {
      require('../services/socket.service').getIO().in(user._id.toString()).disconnectSockets(true);
    } catch {}

    return res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (err) {
    logger.error('Delete account error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete account',
    });
  }
};

/* ================================
   🔄 FOLLOW / UNFOLLOW
================================ */
exports.followUser = async (req, res) => {
  try {
    const myId = req.user.id;
    const targetId = req.params.id;

    if (myId === targetId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself',
      });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    let following;
    let requested = false;
    try {
      const alreadyFollowing = await graph.isFollowing(myId, targetId);
      if (targetUser.isPrivate && !alreadyFollowing) {
        // Private account: send (or cancel) a follow request instead.
        ({ requested } = await graph.toggleFollowRequest(myId, targetId));
        following = false;
      } else {
        ({ following } = await graph.toggleFollow(myId, targetId));
      }
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({
          success: false,
          message: err.message,
        });
      }
      throw err;
    }

    if (following || requested) {
      // Notification (safe)
      try {
        await notificationService.createNotification({
          recipient: targetId,
          sender: myId,
          type: requested ? 'follow_request' : 'follow',
          message: requested ? 'requested to follow you' : 'started following you',
        });
      } catch (err) {
        logger.error('Notification error:', err);
      }
    }

    const { followersCount } = await graph.getCounts(targetId);

    return res.status(200).json({
      success: true,
      following,
      requested,
      followersCount,
    });
  } catch (err) {
    logger.error('Follow user error:', err);
    return res.status(500).json({
      success: false,
      message: 'Follow action failed',
    });
  }
};

/* ================================
   📨 FOLLOW REQUESTS (private accounts)
================================ */
exports.getFollowRequests = async (req, res) => {
  try {
    const ids = await graph.getFollowRequestIds(req.user.id);
    const users = await loadUsersInOrder(ids, 'username name profilePicture');

    return res.status(200).json({
      success: true,
      data: users.map((u) => ({
        _id: u._id,
        username: u.username,
        name: u.name,
        profilePicture: u.profilePicture,
      })),
    });
  } catch (err) {
    logger.error('Get follow requests error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load follow requests',
    });
  }
};

exports.respondToFollowRequest = async (req, res) => {
  try {
    const requesterId = req.params.id;
    const accept = req.params.action === 'accept';

    if (!['accept', 'decline'].includes(req.params.action)) {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    const handled = accept
      ? await graph.acceptFollowRequest(req.user.id, requesterId)
      : await graph.declineFollowRequest(req.user.id, requesterId);

    if (!handled) {
      return res.status(404).json({
        success: false,
        message: 'Follow request not found',
      });
    }

    if (accept) {
      try {
        await notificationService.createNotification({
          recipient: requesterId,
          sender: req.user.id,
          type: 'follow',
          message: 'accepted your follow request',
        });
      } catch (err) {
        logger.error('Notification error:', err);
      }
    }

    return res.status(200).json({
      success: true,
      accepted: accept,
    });
  } catch (err) {
    logger.error('Respond to follow request error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update follow request',
    });
  }
};

/* ================================
   💜 CLOSE FRIENDS
================================ */
exports.getCloseFriendsCandidates = async (req, res) => {
  try {
    const [followingIds, closeFriendIds] = await Promise.all([
      graph.getFollowingIds(req.user.id),
      graph.getCloseFriendIds(req.user.id),
    ]);
    const closeFriendsSet = new Set(closeFriendIds);
    const following = await loadUsersInOrder(
      followingIds,
      'username name profilePicture'
    );

    const data = following.map((u) => ({
      _id: u._id,
      username: u.username,
      name: u.name,
      profilePicture: u.profilePicture,
      isCloseFriend: closeFriendsSet.has(u._id.toString()),
    }));

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    logger.error('Get close friends candidates error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load close friends',
    });
  }
};

exports.toggleCloseFriend = async (req, res) => {
  try {
    const myId = req.user.id;
    const targetId = req.params.id;

    if (myId === targetId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot add yourself as a close friend',
      });
    }

    if (!(await User.exists({ _id: targetId }))) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const { isCloseFriend } = await graph.toggleCloseFriend(myId, targetId);

    return res.status(200).json({
      success: true,
      isCloseFriend,
    });
  } catch (err) {
    logger.error('Toggle close friend error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update close friends',
    });
  }
};

/* ================================
   👥 FOLLOWERS / FOLLOWING LIST
================================ */
exports.getFollowList = async (req, res) => {
  try {
    const { id, type } = req.params;

    if (!['followers', 'following'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid follow type',
      });
    }

    const owner = await User.findById(id).select('isPrivate').lean();
    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    try {
      await access.assertCanView(req.user.id, owner);
    } catch (err) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
        ...(err.code ? { code: err.code } : {}),
      });
    }

    // ?limit=&offset= for paging; default keeps the old "whole list"
    // behaviour but capped so a huge account can't blow up a response.
    const limit = Math.min(Number(req.query.limit) || 500, 500);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const [listIds, myFollowingIds] = await Promise.all([
      type === 'followers'
        ? graph.getFollowerIds(id, { limit, offset })
        : graph.getFollowingIds(id, { limit, offset }),
      graph.getFollowingIds(req.user.id),
    ]);
    const followingSet = new Set(myFollowingIds);
    const users = await loadUsersInOrder(listIds, 'username profilePicture lastSeen activityStatusVisible');

    const listWithStatus = await Promise.all(
      users.map(async (u) => {
        const status = await getUserStatus(u, req.user);
        return {
          _id: u._id,
          username: u.username,
          profilePicture: u.profilePicture,
          isFollowing: followingSet.has(u._id.toString()),
          online: status.online,
          lastSeen: status.lastSeen,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: listWithStatus,
    });
  } catch (err) {
    logger.error('Get follow list error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load follow list',
    });
  }
};

/* ================================
   ⭐ SUGGESTED USERS
================================ */
exports.getSuggestedUsers = async (req, res) => {
  try {
    const LIMIT = 20;

    // Friends-of-friends first (ranked by mutual count in Postgres).
    const ranked = await graph.getSuggestions(req.user.id, { limit: LIMIT });
    const mutualById = new Map(ranked.map((r) => [r.id, r.mutualCount]));
    let users = await loadUsersInOrder(
      ranked.map((r) => r.id),
      'username profilePicture lastSeen activityStatusVisible'
    );

    // Top up with other accounts (new users with no graph yet).
    if (users.length < LIMIT) {
      const [followingIds, blockedIds] = await Promise.all([
        graph.getFollowingIds(req.user.id),
        graph.getBlockedIds(req.user.id),
      ]);
      const exclude = [
        req.user.id,
        ...followingIds,
        ...blockedIds,
        ...users.map((u) => u._id.toString()),
      ];
      const extra = await User.find({ _id: { $nin: exclude } })
        .select('username profilePicture lastSeen activityStatusVisible')
        .limit(LIMIT - users.length);
      users = users.concat(extra);
    }

    const usersWithStatus = await Promise.all(
      users.map(async (u) => {
        const status = await getUserStatus(u, req.user);
        return {
          _id: u._id,
          username: u.username,
          profilePicture: u.profilePicture,
          isFollowing: false,
          online: status.online,
          lastSeen: status.lastSeen,
          mutualCount: mutualById.get(u._id.toString()) || 0,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: usersWithStatus,
    });
  } catch (err) {
    logger.error('Suggested users error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load suggestions',
    });
  }
};

/* ================================
   🤝 MUTUAL FOLLOWERS
================================ */
exports.getMutualFollowers = async (req, res) => {
  try {
    const ids = await graph.getMutualIds(req.user.id);
    const users = await loadUsersInOrder(ids, 'username profilePicture lastSeen activityStatusVisible');

    const mutuals = await Promise.all(
      users.map(async (f) => {
        const status = await getUserStatus(f, req.user);
        return {
          _id: f._id,
          username: f.username,
          profilePicture: f.profilePicture,
          isFollowing: true,
          online: status.online,
          lastSeen: status.lastSeen,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: mutuals,
    });
  } catch (err) {
    logger.error('Mutual followers error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load mutual followers',
    });
  }
};
