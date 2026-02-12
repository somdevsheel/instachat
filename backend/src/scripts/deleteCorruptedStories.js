const mongoose = require('mongoose');
const Story = require('../models/Story');
const axios = require('axios');
require('dotenv').config();

/**
 * Script to delete corrupted stories
 * Run with: node src/scripts/deleteCorruptedStories.js
 */

const CDN_BASE_URL = process.env.CDN_BASE_URL || 
  `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

async function checkMediaUrl(url) {
  try {
    const response = await axios.head(url, { timeout: 5000 });
    const contentType = response.headers['content-type'];
    
    console.log(`✓ ${url} - ${contentType}`);
    
    // Check if content type is valid
    if (contentType.includes('image') || contentType.includes('video')) {
      return true;
    }
    
    console.log(`❌ Invalid content type: ${contentType}`);
    return false;
  } catch (err) {
    console.log(`❌ Failed to fetch: ${url} - ${err.message}`);
    return false;
  }
}

async function deleteCorruptedStories() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all stories
    const stories = await Story.find({}).populate('user', 'username');
    console.log(`📊 Found ${stories.length} stories\n`);

    if (stories.length === 0) {
      console.log('No stories to check');
      process.exit(0);
    }

    const corruptedStories = [];
    const validStories = [];

    // Check each story
    for (const story of stories) {
      const mediaUrl = story.media?.url;
      const username = story.user?.username || 'Unknown';
      const createdAt = new Date(story.createdAt).toLocaleString();
      
      console.log(`\n📝 Checking story by ${username} (${createdAt})`);
      console.log(`   Type: ${story.media?.type}`);
      console.log(`   URL: ${mediaUrl}`);

      if (!mediaUrl) {
        console.log('   ❌ No media URL');
        corruptedStories.push(story);
        continue;
      }

      const isValid = await checkMediaUrl(mediaUrl);
      
      if (!isValid) {
        console.log('   ❌ CORRUPTED - Will be deleted');
        corruptedStories.push(story);
      } else {
        console.log('   ✅ Valid');
        validStories.push(story);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY:');
    console.log(`   Total stories: ${stories.length}`);
    console.log(`   ✅ Valid: ${validStories.length}`);
    console.log(`   ❌ Corrupted: ${corruptedStories.length}`);
    console.log('='.repeat(60) + '\n');

    if (corruptedStories.length === 0) {
      console.log('🎉 No corrupted stories found!');
      await mongoose.connection.close();
      process.exit(0);
    }

    // List corrupted stories
    console.log('🗑️  Corrupted stories to delete:');
    corruptedStories.forEach((story, index) => {
      console.log(`   ${index + 1}. ${story.user?.username} - ${story.media?.type} (${story._id})`);
    });

    console.log('\n⚠️  Deleting corrupted stories in 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Delete corrupted stories
    const storyIds = corruptedStories.map(s => s._id);
    const result = await Story.deleteMany({ _id: { $in: storyIds } });

    console.log(`\n✅ Deleted ${result.deletedCount} corrupted stories`);

    // Close connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Handle Ctrl+C
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Script interrupted');
  await mongoose.connection.close();
  process.exit(0);
});

// Run the script
deleteCorruptedStories();