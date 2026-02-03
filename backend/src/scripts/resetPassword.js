const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../src/models/user.model');

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const userId = '696e051b48033304d96387d8'; // your user ID
    const newPlainPassword = 'S09@somdev';

    const hashed = await bcrypt.hash(newPlainPassword, 10);

    await User.updateOne(
      { _id: userId },
      {
        $set: {
          password: hashed,
          passwordChangedAt: new Date(),
        },
      }
    );

    console.log('✅ Password reset successfully');
    console.log('👉 New password:', newPlainPassword);

    process.exit(0);
  } catch (err) {
    console.error('❌ Reset failed:', err);
    process.exit(1);
  }
}

resetPassword();
