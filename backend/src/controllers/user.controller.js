const User = require('../models/user.model');

/**
 * CDN BASE URL
 * CloudFront preferred, S3 fallback
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

    const users = await User.find({
      username: { $regex: q, $options: 'i' },
      _id: { $ne: req.user.id },
    }).select('username profilePicture followers');

    return res.status(200).json({ success: true, data: users });
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

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        profilePicture: user.profilePicture,
        bio: user.bio,
        followersCount: user.followers.length,
        followingCount: user.following.length,
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
   ✏️ UPDATE PROFILE (AWS + CDN CORRECT)
================================ */
// exports.updateUserProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     const { username, bio, avatarKey } = req.body;

//     if (username) {
//       user.username = username.trim();
//     }

//     if (bio !== undefined) {
//       user.bio = bio.trim();
//     }

//     /**
//      * ✅ PROFILE IMAGE (AWS PRESIGNED FLOW)
//      * avatarKey is provided AFTER successful S3 upload
//      */
//     if (avatarKey) {
//       user.profilePicture = `${CDN_BASE_URL}/${avatarKey}`;
//     }

//     await user.save();

//     /**
//      * ✅ RETURN FULL USER OBJECT
//      * Prevents logout on refresh
//      */
//     return res.status(200).json({
//       success: true,
//       data: {
//         _id: user._id,
//         username: user.username,
//         email: user.email,
//         profilePicture: user.profilePicture,
//         bio: user.bio,
//         followersCount: user.followers.length,
//         followingCount: user.following.length,
//       },
//     });
//   } catch (err) {
//     console.error('Update profile error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Profile update failed',
//     });
//   }
// };



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

    // Text fields
    if (username) {
      user.username = username.trim();
    }

    if (bio !== undefined) {
      user.bio = bio.trim();
    }

    /**
     * ✅ PRESIGNED AVATAR FLOW (REQUIRED)
     * avatarKey comes ONLY after successful S3 upload
     */
    if (avatarKey) {
      const CDN_BASE_URL =
        process.env.CDN_BASE_URL ||
        `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

      const newUrl = `${CDN_BASE_URL}/${avatarKey}`;

      // Optional safety: avoid useless writes
      if (user.profilePicture !== newUrl) {
        user.profilePicture = newUrl;
      }
    }

    await user.save();

    /**
     * ✅ Return full user slice (prevents logout on refresh)
     */
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
   🔁 FOLLOW / UNFOLLOW
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

    return res.status(200).json({
      success: true,
      data: user[type],
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
    }).select('username profilePicture');

    return res.status(200).json({
      success: true,
      data: users,
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

    const mutuals = me.followers.filter(f =>
      followingSet.has(f._id.toString())
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
