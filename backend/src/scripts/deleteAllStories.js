const mongoose = require('mongoose');
const Story = require('../models/Story');
require('dotenv').config();

async function deleteAllStories() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const result = await Story.deleteMany({});
    console.log(`🗑️  Deleted ${result.deletedCount} stories`);

    await mongoose.connection.close();
    console.log('✅ Done');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

deleteAllStories();