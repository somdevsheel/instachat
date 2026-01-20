const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const Post = require('../models/Post');

/* =========================
   HELPERS
========================= */
const signToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

/* =========================
   REGISTER
========================= */
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Password hashing handled in user.model pre-save hook
    const user = await User.create({
      username,
      email,
      password,
    });

    const token = signToken(user._id);
    user.password = undefined;

    res.status(201).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/* =========================
   LOGIN
========================= */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = signToken(user._id);
    user.password = undefined;

    res.status(200).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/* =========================
   GET CURRENT USER (PROFILE)
========================= */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('followers', '_id')
      .populate('following', '_id');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // ✅ Only this user's posts (profile screen)
    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .select('_id media createdAt');

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,

        followersCount: user.followers.length,
        followingCount: user.following.length,

        postsCount: posts.length,
        posts,
      },
    });
  } catch (err) {
    console.error('Get Me Error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
