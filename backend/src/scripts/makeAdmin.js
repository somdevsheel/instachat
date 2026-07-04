/**
 * ======================================================
 * MAKE ADMIN SCRIPT
 * ======================================================
 * Run this from your backend project root:
 *   node src/scripts/makeAdmin.js your-email@example.com
 * 
 * Or with username:
 *   node src/scripts/makeAdmin.js --username yourusername
 * ======================================================
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user.model');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;

async function makeAdmin() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('');
    console.log('Usage:');
    console.log('  node src/scripts/makeAdmin.js <email>');
    console.log('  node src/scripts/makeAdmin.js --username <username>');
    console.log('');
    console.log('Examples:');
    console.log('  node src/scripts/makeAdmin.js admin@instachat.com');
    console.log('  node src/scripts/makeAdmin.js --username somdev');
    console.log('');
    process.exit(1);
  }

  // Parse arguments
  let filter = {};
  if (args[0] === '--username') {
    if (!args[1]) {
      console.error('❌ Please provide a username');
      process.exit(1);
    }
    filter = { username: args[1].toLowerCase() };
  } else {
    filter = { email: args[0].toLowerCase() };
  }

  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected\n');

    // Find the user
    const user = await User.findOne(filter).select('name username email role');

    if (!user) {
      console.error('❌ User not found with:', filter);
      process.exit(1);
    }

    console.log('👤 Found user:');
    console.log(`   Name:     ${user.name}`);
    console.log(`   Username: @${user.username}`);
    console.log(`   Email:    ${user.email}`);
    console.log(`   Role:     ${user.role || 'user'}`);
    console.log('');

    if (user.role === 'superadmin') {
      console.log('ℹ️  This user is already a superadmin!');
      process.exit(0);
    }

    // Update to superadmin
    await User.findByIdAndUpdate(user._id, { role: 'superadmin' });

    console.log('✅ Successfully promoted to SUPERADMIN!');
    console.log('');
    console.log('🔑 You can now login to the admin panel at:');
    console.log('   http://localhost:5173');
    console.log('   Use your normal email & password to login.');
    console.log('');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

makeAdmin();