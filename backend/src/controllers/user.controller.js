const User = require('../models/user.model');

/**
 * CDN BASE URL
 */
const CDN_BASE_URL =
  process.env.CDN_BASE_URL ||
  `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

/* ================================
   🔍 SEARCH USERS (FIXED)
================================ */
exports.searchUsers = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();

    if (!q) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Get current user to check following status
    const currentUser = await User.findById(req.user.id).select('following');
    const followingSet = new Set(
      currentUser.following.map(id => id.toString())
    );

    const users = await User.find({
      username: { $regex: q, $options: 'i' },
      _id: { $ne: req.user.id },
    }).select('username profilePicture');

    // ✅ Add isFollowing to each user
    const usersWithFollowStatus = users.map(user => ({
      _id: user._id,
      username: user.username,
      profilePicture: user.profilePicture,
      isFollowing: followingSet.has(user._id.toString()), // ✅ THIS WAS MISSING!
    }));

    return res.status(200).json({ success: true, data: usersWithFollowStatus });
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

    // ✅ Check if current user is following this profile
    const currentUser = await User.findById(req.user.id).select('following followers');
    const isFollowing = currentUser.following.some(
      id => id.toString() === user._id.toString()
    );

    // ✅ Check if profile user follows current user back (for canMessage)
    const theyFollowMe = user.following.some(
      f => f._id.toString() === req.user.id.toString()
    );

    // ✅ canMessage = I follow them OR they follow me (mutual connection)
    const canMessage = isFollowing || theyFollowMe;

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        profilePicture: user.profilePicture,
        bio: user.bio,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        isFollowing,
        canMessage, // ✅ Now included!
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

    if (username) {
      user.username = username.trim();
    }

    if (bio !== undefined) {
      user.bio = bio.trim();
    }

    if (avatarKey) {
      const CDN_BASE_URL =
        process.env.CDN_BASE_URL ||
        `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

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
   🔄 FOLLOW / UNFOLLOW
================================ */
exports.followUser = async (req, res) => {
  try {
    const me = await User.findById(req.user.id);
    const other = await User.findById(req.params.id);

    if (!me || !other) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isFollowing = me.following.includes(other._id);

    if (isFollowing) {
      me.following.pull(other._id);
      other.followers.pull(me._id);
    } else {
      me.following.push(other._id);
      other.followers.push(me._id);
    }

    await me.save();
    await other.save();

    return res.status(200).json({
      success: true,
      following: !isFollowing,
      followersCount: other.followers.length, // ✅ Include updated count
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
      .populate(type, 'username profilePicture')
      .select(type);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // ✅ Add isFollowing status to each user in the list
    const currentUser = await User.findById(req.user.id).select('following');
    const followingSet = new Set(
      currentUser.following.map(id => id.toString())
    );

    const listWithStatus = user[type].map(u => ({
      _id: u._id,
      username: u.username,
      profilePicture: u.profilePicture,
      isFollowing: followingSet.has(u._id.toString()),
    }));

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
      .select('username profilePicture')
      .limit(20);

    // All suggested users are NOT followed (by definition)
    const usersWithStatus = users.map(u => ({
      _id: u._id,
      username: u.username,
      profilePicture: u.profilePicture,
      isFollowing: false,
    }));

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
      .populate('followers', '_id username profilePicture')
      .populate('following', '_id');

    const followingSet = new Set(
      me.following.map(u => u._id.toString())
    );

    const mutuals = me.followers
      .filter(f => followingSet.has(f._id.toString()))
      .map(f => ({
        _id: f._id,
        username: f.username,
        profilePicture: f.profilePicture,
        isFollowing: true, // Mutuals are always following each other
      }));

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