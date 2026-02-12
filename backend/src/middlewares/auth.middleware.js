const jwt = require('jsonwebtoken');
const User = require('../models/user.model');



exports.protect = async (req, res, next) => {
  try {
    console.log('🛑 AUTH HIT:', req.method, req.originalUrl);

    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer')) {
      console.log('❌ No Authorization header');
      return res.status(401).json({ message: 'No token' });
    }

    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log('✅ Token decoded:', decoded);

    const user = await User.findById(decoded.id).select('-password');

    console.log('👤 User found:', !!user);
    console.log('⏱ passwordChangedAt:', user?.passwordChangedAt);

    req.user = user;
    next();
  } catch (err) {
    console.error('🔥 AUTH ERROR:', err.message);
    return res.status(401).json({ message: 'Auth failed' });
  }
};
