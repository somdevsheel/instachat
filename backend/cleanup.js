/**
 * cleanup.js
 * 
 * Run this ONCE to clean your database before testing
 * 
 * Usage: node cleanup.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL;

async function cleanup() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected\n');

  const db = mongoose.connection.db;

  // 1. Delete all invalid device IDs from keys collection
  console.log('🧹 Cleaning keys collection...');
  const keysResult = await db.collection('keys').deleteMany({
    $or: [
      { deviceId: { $exists: false } },
      { deviceId: null },
      { $expr: { $ne: [{ $strLenCP: '$deviceId' }, 36] } }
    ]
  });
  console.log(`   Deleted ${keysResult.deletedCount} invalid keys\n`);

  // 2. Delete all old messages (without senderPublicKey)
  console.log('🧹 Cleaning messages collection...');
  const msgsResult = await db.collection('messages').deleteMany({
    'encryptedPayloads.senderPublicKey': { $exists: false }
  });
  console.log(`   Deleted ${msgsResult.deletedCount} old messages\n`);

  // 3. Show remaining counts
  const keysCount = await db.collection('keys').countDocuments();
  const msgsCount = await db.collection('messages').countDocuments();
  
  console.log('📊 Remaining:');
  console.log(`   Keys: ${keysCount}`);
  console.log(`   Messages: ${msgsCount}`);

  await mongoose.disconnect();
  console.log('\n✅ Done!');
}

cleanup().catch(e => {
  console.error('❌ Error:', e);
  process.exit(1);
});
