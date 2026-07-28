/**
 * One-time migration: copies comments that were embedded directly on
 * Post documents (Post.comments[]) into the standalone Comment
 * collection, which is what addComment/getComments now read from.
 *
 * Safe to re-run — skips any post that already has at least one Comment
 * document, on the assumption this migration runs once before the new
 * system creates any comments of its own. The embedded array on Post is
 * left untouched as a backup; nothing reads from it after this runs.
 *
 * Usage: node src/scripts/migratePostComments.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const posts = await Post.find({ 'comments.0': { $exists: true } }).select(
    'comments'
  );

  let migrated = 0;
  let skippedPosts = 0;

  for (const post of posts) {
    const alreadyHasComments = await Comment.exists({ post: post._id });
    if (alreadyHasComments) {
      skippedPosts += 1;
      continue;
    }

    const docs = post.comments.map((c) => ({
      user: c.user,
      post: post._id,
      content: c.text,
      createdAt: c.createdAt,
    }));

    await Comment.insertMany(docs);
    migrated += docs.length;
  }

  console.log(`Migrated ${migrated} comment(s) across ${posts.length - skippedPosts} post(s), skipped ${skippedPosts} already-migrated post(s).`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
