const User = require('../models/user.model');
const Post = require('../models/Post');
const notificationService = require('../services/notification.service');
const { getUserStatus } = require('../utils/userStatus.util');

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

    const currentUser = await User.findById(req.user.id).select('following');
    const followingSet = new Set(
      currentUser.following.map(id => id.toString())
    );

    const users = await User.find({
      username: { $regex: q, $options: 'i' },
      _id: { $ne: req.user.id },
    }).select('username profilePicture lastSeen');

    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const status = await getUserStatus(user);
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
    console.error('Search users error:', err);
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
    })
      .select('-password')
      .populate('followers', '_id')
      .populate('following', '_id');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .select('media user createdAt')
      .lean();

    const currentUser = await User.findById(req.user.id).select(
      'following followers'
    );

    const isFollowing = currentUser.following.some(
      id => id.toString() === user._id.toString()
    );

    const theyFollowMe = user.following.some(
      f => f._id.toString() === req.user.id.toString()
    );

    const canMessage = isFollowing || theyFollowMe;
    const status = await getUserStatus(user);

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        name: user.name || '',
        profilePicture: user.profilePicture,
        bio: user.bio,
        postsCount: posts.length,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        isFollowing,
        canMessage,
        online: status.online,
        lastSeen: status.lastSeen,
        posts,
      },
    });
  } catch (err) {
    console.error('Get profile error:', err);
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
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const { username, bio, avatarKey } = req.body;

    if (username) user.username = username.trim();
    if (bio !== undefined) user.bio = bio.trim();

    if (avatarKey) {
      const newUrl = `${CDN_BASE_URL}/${avatarKey}`;
      if (user.profilePicture !== newUrl) {
        user.profilePicture = newUrl;
      }
    }

    await user.save();

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
        followersCount: user.followers.length,
        followingCount: user.following.length,
      },
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({
      success: false,
      message: 'Profile update failed',
    });
  }
};

/* ================================
   🔐 UPDATE PASSWORD (ADD)
================================ */
// exports.updatePassword = async (req, res) => {
//   try {
//     const { currentPassword, newPassword } = req.body;

//     if (!currentPassword || !newPassword) {
//       return res.status(400).json({
//         success: false,
//         message: 'Current password and new password are required',
//       });
//     }

//     if (newPassword.length < 8) {
//       return res.status(400).json({
//         success: false,
//         message: 'New password must be at least 8 characters',
//       });
//     }

//     const user = await User.findById(req.user.id).select('+password');

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     const isMatch = await user.isPasswordMatch(currentPassword);
//     if (!isMatch) {
//       return res.status(401).json({
//         success: false,
//         message: 'Current password is incorrect',
//       });
//     }

//     user.password = newPassword;

//       // prevent immediate JWT invalidation during this request
//     user.passwordChangedAt = Date.now();

//     await user.save();
//  // triggers passwordChangedAt → logout all devices

//     return res.status(200).json({
//       success: true,
//       message:
//         'Password updated successfully. Please login again on all devices.',
//     });
//   } catch (err) {
//     console.error('Update password error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to update password',
//     });
//   }
// };

/* ================================
   🔐 UPDATE PASSWORD (DEBUG MODE)
================================ */
exports.updatePassword = async (req, res) => {
  try {
    console.log('================ PASSWORD DEBUG START ================');

    console.log('➡️ Controller HIT');
    console.log('➡️ req.user.id:', req.user?.id);

    console.log('➡️ Raw body:', req.body);
    console.log(
      '➡️ currentPassword:',
      `"${req.body.currentPassword}"`,
      'length:',
      req.body.currentPassword?.length
    );
    console.log(
      '➡️ newPassword:',
      `"${req.body.newPassword}"`,
      'length:',
      req.body.newPassword?.length
    );

    // FORCE TRIM (DEBUG)
    const currentPassword = req.body.currentPassword?.trim();
    const newPassword = req.body.newPassword?.trim();

    console.log(
      '➡️ currentPassword (trimmed):',
      `"${currentPassword}"`,
      'length:',
      currentPassword?.length
    );
    console.log(
      '➡️ newPassword (trimmed):',
      `"${newPassword}"`,
      'length:',
      newPassword?.length
    );

    if (!currentPassword || !newPassword) {
      console.log('❌ Missing password fields');
      return res.status(400).json({
        success: false,
        message: 'Passwords missing',
      });
    }

    const user = await require('../models/user.model')
      .findById(req.user.id)
      .select('+password');

    console.log('➡️ User fetched:', !!user);
    console.log(
      '➡️ Stored hashed password:',
      user.password
    );

    console.log('➡️ Comparing passwords with bcrypt...');
    const isMatch = await user.isPasswordMatch(currentPassword);

    console.log('➡️ bcrypt.compare result:', isMatch);

    if (!isMatch) {
      console.log('❌ PASSWORD MISMATCH');
      return res.status(401).json({
        success: false,
        message: 'Current password incorrect',
      });
    }

    console.log('✅ PASSWORD MATCHED');

    user.password = newPassword;
    await user.save();

    console.log('✅ Password SAVED');
    console.log('➡️ passwordChangedAt:', user.passwordChangedAt);

    

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (err) {
    console.error('🔥 PASSWORD UPDATE ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Password update failed',
    });
  }
};


