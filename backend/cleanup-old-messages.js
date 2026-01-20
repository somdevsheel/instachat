/**
 * =========================================
 * CLEANUP OLD MESSAGES - Database Migration
 * =========================================
 * 
 * Deletes messages created before multi-device E2EE fix
 * 
 * Usage:
 *   node cleanup-old-messages.js
 */

const mongoose = require('mongoose');

// Your MongoDB connection string
const MONGODB_URI = 'mongodb+srv://instachat:Ses!fm123@arutechforms.bxwk6.mongodb.net/?appName=arutechForms';

// Define Message schema inline (no need to import)
const messageSchema = new mongoose.Schema({
  chat: mongoose.Schema.Types.ObjectId,
  sender: mongoose.Schema.Types.ObjectId,
  receiver: mongoose.Schema.Types.ObjectId,
  encryptedPayloads: Array,
  cipherText: String,
  nonce: String,
  type: String,
  readBy: Array,
  deletedForEveryone: Boolean,
  deletedAt: Date,
  deletedFor: Array,
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);

async function cleanupOldMessages() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Count old messages first
    const oldMessagesCount = await Message.countDocuments({
      encryptedPayloads: { $exists: false }
    });

    console.log(`📊 Found ${oldMessagesCount} old messages (before multi-device fix)`);

    // Count new messages
    const newMessagesCount = await Message.countDocuments({
      encryptedPayloads: { $exists: true }
    });

    console.log(`📊 Found ${newMessagesCount} new messages (multi-device format)`);
    console.log(`📊 Total messages: ${oldMessagesCount + newMessagesCount}\n`);

    if (oldMessagesCount === 0) {
      console.log('✅ No old messages to clean up!');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Show sample of what will be deleted
    const sampleOldMessage = await Message.findOne({
      encryptedPayloads: { $exists: false }
    }).select('createdAt sender receiver').lean();

    if (sampleOldMessage) {
      console.log('📄 Sample old message to be deleted:');
      console.log(`   Created: ${sampleOldMessage.createdAt}`);
      console.log(`   Sender: ${sampleOldMessage.sender}`);
      console.log(`   Receiver: ${sampleOldMessage.receiver}\n`);
    }

    // Countdown
    console.log('⚠️  This will DELETE all old messages that cannot be decrypted.');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

    for (let i = 5; i > 0; i--) {
      process.stdout.write(`   ${i}... `);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log('\n');

    // DELETE old messages
    console.log('🗑️  Deleting old messages...');
    const deleteResult = await Message.deleteMany({
      encryptedPayloads: { $exists: false }
    });

    console.log(`✅ Deleted ${deleteResult.deletedCount} old messages\n`);

    // Count remaining messages
    const remainingCount = await Message.countDocuments();
    console.log(`📊 Remaining messages in database: ${remainingCount}`);

    console.log('\n✅ Cleanup complete!');
    console.log('💡 All new messages will use multi-device E2EE format\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run
cleanupOldMessages();