/**
 * One-off migration: rewrites stored media URLs from a dead CloudFront
 * domain to the current CDN_BASE_URL. URLs are baked in at write time
 * (not recomputed on read), so changing CDN_BASE_URL alone doesn't fix
 * existing records — this does.
 *
 * Usage:
 *   node src/scripts/fixMediaDomain.js <old-domain> [new-domain]
 *   node src/scripts/fixMediaDomain.js d3c0e9xew1opgc.cloudfront.net
 *   (new-domain defaults to CDN_BASE_URL from .env)
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  const oldDomain = process.argv[2];
  const newBase = process.argv[3] || process.env.CDN_BASE_URL;

  if (!oldDomain || !newBase) {
    console.error('Usage: node src/scripts/fixMediaDomain.js <old-domain> [new-base-url]');
    process.exit(1);
  }

  const newDomain = newBase.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const oldDomainClean = oldDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');

  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Rewriting https://${oldDomainClean} -> https://${newDomain}\n`);

  const Post = require('../models/Post');
  const Story = require('../models/Story');
  const Reel = require('../models/Reel');

  const replace = (url) =>
    url ? url.replace(`https://${oldDomainClean}`, `https://${newDomain}`) : url;

  // Posts: media.variants.original / media.variants.thumbnail
  const posts = await Post.find({
    $or: [
      { 'media.variants.original': { $regex: oldDomainClean } },
      { 'media.variants.thumbnail': { $regex: oldDomainClean } },
    ],
  });
  for (const post of posts) {
    post.media.variants.original = replace(post.media.variants.original);
    post.media.variants.thumbnail = replace(post.media.variants.thumbnail);
    await post.save();
  }
  console.log(`Posts updated: ${posts.length}`);

  // Stories: media.url
  const stories = await Story.find({ 'media.url': { $regex: oldDomainClean } });
  for (const story of stories) {
    story.media.url = replace(story.media.url);
    await story.save();
  }
  console.log(`Stories updated: ${stories.length}`);

  // Reels: videoUrl / thumbnailUrl
  const reels = await Reel.find({
    $or: [
      { videoUrl: { $regex: oldDomainClean } },
      { thumbnailUrl: { $regex: oldDomainClean } },
    ],
  });
  for (const reel of reels) {
    reel.videoUrl = replace(reel.videoUrl);
    reel.thumbnailUrl = replace(reel.thumbnailUrl);
    await reel.save();
  }
  console.log(`Reels updated: ${reels.length}`);

  await mongoose.disconnect();
  console.log('\nDone.');
}

run().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