/* ================================
   🔄 FOLLOW / UNFOLLOW
================================ */
// exports.followUser = async (req, res) => {
//   try {
//     const me = await User.findById(req.user.id);
//     const other = await User.findById(req.params.id);

//     if (!me || !other) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     const isFollowing = me.following.includes(other._id);

//     if (isFollowing) {
//       me.following.pull(other._id);
//       other.followers.pull(me._id);
//     } else {
//       me.following.push(other._id);
//       other.followers.push(me._id);

//       try {
//         await notificationService.createNotification({
//           recipient: other._id,
//           sender: me._id,
//           type: 'follow',
//           message: 'started following you',
//         });
//       } catch (err) {
//         console.error('Notification error:', err);
//       }
//     }

//     await me.save();
//     await other.save();

//     return res.status(200).json({
//       success: true,
//       following: !isFollowing,
//       followersCount: other.followers.length,
//     });
//   } catch (err) {
//     console.error('Follow user error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Follow action failed',
//     });
//   }
// };

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

    const me = await User.findById(myId).select('following');

    const isFollowing = me.following.includes(targetId);

    if (isFollowing) {
      // UNFOLLOW
      await User.findByIdAndUpdate(myId, {
        $pull: { following: targetId },
      });

      await User.findByIdAndUpdate(targetId, {
        $pull: { followers: myId },
      });
    } else {
      // FOLLOW
      await User.findByIdAndUpdate(myId, {
        $addToSet: { following: targetId },
      });

      await User.findByIdAndUpdate(targetId, {
        $addToSet: { followers: myId },
      });

      // Notification (safe)
      try {
        await notificationService.createNotification({
          recipient: targetId,
          sender: myId,
          type: 'follow',
          message: 'started following you',
        });
      } catch (err) {
        console.error('Notification error:', err);
      }
    }

    const updatedTarget = await User.findById(targetId).select('followers');

    return res.status(200).json({
      success: true,
      following: !isFollowing,
      followersCount: updatedTarget.followers.length,
    });
  } catch (err) {
    console.error('Follow user error:', err);
    return res.status(500).json({
      success: false,
      message: 'Follow action failed',
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

    const user = await User.findById(id)
      .populate(type, 'username profilePicture lastSeen')
      .select(type);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const currentUser = await User.findById(req.user.id).select('following');
    const followingSet = new Set(
      currentUser.following.map(id => id.toString())
    );

    const listWithStatus = await Promise.all(
      user[type].map(async (u) => {
        const status = await getUserStatus(u);
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
    console.error('Get follow list error:', err);
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
    const me = await User.findById(req.user.id);

    const users = await User.find({
      _id: { $nin: [req.user.id, ...me.following] },
    })
      .select('username profilePicture lastSeen')
      .limit(20);

    const usersWithStatus = await Promise.all(
      users.map(async (u) => {
        const status = await getUserStatus(u);
        return {
          _id: u._id,
          username: u.username,
          profilePicture: u.profilePicture,
          isFollowing: false,
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
    console.error('Suggested users error:', err);
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
    const me = await User.findById(req.user.id)
      .populate('followers', 'username profilePicture lastSeen')
      .populate('following', '_id');

    const followingSet = new Set(
      me.following.map(u => u._id.toString())
    );

    const mutuals = await Promise.all(
      me.followers
        .filter(f => followingSet.has(f._id.toString()))
        .map(async (f) => {
          const status = await getUserStatus(f);
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
    console.error('Mutual followers error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load mutual followers',
    });
  }
};
