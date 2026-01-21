/**
 * cleanup-malformed-keys.js
 * 
 * Location: backend/cleanup-malformed-keys.js
 * 
 * One-time script to clean up all malformed device IDs from the database.
 * 
 * USAGE:
 *   node cleanup-malformed-keys.js
 * 
 * This will:
 * 1. Find all keys with deviceId != 36 characters
 * 2. Display them for review
 * 3. Delete them (after confirmation)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in environment variables');
  process.exit(1);
}

// Key Schema (minimal)
const keySchema = new mongoose.Schema({
  user: mongoose.Schema.Types.ObjectId,
  deviceId: String,
  identityPublicKey: String,
}, { timestamps: true });

const Key = mongoose.model('Key', keySchema);

// Helper to ask for confirmation
const askQuestion = (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.toLowerCase());
    });
  });
};

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🧹 E2EE KEY CLEANUP SCRIPT');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Connect to database
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected\n');

    // Find all keys
    const allKeys = await Key.find({});
    console.log(`📊 Total keys in database: ${allKeys.length}\n`);

    // Categorize keys
    const validKeys = allKeys.filter(k => k.deviceId?.length === 36);
    const malformedKeys = allKeys.filter(k => k.deviceId?.length !== 36);

    console.log(`✅ Valid keys (36 chars): ${validKeys.length}`);
    console.log(`❌ Malformed keys: ${malformedKeys.length}\n`);

    if (malformedKeys.length === 0) {
      console.log('🎉 No malformed keys found! Database is clean.\n');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Show malformed keys
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  MALFORMED KEYS TO DELETE:');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Group by user
    const byUser = {};
    malformedKeys.forEach(k => {
      const userId = k.user?.toString() || 'unknown';
      if (!byUser[userId]) byUser[userId] = [];
      byUser[userId].push(k);
    });

    Object.entries(byUser).forEach(([userId, keys]) => {
      console.log(`User: ${userId}`);
      keys.forEach(k => {
        console.log(`  - deviceId: "${k.deviceId}" (${k.deviceId?.length || 0} chars)`);
      });
      console.log('');
    });

    // Ask for confirmation
    const answer = await askQuestion('⚠️  Delete these malformed keys? (yes/no): ');

    if (answer !== 'yes' && answer !== 'y') {
      console.log('\n❌ Aborted. No changes made.\n');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Delete malformed keys
    console.log('\n🗑️  Deleting malformed keys...');
    
    const result = await Key.deleteMany({
      $expr: { $ne: [{ $strLenCP: '$deviceId' }, 36] }
    });

    console.log(`✅ Deleted ${result.deletedCount} malformed keys\n`);

    // Verify
    const remaining = await Key.find({});
    const stillMalformed = remaining.filter(k => k.deviceId?.length !== 36);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('  CLEANUP COMPLETE');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Total keys remaining: ${remaining.length}`);
    console.log(`  Valid keys: ${remaining.length - stillMalformed.length}`);
    console.log(`  Still malformed: ${stillMalformed.length}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    if (stillMalformed.length > 0) {
      console.warn('⚠️  Some malformed keys could not be deleted. Check manually.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB\n');
  }
}

main();
