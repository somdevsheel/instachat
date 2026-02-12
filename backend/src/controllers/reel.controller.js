// const Reel = require('../models/reel.model');
// const catchAsync = require('../utils/catchAsync');

// /**
//  * GET /api/v1/reels/feed
//  */
// exports.getReels = catchAsync(async (req, res) => {
//   const reels = await Reel.find()
//     .populate('user', 'username profilePicture')
//     .sort({ createdAt: -1 });

//   res.status(200).json({
//     success: true,
//     data: reels,
//   });
// });

// /**
//  * POST /api/v1/reels
//  */
// exports.createReel = catchAsync(async (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({
//       success: false,
//       message: 'Video file required',
//     });
//   }

//   const reel = await Reel.create({
//     user: req.user.id,
//     videoUrl: req.file.location || req.file.path,
//     caption: req.body.caption || '',
//   });

//   res.status(201).json({
//     success: true,
//     data: reel,
//   });
// });

// /**
//  * GET /api/v1/reels/:reelId
//  */
// exports.getReel = catchAsync(async (req, res) => {
//   const reel = await Reel.findById(req.params.reelId)
//     .populate('user', 'username profilePicture');

//   if (!reel) {
//     return res.status(404).json({
//       success: false,
//       message: 'Reel not found',
//     });
//   }

//   res.status(200).json({
//     success: true,
//     data: reel,
//   });
// });





// const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
// const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
// const s3Client = require('../config/s3Client');
// const catchAsync = require('../utils/catchAsync');

// /**
//  * ⚠️ IMPORTANT: Update the import path based on your model filename
//  * If using Reel.js:       const Reel = require('../models/Reel');
//  * If using reel.model.js: const Reel = require('../models/reel.model');
//  */
// const Reel = require('../models/Reel');

// /**
//  * ======================================================
//  * CDN BASE URL (SAME AS POST CONTROLLER)
//  * Prefer CloudFront, fallback to S3 public URL
//  * ======================================================
//  */
// const CDN_BASE_URL =
//   process.env.CDN_BASE_URL ||
//   `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

// /**
//  * ======================================================
//  * GET PRESIGNED URL FOR REEL UPLOAD
//  * POST /api/v1/reels/presign
//  * ======================================================
//  */
// exports.getPresignedUrl = catchAsync(async (req, res) => {
//   const { mimeType, fileSizeMB } = req.body;
//   const userId = req.user.id;

//   console.log('🎬 Reel presign request:', { mimeType, fileSizeMB, userId });

//   /* =========================
//      VALIDATION
//   ========================= */
//   if (!mimeType) {
//     return res.status(400).json({
//       success: false,
//       message: 'mimeType is required',
//     });
//   }

//   // Only allow video types
//   const allowedMimeTypes = ['video/mp4', 'video/quicktime', 'video/x-matroska'];
//   if (!allowedMimeTypes.includes(mimeType)) {
//     return res.status(400).json({
//       success: false,
//       message: 'Only MP4, MOV, and MKV videos are allowed',
//     });
//   }

//   // Max 100MB for reels
//   const MAX_REEL_MB = 100;
//   if (typeof fileSizeMB === 'number' && fileSizeMB > MAX_REEL_MB) {
//     return res.status(400).json({
//       success: false,
//       message: `Reel video must be under ${MAX_REEL_MB}MB`,
//     });
//   }

//   /* =========================
//      S3 KEY GENERATION
//   ========================= */
//   const timestamp = Date.now();
//   const randomId = Math.random().toString(36).slice(2);
//   const extension = mimeType.split('/')[1] || 'mp4';

//   const key = `users/${userId}/reels/${timestamp}-${randomId}.${extension}`;

//   console.log('🔑 Generated S3 key:', key);

//   /* =========================
//      PRESIGN URL
//   ========================= */
//   const command = new PutObjectCommand({
//     Bucket: process.env.AWS_BUCKET_NAME,
//     Key: key,
//     ContentType: mimeType,
//     CacheControl: 'public, max-age=86400',
//   });

//   const uploadUrl = await getSignedUrl(s3Client, command, {
//     expiresIn: 900, // 15 minutes for larger files
//   });

//   console.log('✅ Presigned URL generated for reel');

//   res.status(200).json({
//     success: true,
//     data: {
//       uploadUrl,
//       key,
//       expiresIn: 900,
//     },
//   });
// });

// /**
//  * ======================================================
//  * CREATE REEL (AFTER PRESIGNED UPLOAD)
//  * POST /api/v1/reels
//  * ======================================================
//  */
// exports.createReel = catchAsync(async (req, res) => {
//   const { videoKey, caption, duration, thumbnailUrl } = req.body;
//   const userId = req.user.id;

//   console.log('🎬 Creating reel:', { videoKey, caption, userId });

//   if (!videoKey) {
//     return res.status(400).json({
//       success: false,
//       message: 'videoKey is required',
//     });
//   }

//   // Construct video URL using CDN_BASE_URL (same as posts)
//   const videoUrl = `${CDN_BASE_URL}/${videoKey}`;

//   console.log('🎬 Video URL:', videoUrl);
//   console.log('🎬 CDN_BASE_URL:', CDN_BASE_URL);

//   const reel = await Reel.create({
//     user: userId,
//     videoKey,
//     videoUrl,
//     caption: caption || '',
//     duration: duration || 0,
//     thumbnailUrl: thumbnailUrl || '',
//   });

//   // Populate user info for response
//   await reel.populate('user', 'username profilePicture');

//   console.log('✅ Reel created:', {
//     id: reel._id,
//     videoUrl: reel.videoUrl,
//     user: reel.user?.username,
//   });

//   // Emit socket event for real-time feed update
//   const io = req.app.get('io');
//   if (io) {
//     io.emit('new_reel', reel);
//   }

//   res.status(201).json({
//     success: true,
//     data: reel,
//   });
// });

// /**
//  * ======================================================
//  * GET REELS FEED
//  * GET /api/v1/reels/feed
//  * ======================================================
//  */
// exports.getReels = catchAsync(async (req, res) => {
//   const userId = req.user.id;
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;
//   const skip = (page - 1) * limit;

//   console.log('🎬 Fetching reels feed:', { userId, page, limit });

//   // Find active reels (isActive: true OR isActive doesn't exist for backward compatibility)
//   const reels = await Reel.find({ 
//     $or: [
//       { isActive: true },
//       { isActive: { $exists: false } }
//     ]
//   })
//     .populate('user', 'username profilePicture')
//     .sort({ createdAt: -1 })
//     .skip(skip)
//     .limit(limit)
//     .lean();

//   console.log('🎬 Found reels:', reels.length);

//   // Helper to construct proper video URL
//   const getProperVideoUrl = (reel) => {
//     // If videoUrl is broken (starts with 'undefined' or S3 direct), use CDN
//     if (!reel.videoUrl || reel.videoUrl.startsWith('undefined') || reel.videoUrl.includes('.s3.')) {
//       if (reel.videoKey) {
//         return `${CDN_BASE_URL}/${reel.videoKey}`;
//       }
//     }
//     return reel.videoUrl;
//   };

//   // Add isLiked flag and fix broken URLs
//   const reelsWithLikeStatus = reels.map((reel) => {
//     const fixedUrl = getProperVideoUrl(reel);
//     // Remove videoKey from response (it's sensitive)
//     const { videoKey, ...reelWithoutKey } = reel;
//     return {
//       ...reelWithoutKey,
//       videoUrl: fixedUrl, // ✅ Fix broken URLs
//       isLiked: reel.likes?.some((id) => id.toString() === userId.toString()),
//     };
//   });

//   const totalReels = await Reel.countDocuments({ 
//     $or: [
//       { isActive: true },
//       { isActive: { $exists: false } }
//     ]
//   });

//   console.log('🎬 Returning reels:', {
//     count: reelsWithLikeStatus.length,
//     totalReels,
//     firstReel: reelsWithLikeStatus[0] ? {
//       id: reelsWithLikeStatus[0]._id,
//       videoUrl: reelsWithLikeStatus[0].videoUrl,
//     } : null,
//   });

//   res.status(200).json({
//     success: true,
//     data: reelsWithLikeStatus,
//     pagination: {
//       page,
//       limit,
//       totalPages: Math.ceil(totalReels / limit),
//       totalReels,
//     },
//   });
// });

// /**
//  * ======================================================
//  * GET SINGLE REEL
//  * GET /api/v1/reels/:reelId
//  * ======================================================
//  */
// exports.getReel = catchAsync(async (req, res) => {
//   const userId = req.user.id;
//   const reel = await Reel.findById(req.params.reelId)
//     .populate('user', 'username profilePicture')
//     .lean();

//   if (!reel) {
//     return res.status(404).json({
//       success: false,
//       message: 'Reel not found',
//     });
//   }

//   // Fix broken videoUrl
//   if (!reel.videoUrl || reel.videoUrl.startsWith('undefined') || reel.videoUrl.includes('.s3.')) {
//     if (reel.videoKey) {
//       reel.videoUrl = `${CDN_BASE_URL}/${reel.videoKey}`;
//     }
//   }

//   // Add isLiked flag
//   reel.isLiked = reel.likes?.some((id) => id.toString() === userId.toString());

//   res.status(200).json({
//     success: true,
//     data: reel,
//   });
// });

// /**
//  * ======================================================
//  * GET USER'S REELS
//  * GET /api/v1/reels/user/:userId
//  * ======================================================
//  */
// exports.getUserReels = catchAsync(async (req, res) => {
//   const targetUserId = req.params.userId;
//   const currentUserId = req.user.id;

//   const reels = await Reel.find({ 
//     user: targetUserId,
//     $or: [
//       { isActive: true },
//       { isActive: { $exists: false } }
//     ]
//   })
//     .populate('user', 'username profilePicture')
//     .sort({ createdAt: -1 })
//     .lean();

//   const reelsWithLikeStatus = reels.map((reel) => {
//     // Fix broken videoUrl
//     let fixedVideoUrl = reel.videoUrl;
//     if (!reel.videoUrl || reel.videoUrl.startsWith('undefined') || reel.videoUrl.includes('.s3.')) {
//       if (reel.videoKey) {
//         fixedVideoUrl = `${CDN_BASE_URL}/${reel.videoKey}`;
//       }
//     }
    
//     return {
//       ...reel,
//       videoUrl: fixedVideoUrl,
//       isLiked: reel.likes?.some((id) => id.toString() === currentUserId.toString()),
//     };
//   });

//   res.status(200).json({
//     success: true,
//     data: reelsWithLikeStatus,
//   });
// });

// /**
//  * ======================================================
//  * LIKE / UNLIKE REEL
//  * PUT /api/v1/reels/:reelId/like
//  * ======================================================
//  */
// exports.toggleLike = catchAsync(async (req, res) => {
//   const { reelId } = req.params;
//   const userId = req.user.id;

//   const reel = await Reel.findById(reelId);

//   if (!reel) {
//     return res.status(404).json({
//       success: false,
//       message: 'Reel not found',
//     });
//   }

//   const isLiked = reel.likes.includes(userId);

//   if (isLiked) {
//     // Unlike
//     await Reel.findByIdAndUpdate(reelId, {
//       $pull: { likes: userId },
//       $inc: { likesCount: -1 },
//     });

//     // Emit socket event
//     const io = req.app.get('io');
//     if (io) {
//       io.emit('reel_like_updated', {
//         reelId,
//         userId,
//         liked: false,
//         likesCount: reel.likesCount - 1,
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: {
//         liked: false,
//         likesCount: reel.likesCount - 1,
//       },
//     });
//   } else {
//     // Like
//     await Reel.findByIdAndUpdate(reelId, {
//       $push: { likes: userId },
//       $inc: { likesCount: 1 },
//     });

//     // Emit socket event
//     const io = req.app.get('io');
//     if (io) {
//       io.emit('reel_like_updated', {
//         reelId,
//         userId,
//         liked: true,
//         likesCount: reel.likesCount + 1,
//       });

//       // Send notification to reel owner
//       if (reel.user.toString() !== userId.toString()) {
//         io.to(reel.user.toString()).emit('notification', {
//           type: 'REEL_LIKE',
//           from: userId,
//           reelId,
//           text: 'liked your reel',
//         });
//       }
//     }

//     return res.status(200).json({
//       success: true,
//       data: {
//         liked: true,
//         likesCount: reel.likesCount + 1,
//       },
//     });
//   }
// });

// /**
//  * ======================================================
//  * INCREMENT VIEW COUNT
//  * PUT /api/v1/reels/:reelId/view
//  * ======================================================
//  */
// exports.incrementView = catchAsync(async (req, res) => {
//   const { reelId } = req.params;

//   const reel = await Reel.findByIdAndUpdate(
//     reelId,
//     { $inc: { viewsCount: 1 } },
//     { new: true }
//   );

//   if (!reel) {
//     return res.status(404).json({
//       success: false,
//       message: 'Reel not found',
//     });
//   }

//   res.status(200).json({
//     success: true,
//     data: {
//       viewsCount: reel.viewsCount,
//     },
//   });
// });

// /**
//  * ======================================================
//  * DELETE REEL (OWNER ONLY)
//  * DELETE /api/v1/reels/:reelId
//  * ======================================================
//  */
// exports.deleteReel = catchAsync(async (req, res) => {
//   const { reelId } = req.params;
//   const userId = req.user.id;

//   const reel = await Reel.findById(reelId).select('+videoKey');

//   if (!reel) {
//     return res.status(404).json({
//       success: false,
//       message: 'Reel not found',
//     });
//   }

//   if (reel.user.toString() !== userId.toString()) {
//     return res.status(403).json({
//       success: false,
//       message: 'Not authorized to delete this reel',
//     });
//   }

//   // Delete video from S3
//   if (reel.videoKey) {
//     try {
//       const deleteCommand = new DeleteObjectCommand({
//         Bucket: process.env.AWS_BUCKET_NAME,
//         Key: reel.videoKey,
//       });
//       await s3Client.send(deleteCommand);
//       console.log('🗑️ Deleted video from S3:', reel.videoKey);
//     } catch (err) {
//       console.error('⚠️ Failed to delete video from S3:', err);
//       // Continue with DB deletion even if S3 fails
//     }
//   }

//   await reel.deleteOne();

//   // Emit socket event
//   const io = req.app.get('io');
//   if (io) {
//     io.emit('reel_deleted', { reelId });
//   }

//   console.log('✅ Reel deleted:', reelId);

//   res.status(200).json({
//     success: true,
//     message: 'Reel deleted successfully',
//   });
// });




// const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
// const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
// const s3Client = require('../config/s3Client');
// const catchAsync = require('../utils/catchAsync');

// /**
//  * ⚠️ IMPORTANT: Update the import path based on your model filename
//  * If using Reel.js:       const Reel = require('../models/Reel');
//  * If using reel.model.js: const Reel = require('../models/reel.model');
//  */
// const Reel = require('../models/Reel');

// /**
//  * ======================================================
//  * CDN BASE URL (SAME AS POST CONTROLLER)
//  * Prefer CloudFront, fallback to S3 public URL
//  * ======================================================
//  */
// const CDN_BASE_URL =
//   process.env.CDN_BASE_URL ||
//   `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

// /**
//  * ======================================================
//  * GET PRESIGNED URL FOR REEL UPLOAD
//  * POST /api/v1/reels/presign
//  * ======================================================
//  */
// exports.getPresignedUrl = catchAsync(async (req, res) => {
//   const { mimeType, fileSizeMB } = req.body;
//   const userId = req.user.id;

//   console.log('🎬 Reel presign request:', { mimeType, fileSizeMB, userId });

//   /* =========================
//      VALIDATION
//   ========================= */
//   if (!mimeType) {
//     return res.status(400).json({
//       success: false,
//       message: 'mimeType is required',
//     });
//   }

//   // Only allow video types
//   const allowedMimeTypes = ['video/mp4', 'video/quicktime', 'video/x-matroska'];
//   if (!allowedMimeTypes.includes(mimeType)) {
//     return res.status(400).json({
//       success: false,
//       message: 'Only MP4, MOV, and MKV videos are allowed',
//     });
//   }

//   // Max 100MB for reels
//   const MAX_REEL_MB = 100;
//   if (typeof fileSizeMB === 'number' && fileSizeMB > MAX_REEL_MB) {
//     return res.status(400).json({
//       success: false,
//       message: `Reel video must be under ${MAX_REEL_MB}MB`,
//     });
//   }

//   /* =========================
//      S3 KEY GENERATION
//   ========================= */
//   const timestamp = Date.now();
//   const randomId = Math.random().toString(36).slice(2);
//   const extension = mimeType.split('/')[1] || 'mp4';

//   const key = `users/${userId}/reels/${timestamp}-${randomId}.${extension}`;

//   console.log('🔑 Generated S3 key:', key);

//   /* =========================
//      PRESIGN URL
//   ========================= */
//   const command = new PutObjectCommand({
//     Bucket: process.env.AWS_BUCKET_NAME,
//     Key: key,
//     ContentType: mimeType,
//     CacheControl: 'public, max-age=86400',
//   });

//   const uploadUrl = await getSignedUrl(s3Client, command, {
//     expiresIn: 900, // 15 minutes for larger files
//   });

//   console.log('✅ Presigned URL generated for reel');

//   res.status(200).json({
//     success: true,
//     data: {
//       uploadUrl,
//       key,
//       expiresIn: 900,
//     },
//   });
// });

// /**
//  * ======================================================
//  * CREATE REEL (AFTER PRESIGNED UPLOAD)
//  * POST /api/v1/reels
//  * ======================================================
//  */
// exports.createReel = catchAsync(async (req, res) => {
//   const { videoKey, caption, duration, thumbnailUrl } = req.body;
//   const userId = req.user.id;

//   console.log('🎬 Creating reel:', { videoKey, caption, userId });

//   if (!videoKey) {
//     return res.status(400).json({
//       success: false,
//       message: 'videoKey is required',
//     });
//   }

//   // Construct video URL using CDN_BASE_URL (same as posts)
//   const videoUrl = `${CDN_BASE_URL}/${videoKey}`;

//   console.log('🎬 Video URL:', videoUrl);
//   console.log('🎬 CDN_BASE_URL:', CDN_BASE_URL);

//   const reel = await Reel.create({
//     user: userId,
//     videoKey,
//     videoUrl,
//     caption: caption || '',
//     duration: duration || 0,
//     thumbnailUrl: thumbnailUrl || '',
//   });

//   // Populate user info for response
//   await reel.populate('user', 'username profilePicture');

//   console.log('✅ Reel created:', {
//     id: reel._id,
//     videoUrl: reel.videoUrl,
//     user: reel.user?.username,
//   });

//   // Emit socket event for real-time feed update
//   const io = req.app.get('io');
//   if (io) {
//     io.emit('new_reel', reel);
//   }

//   res.status(201).json({
//     success: true,
//     data: reel,
//   });
// });

// /**
//  * ======================================================
//  * GET REELS FEED
//  * GET /api/v1/reels/feed
//  * ======================================================
//  */
// exports.getReels = catchAsync(async (req, res) => {
//   const userId = req.user.id;
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;
//   const skip = (page - 1) * limit;

//   console.log('🎬 Fetching reels feed:', { userId, page, limit });

//   // Find active reels (isActive: true OR isActive doesn't exist for backward compatibility)
//   const reels = await Reel.find({ 
//     $or: [
//       { isActive: true },
//       { isActive: { $exists: false } }
//     ]
//   })
//     .populate('user', 'username profilePicture')
//     .sort({ createdAt: -1 })
//     .skip(skip)
//     .limit(limit)
//     .lean();

//   console.log('🎬 Found reels:', reels.length);

//   // Helper to construct proper video URL
//   const getProperVideoUrl = (reel) => {
//     // If videoUrl is broken (starts with 'undefined' or S3 direct), use CDN
//     if (!reel.videoUrl || reel.videoUrl.startsWith('undefined') || reel.videoUrl.includes('.s3.')) {
//       if (reel.videoKey) {
//         return `${CDN_BASE_URL}/${reel.videoKey}`;
//       }
//     }
//     return reel.videoUrl;
//   };

//   // Add isLiked flag and fix broken URLs
//   const reelsWithLikeStatus = reels.map((reel) => {
//     const fixedUrl = getProperVideoUrl(reel);
//     // Remove videoKey from response (it's sensitive)
//     const { videoKey, ...reelWithoutKey } = reel;
//     return {
//       ...reelWithoutKey,
//       videoUrl: fixedUrl, // ✅ Fix broken URLs
//       isLiked: reel.likes?.some((id) => id.toString() === userId.toString()),
//     };
//   });

//   const totalReels = await Reel.countDocuments({ 
//     $or: [
//       { isActive: true },
//       { isActive: { $exists: false } }
//     ]
//   });

//   console.log('🎬 Returning reels:', {
//     count: reelsWithLikeStatus.length,
//     totalReels,
//     firstReel: reelsWithLikeStatus[0] ? {
//       id: reelsWithLikeStatus[0]._id,
//       videoUrl: reelsWithLikeStatus[0].videoUrl,
//     } : null,
//   });

//   res.status(200).json({
//     success: true,
//     data: reelsWithLikeStatus,
//     pagination: {
//       page,
//       limit,
//       totalPages: Math.ceil(totalReels / limit),
//       totalReels,
//     },
//   });
// });

// /**
//  * ======================================================
//  * GET SINGLE REEL
//  * GET /api/v1/reels/:reelId
//  * ======================================================
//  */
// exports.getReel = catchAsync(async (req, res) => {
//   const userId = req.user.id;
//   const reel = await Reel.findById(req.params.reelId)
//     .populate('user', 'username profilePicture')
//     .lean();

//   if (!reel) {
//     return res.status(404).json({
//       success: false,
//       message: 'Reel not found',
//     });
//   }

//   // Fix broken videoUrl
//   if (!reel.videoUrl || reel.videoUrl.startsWith('undefined') || reel.videoUrl.includes('.s3.')) {
//     if (reel.videoKey) {
//       reel.videoUrl = `${CDN_BASE_URL}/${reel.videoKey}`;
//     }
//   }

//   // Add isLiked flag
//   reel.isLiked = reel.likes?.some((id) => id.toString() === userId.toString());

//   res.status(200).json({
//     success: true,
//     data: reel,
//   });
// });

// /**
//  * ======================================================
//  * GET USER'S REELS
//  * GET /api/v1/reels/user/:userId
//  * ======================================================
//  */
// exports.getUserReels = catchAsync(async (req, res) => {
//   const targetUserId = req.params.userId;
//   const currentUserId = req.user.id;

//   const reels = await Reel.find({ 
//     user: targetUserId,
//     $or: [
//       { isActive: true },
//       { isActive: { $exists: false } }
//     ]
//   })
//     .populate('user', 'username profilePicture')
//     .sort({ createdAt: -1 })
//     .lean();

//   const reelsWithLikeStatus = reels.map((reel) => {
//     // Fix broken videoUrl
//     let fixedVideoUrl = reel.videoUrl;
//     if (!reel.videoUrl || reel.videoUrl.startsWith('undefined') || reel.videoUrl.includes('.s3.')) {
//       if (reel.videoKey) {
//         fixedVideoUrl = `${CDN_BASE_URL}/${reel.videoKey}`;
//       }
//     }
    
//     return {
//       ...reel,
//       videoUrl: fixedVideoUrl,
//       isLiked: reel.likes?.some((id) => id.toString() === currentUserId.toString()),
//     };
//   });

//   res.status(200).json({
//     success: true,
//     data: reelsWithLikeStatus,
//   });
// });

// /**
//  * ======================================================
//  * LIKE / UNLIKE REEL
//  * PUT /api/v1/reels/:reelId/like
//  * ======================================================
//  */
// exports.toggleLike = catchAsync(async (req, res) => {
//   const { reelId } = req.params;
//   const userId = req.user.id;

//   const reel = await Reel.findById(reelId);

//   if (!reel) {
//     return res.status(404).json({
//       success: false,
//       message: 'Reel not found',
//     });
//   }

//   const isLiked = reel.likes.includes(userId);

//   if (isLiked) {
//     // Unlike
//     await Reel.findByIdAndUpdate(reelId, {
//       $pull: { likes: userId },
//       $inc: { likesCount: -1 },
//     });

//     // Emit socket event
//     const io = req.app.get('io');
//     if (io) {
//       io.emit('reel_like_updated', {
//         reelId,
//         userId,
//         liked: false,
//         likesCount: reel.likesCount - 1,
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: {
//         liked: false,
//         likesCount: reel.likesCount - 1,
//       },
//     });
//   } else {
//     // Like
//     await Reel.findByIdAndUpdate(reelId, {
//       $push: { likes: userId },
//       $inc: { likesCount: 1 },
//     });

//     // Emit socket event
//     const io = req.app.get('io');
//     if (io) {
//       io.emit('reel_like_updated', {
//         reelId,
//         userId,
//         liked: true,
//         likesCount: reel.likesCount + 1,
//       });

//       // Send notification to reel owner
//       if (reel.user.toString() !== userId.toString()) {
//         io.to(reel.user.toString()).emit('notification', {
//           type: 'REEL_LIKE',
//           from: userId,
//           reelId,
//           text: 'liked your reel',
//         });
//       }
//     }

//     return res.status(200).json({
//       success: true,
//       data: {
//         liked: true,
//         likesCount: reel.likesCount + 1,
//       },
//     });
//   }
// });

// /**
//  * ======================================================
//  * INCREMENT VIEW COUNT
//  * PUT /api/v1/reels/:reelId/view
//  * ======================================================
//  */
// exports.incrementView = catchAsync(async (req, res) => {
//   const { reelId } = req.params;

//   const reel = await Reel.findByIdAndUpdate(
//     reelId,
//     { $inc: { viewsCount: 1 } },
//     { new: true }
//   );

//   if (!reel) {
//     return res.status(404).json({
//       success: false,
//       message: 'Reel not found',
//     });
//   }

//   res.status(200).json({
//     success: true,
//     data: {
//       viewsCount: reel.viewsCount,
//     },
//   });
// });

// /**
//  * ======================================================
//  * DELETE REEL (OWNER ONLY)
//  * DELETE /api/v1/reels/:reelId
//  * ======================================================
//  */
// exports.deleteReel = catchAsync(async (req, res) => {
//   const { reelId } = req.params;
//   const userId = req.user.id;

//   const reel = await Reel.findById(reelId).select('+videoKey');

//   if (!reel) {
//     return res.status(404).json({
//       success: false,
//       message: 'Reel not found',
//     });
//   }

//   if (reel.user.toString() !== userId.toString()) {
//     return res.status(403).json({
//       success: false,
//       message: 'Not authorized to delete this reel',
//     });
//   }

//   // Delete video from S3
//   if (reel.videoKey) {
//     try {
//       const deleteCommand = new DeleteObjectCommand({
//         Bucket: process.env.AWS_BUCKET_NAME,
//         Key: reel.videoKey,
//       });
//       await s3Client.send(deleteCommand);
//       console.log('🗑️ Deleted video from S3:', reel.videoKey);
//     } catch (err) {
//       console.error('⚠️ Failed to delete video from S3:', err);
//       // Continue with DB deletion even if S3 fails
//     }
//   }

//   await reel.deleteOne();

//   // Emit socket event
//   const io = req.app.get('io');
//   if (io) {
//     io.emit('reel_deleted', { reelId });
//   }

//   console.log('✅ Reel deleted:', reelId);

//   res.status(200).json({
//     success: true,
//     message: 'Reel deleted successfully',
//   });
// });

// /**
//  * ======================================================
//  * ADD COMMENT TO REEL
//  * POST /api/v1/reels/:reelId/comments
//  * ======================================================
//  */
// exports.addComment = catchAsync(async (req, res) => {
//   const { reelId } = req.params;
//   const { text } = req.body;
//   const userId = req.user.id;

//   if (!text || !text.trim()) {
//     return res.status(400).json({
//       success: false,
//       message: 'Comment text is required',
//     });
//   }

//   const reel = await Reel.findById(reelId);

//   if (!reel) {
//     return res.status(404).json({
//       success: false,
//       message: 'Reel not found',
//     });
//   }

//   const commentData = {
//     user: userId,
//     text: text.trim(),
//     createdAt: new Date(),
//   };

//   reel.comments.push(commentData);
//   reel.commentsCount = reel.comments.length;
//   await reel.save();

//   // Populate the new comment's user info
//   await reel.populate('comments.user', 'username profilePicture');

//   const newComment = reel.comments[reel.comments.length - 1];

//   // Emit socket event for real-time update
//   const io = req.app.get('io');
//   if (io) {
//     // Notify reel owner
//     if (reel.user.toString() !== userId.toString()) {
//       io.to(reel.user.toString()).emit('notification', {
//         type: 'REEL_COMMENT',
//         from: userId,
//         reelId,
//         text: 'commented on your reel',
//       });
//     }
//   }

//   console.log('✅ Comment added to reel:', reelId);

//   res.status(201).json({
//     success: true,
//     data: newComment,
//   });
// });

// /**
//  * ======================================================
//  * GET REEL COMMENTS
//  * GET /api/v1/reels/:reelId/comments
//  * ======================================================
//  */
// exports.getComments = catchAsync(async (req, res) => {
//   const { reelId } = req.params;

//   const reel = await Reel.findById(reelId)
//     .select('comments commentsCount')
//     .populate('comments.user', 'username profilePicture');

//   if (!reel) {
//     return res.status(404).json({
//       success: false,
//       message: 'Reel not found',
//     });
//   }

//   res.status(200).json({
//     success: true,
//     results: reel.comments.length,
//     data: reel.comments,
//   });
// });









// const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
// const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
// const s3Client = require('../config/s3Client');
// const catchAsync = require('../utils/catchAsync');

// /**
//  * ⚠️ IMPORTANT: Update the import path based on your model filename
//  * If using Reel.js:       const Reel = require('../models/Reel');
//  * If using reel.model.js: const Reel = require('../models/reel.model');
//  */
// const Reel = require('../models/Reel');

// /**
//  * ======================================================
//  * CDN BASE URL (SAME AS POST CONTROLLER)
//  * Prefer CloudFront, fallback to S3 public URL
//  * ======================================================
//  */
// const CDN_BASE_URL =
//   process.env.CDN_BASE_URL ||
//   `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

// /**
//  * ======================================================
//  * GET PRESIGNED URL FOR REEL UPLOAD
//  * POST /api/v1/reels/presign
//  * ======================================================
//  */
// exports.getPresignedUrl = catchAsync(async (req, res) => {
//   const { mimeType, fileSizeMB } = req.body;
//   const userId = req.user.id;

//   console.log('🎬 Reel presign request:', { mimeType, fileSizeMB, userId });

//   /* =========================
//      VALIDATION
//   ========================= */
//   if (!mimeType) {
//     return res.status(400).json({
//       success: false,
//       message: 'mimeType is required',
//     });
//   }

//   // Only allow video types
//   const allowedMimeTypes = ['video/mp4', 'video/quicktime', 'video/x-matroska'];
//   if (!allowedMimeTypes.includes(mimeType)) {
//     return res.status(400).json({
//       success: false,
//       message: 'Only MP4, MOV, and MKV videos are allowed',
//     });
//   }

//   // Max 100MB for reels
//   const MAX_REEL_MB = 100;
//   if (typeof fileSizeMB === 'number' && fileSizeMB > MAX_REEL_MB) {
//     return res.status(400).json({
//       success: false,
//       message: `Reel video must be under ${MAX_REEL_MB}MB`,
//     });
//   }

//   /* =========================
//      S3 KEY GENERATION
//   ========================= */
//   const timestamp = Date.now();
//   const randomId = Math.random().toString(36).slice(2);
//   const extension = mimeType.split('/')[1] || 'mp4';

//   const key = `users/${userId}/reels/${timestamp}-${randomId}.${extension}`;

//   console.log('🔑 Generated S3 key:', key);

//   /* =========================
//      PRESIGN URL
//   ========================= */
//   const command = new PutObjectCommand({
//     Bucket: process.env.AWS_BUCKET_NAME,
//     Key: key,
//     ContentType: mimeType,
//     CacheControl: 'public, max-age=86400',
//   });

//   const uploadUrl = await getSignedUrl(s3Client, command, {
//     expiresIn: 900, // 15 minutes for larger files
//   });

//   console.log('✅ Presigned URL generated for reel');

//   res.status(200).json({
//     success: true,
//     data: {
//       uploadUrl,
//       key,
//       expiresIn: 900,
//     },
//   });
// });

// /**
//  * ======================================================
//  * CREATE REEL (AFTER PRESIGNED UPLOAD)
//  * POST /api/v1/reels
//  * ======================================================
//  */
// exports.createReel = catchAsync(async (req, res) => {
//   const { videoKey, caption, duration, thumbnailUrl } = req.body;
//   const userId = req.user.id;

//   console.log('🎬 Creating reel:', { videoKey, caption, userId });

//   if (!videoKey) {
//     return res.status(400).json({
//       success: false,
//       message: 'videoKey is required',
//     });
//   }

//   // Construct video URL using CDN_BASE_URL (same as posts)
//   const videoUrl = `${CDN_BASE_URL}/${videoKey}`;

//   console.log('🎬 Video URL:', videoUrl);
//   console.log('🎬 CDN_BASE_URL:', CDN_BASE_URL);

//   const reel = await Reel.create({
//     user: userId,
//     videoKey,
//     videoUrl,
//     caption: caption || '',
//     duration: duration || 0,
//     thumbnailUrl: thumbnailUrl || '',
//   });

//   // Populate user info for response
//   await reel.populate('user', 'username profilePicture');

//   console.log('✅ Reel created:', {
//     id: reel._id,
//     videoUrl: reel.videoUrl,
//     user: reel.user?.username,
//   });

//   // Emit socket event for real-time feed update
//   const io = req.app.get('io');
//   if (io) {
//     io.emit('new_reel', reel);
//   }

//   res.status(201).json({
//     success: true,
//     data: reel,
//   });
// });

// /**
//  * ======================================================
//  * GET REELS FEED
//  * GET /api/v1/reels/feed
//  * ======================================================
//  */
// exports.getReels = catchAsync(async (req, res) => {
//   const userId = req.user.id;
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;
//   const skip = (page - 1) * limit;

//   console.log('🎬 Fetching reels feed:', { userId, page, limit });

//   // Find active reels (isActive: true OR isActive doesn't exist for backward compatibility)
//   const reels = await Reel.find({ 
//     $or: [
//       { isActive: true },
//       { isActive: { $exists: false } }
//     ]
//   })
//     .populate('user', 'username profilePicture')
//     .sort({ createdAt: -1 })
//     .skip(skip)
//     .limit(limit)
//     .lean();

//   console.log('🎬 Found reels:', reels.length);

//   // Helper to construct proper video URL
//   const getProperVideoUrl = (reel) => {
//     // If videoUrl is broken (starts with 'undefined' or S3 direct), use CDN
//     if (!reel.videoUrl || reel.videoUrl.startsWith('undefined') || reel.videoUrl.includes('.s3.')) {
//       if (reel.videoKey) {
//         return `${CDN_BASE_URL}/${reel.videoKey}`;
//       }
//     }
//     return reel.videoUrl;
//   };

//   // Add isLiked flag and fix broken URLs
//   const reelsWithLikeStatus = reels.map((reel) => {
//     const fixedUrl = getProperVideoUrl(reel);
//     // Remove videoKey from response (it's sensitive)
//     const { videoKey, ...reelWithoutKey } = reel;
//     return {
//       ...reelWithoutKey,
//       videoUrl: fixedUrl, // ✅ Fix broken URLs
//       isLiked: reel.likes?.some((id) => id.toString() === userId.toString()),
//     };
//   });

//   const totalReels = await Reel.countDocuments({ 
//     $or: [
//       { isActive: true },
//       { isActive: { $exists: false } }
//     ]
//   });

//   console.log('🎬 Returning reels:', {
//     count: reelsWithLikeStatus.length,
//     totalReels,
//     firstReel: reelsWithLikeStatus[0] ? {
//       id: reelsWithLikeStatus[0]._id,
//       videoUrl: reelsWithLikeStatus[0].videoUrl,
//     } : null,
//   });

//   res.status(200).json({
//     success: true,
//     data: reelsWithLikeStatus,
//     pagination: {
//       page,
//       limit,
//       totalPages: Math.ceil(totalReels / limit),
//       totalReels,
//     },
//   });
// });

// /**
//  * ======================================================
//  * GET SINGLE REEL
//  * GET /api/v1/reels/:reelId
//  * ======================================================
//  */
// exports.getReel = catchAsync(async (req, res) => {
//   const userId = req.user.id;
//   const reel = await Reel.findById(req.params.reelId)
//     .populate('user', 'username profilePicture')
//     .lean();

//   if (!reel) {
//     return res.status(404).json({
//       success: false,
//       message: 'Reel not found',
//     });
//   }

//   // Fix broken videoUrl
//   if (!reel.videoUrl || reel.videoUrl.startsWith('undefined') || reel.videoUrl.includes('.s3.')) {
//     if (reel.videoKey) {
//       reel.videoUrl = `${CDN_BASE_URL}/${reel.videoKey}`;
//     }
//   }

//   // Add isLiked flag
//   reel.isLiked = reel.likes?.some((id) => id.toString() === userId.toString());

//   res.status(200).json({
//     success: true,
//     data: reel,
//   });
// });

// /**
//  * ======================================================
//  * GET USER'S REELS
//  * GET /api/v1/reels/user/:userId
//  * ======================================================
//  */
// exports.getUserReels = catchAsync(async (req, res) => {
//   const targetUserId = req.params.userId;
//   const currentUserId = req.user.id;

//   const reels = await Reel.find({ 
//     user: targetUserId,
//     $or: [
//       { isActive: true },
//       { isActive: { $exists: false } }
//     ]
//   })
//     .populate('user', 'username profilePicture')
//     .sort({ createdAt: -1 })
//     .lean();

//   const reelsWithLikeStatus = reels.map((reel) => {
//     // Fix broken videoUrl
//     let fixedVideoUrl = reel.videoUrl;
//     if (!reel.videoUrl || reel.videoUrl.startsWith('undefined') || reel.videoUrl.includes('.s3.')) {
//       if (reel.videoKey) {
//         fixedVideoUrl = `${CDN_BASE_URL}/${reel.videoKey}`;
//       }
//     }
    
//     return {
//       ...reel,
//       videoUrl: fixedVideoUrl,
//       isLiked: reel.likes?.some((id) => id.toString() === currentUserId.toString()),
//     };
//   });

//   res.status(200).json({
//     success: true,
//     data: reelsWithLikeStatus,
//   });
// });

// /**
//  * ======================================================
//  * LIKE / UNLIKE REEL
//  * PUT /api/v1/reels/:reelId/like
//  * ======================================================
//  */
// exports.toggleLike = catchAsync(async (req, res) => {
//   const { reelId } = req.params;
//   const userId = req.user.id;

//   const reel = await Reel.findById(reelId);

//   if (!reel) {
//     return res.status(404).json({
//       success: false,
//       message: 'Reel not found',
//     });
//   }

//   const isLiked = reel.likes.includes(userId);

//   if (isLiked) {
//     // Unlike
//     await Reel.findByIdAndUpdate(reelId, {
//       $pull: { likes: userId },
//       $inc: { likesCount: -1 },
//     });

//     // Emit socket event
//     const io = req.app.get('io');
//     if (io) {
//       io.emit('reel_like_updated', {
//         reelId,
//         userId,
//         liked: false,
//         likesCount: reel.likesCount - 1,
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: {
//         liked: false,
//         likesCount: reel.likesCount - 1,
//       },
//     });
//   } else {
//     // Like
//     await Reel.findByIdAndUpdate(reelId, {
//       $push: { likes: userId },
//       $inc: { likesCount: 1 },
//     });

//     // Emit socket event
//     const io = req.app.get('io');
//     if (io) {
//       io.emit('reel_like_updated', {
//         reelId,
//         userId,
//         liked: true,
//         likesCount: reel.likesCount + 1,
//       });

//       // Send notification to reel owner
//       if (reel.user.toString() !== userId.toString()) {
//         io.to(reel.user.toString()).emit('notification', {
//           type: 'REEL_LIKE',
//           from: userId,
//           reelId,
//           text: 'liked your reel',
//         });
//       }
//     }

//     return res.status(200).json({
//       success: true,
//       data: {
//         liked: true,
//         likesCount: reel.likesCount + 1,
//       },
//     });
//   }
// });

// /**
//  * ======================================================
//  * INCREMENT VIEW COUNT
//  * PUT /api/v1/reels/:reelId/view
//  * ======================================================
//  */
// exports.incrementView = catchAsync(async (req, res) => {
//   const { reelId } = req.params;

//   const reel = await Reel.findByIdAndUpdate(
//     reelId,
//     { $inc: { viewsCount: 1 } },
//     { new: true }
//   );

//   if (!reel) {
//     return res.status(404).json({
//       success: false,
//       message: 'Reel not found',
//     });
//   }

//   res.status(200).json({
//     success: true,
//     data: {
//       viewsCount: reel.viewsCount,
//     },
//   });
// });

// /**
//  * ======================================================
//  * DELETE REEL (OWNER ONLY)
//  * DELETE /api/v1/reels/:reelId
//  * ======================================================
//  */
// exports.deleteReel = catchAsync(async (req, res) => {
//   const { reelId } = req.params;
//   const userId = req.user.id;

//   const reel = await Reel.findById(reelId).select('+videoKey');

//   if (!reel) {
//     return res.status(404).json({
//       success: false,
//       message: 'Reel not found',
//     });
//   }

//   if (reel.user.toString() !== userId.toString()) {
//     return res.status(403).json({
//       success: false,
//       message: 'Not authorized to delete this reel',
//     });
//   }

//   // Delete video from S3
//   if (reel.videoKey) {
//     try {
//       const deleteCommand = new DeleteObjectCommand({
//         Bucket: process.env.AWS_BUCKET_NAME,
//         Key: reel.videoKey,
//       });
//       await s3Client.send(deleteCommand);
//       console.log('🗑️ Deleted video from S3:', reel.videoKey);
//     } catch (err) {
//       console.error('⚠️ Failed to delete video from S3:', err);
//       // Continue with DB deletion even if S3 fails
//     }
//   }

//   await reel.deleteOne();

//   // Emit socket event
//   const io = req.app.get('io');
//   if (io) {
//     io.emit('reel_deleted', { reelId });
//   }

//   console.log('✅ Reel deleted:', reelId);

//   res.status(200).json({
//     success: true,
//     message: 'Reel deleted successfully',
//   });
// });

// /**
//  * ======================================================
//  * GET REEL COMMENTS
//  * GET /api/v1/reels/:reelId/comments
//  * ======================================================
//  */
// exports.getComments = catchAsync(async (req, res) => {
//   const { reelId } = req.params;

//   const reel = await Reel.findById(reelId)
//     .select('comments')
//     .populate('comments.user', 'username profilePicture')
//     .lean();

//   if (!reel) {
//     return res.status(404).json({
//       success: false,
//       message: 'Reel not found',
//     });
//   }

//   // Sort comments by newest first
//   const sortedComments = (reel.comments || []).sort(
//     (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
//   );

//   res.status(200).json({
//     success: true,
//     results: sortedComments.length,
//     data: sortedComments,
//   });
// });

// /**
//  * ======================================================
//  * ADD COMMENT TO REEL
//  * POST /api/v1/reels/:reelId/comments
//  * ======================================================
//  */
// exports.addComment = catchAsync(async (req, res) => {
//   const { reelId } = req.params;
//   const { text } = req.body;
//   const userId = req.user.id;

//   if (!text || !text.trim()) {
//     return res.status(400).json({
//       success: false,
//       message: 'Comment text is required',
//     });
//   }

//   const reel = await Reel.findById(reelId);

//   if (!reel) {
//     return res.status(404).json({
//       success: false,
//       message: 'Reel not found',
//     });
//   }

//   const newComment = {
//     user: userId,
//     text: text.trim(),
//     createdAt: new Date(),
//   };

//   reel.comments.push(newComment);
//   reel.commentsCount = reel.comments.length;
//   await reel.save();

//   // Get the newly added comment with populated user
//   await reel.populate('comments.user', 'username profilePicture');
  
//   const addedComment = reel.comments[reel.comments.length - 1];

//   // Emit socket event for real-time update
//   const io = req.app.get('io');
//   if (io) {
//     // Notify reel owner
//     if (reel.user.toString() !== userId.toString()) {
//       io.to(reel.user.toString()).emit('notification', {
//         type: 'REEL_COMMENT',
//         from: userId,
//         reelId,
//         text: 'commented on your reel',
//       });
//     }

//     // Broadcast comment update
//     io.emit('reel_comment_added', {
//       reelId,
//       comment: addedComment,
//       commentsCount: reel.commentsCount,
//     });
//   }

//   console.log('✅ Comment added to reel:', reelId);

//   res.status(201).json({
//     success: true,
//     data: addedComment,
//   });
// });

// /**
//  * ======================================================
//  * ADD COMMENT TO REEL
//  * POST /api/v1/reels/:reelId/comments
//  * ======================================================
//  */
// exports.addComment = catchAsync(async (req, res) => {
//   const { reelId } = req.params;
//   const { text } = req.body;
//   const userId = req.user.id;

//   if (!text || !text.trim()) {
//     return res.status(400).json({
//       success: false,
//       message: 'Comment text is required',
//     });
//   }

//   const reel = await Reel.findById(reelId);

//   if (!reel) {
//     return res.status(404).json({
//       success: false,
//       message: 'Reel not found',
//     });
//   }

//   const commentData = {
//     user: userId,
//     text: text.trim(),
//     createdAt: new Date(),
//   };

//   reel.comments.push(commentData);
//   reel.commentsCount = reel.comments.length;
//   await reel.save();

//   // Populate the new comment's user info
//   await reel.populate('comments.user', 'username profilePicture');

//   const newComment = reel.comments[reel.comments.length - 1];

//   // Emit socket event for real-time update
//   const io = req.app.get('io');
//   if (io) {
//     // Notify reel owner
//     if (reel.user.toString() !== userId.toString()) {
//       io.to(reel.user.toString()).emit('notification', {
//         type: 'REEL_COMMENT',
//         from: userId,
//         reelId,
//         text: 'commented on your reel',
//       });
//     }
//   }

//   console.log('✅ Comment added to reel:', reelId);

//   res.status(201).json({
//     success: true,
//     data: newComment,
//   });
// });

// /**
//  * ======================================================
//  * GET REEL COMMENTS
//  * GET /api/v1/reels/:reelId/comments
//  * ======================================================
//  */
// exports.getComments = catchAsync(async (req, res) => {
//   const { reelId } = req.params;

//   const reel = await Reel.findById(reelId)
//     .select('comments commentsCount')
//     .populate('comments.user', 'username profilePicture');

//   if (!reel) {
//     return res.status(404).json({
//       success: false,
//       message: 'Reel not found',
//     });
//   }

//   res.status(200).json({
//     success: true,
//     results: reel.comments.length,
//     data: reel.comments,
//   });
// });





const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../config/s3Client');
const catchAsync = require('../utils/catchAsync');

const Reel = require('../models/Reel');
const User = require('../models/user.model'); // ⭐ Use User model instead

const CDN_BASE_URL =
  process.env.CDN_BASE_URL ||
  `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

/**
 * ======================================================
 * GET PRESIGNED URL FOR REEL UPLOAD
 * POST /api/v1/reels/presign
 * ======================================================
 */
exports.getPresignedUrl = catchAsync(async (req, res) => {
  const { mimeType, fileSizeMB } = req.body;
  const userId = req.user.id;

  console.log('🎬 Reel presign request:', { mimeType, fileSizeMB, userId });

  if (!mimeType) {
    return res.status(400).json({
      success: false,
      message: 'mimeType is required',
    });
  }

  const allowedMimeTypes = ['video/mp4', 'video/quicktime', 'video/x-matroska'];
  if (!allowedMimeTypes.includes(mimeType)) {
    return res.status(400).json({
      success: false,
      message: 'Only MP4, MOV, and MKV videos are allowed',
    });
  }

  const MAX_REEL_MB = 100;
  if (typeof fileSizeMB === 'number' && fileSizeMB > MAX_REEL_MB) {
    return res.status(400).json({
      success: false,
      message: `Reel video must be under ${MAX_REEL_MB}MB`,
    });
  }

  const timestamp = Date.now();
  const randomId = Math.random().toString(36).slice(2);
  const extension = mimeType.split('/')[1] || 'mp4';
  const key = `users/${userId}/reels/${timestamp}-${randomId}.${extension}`;

  console.log('🔑 Generated S3 key:', key);

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    ContentType: mimeType,
    CacheControl: 'public, max-age=86400',
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 900,
  });

  console.log('✅ Presigned URL generated for reel');

  res.status(200).json({
    success: true,
    data: {
      uploadUrl,
      key,
      expiresIn: 900,
    },
  });
});

/**
 * ======================================================
 * CREATE REEL (AFTER PRESIGNED UPLOAD)
 * POST /api/v1/reels
 * ======================================================
 */
exports.createReel = catchAsync(async (req, res) => {
  const { videoKey, caption, duration, thumbnailUrl } = req.body;
  const userId = req.user.id;

  console.log('🎬 Creating reel:', { videoKey, caption, userId });

  if (!videoKey) {
    return res.status(400).json({
      success: false,
      message: 'videoKey is required',
    });
  }

  const videoUrl = `${CDN_BASE_URL}/${videoKey}`;

  console.log('🎬 Video URL:', videoUrl);
  console.log('🎬 CDN_BASE_URL:', CDN_BASE_URL);

  const reel = await Reel.create({
    user: userId,
    videoKey,
    videoUrl,
    caption: caption || '',
    duration: duration || 0,
    thumbnailUrl: thumbnailUrl || '',
  });

  await reel.populate('user', 'username profilePicture');

  console.log('✅ Reel created:', {
    id: reel._id,
    videoUrl: reel.videoUrl,
    user: reel.user?.username,
  });

  const io = req.app.get('io');
  if (io) {
    io.emit('new_reel', reel);
  }

  res.status(201).json({
    success: true,
    data: reel,
  });
});

/**
 * ======================================================
 * GET REELS FEED - ⭐ UPDATED WITH isFollowing (User-based)
 * GET /api/v1/reels/feed
 * ======================================================
 */
exports.getReels = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  console.log('🎬 Fetching reels feed:', { userId, page, limit });

  const reels = await Reel.find({ 
    $or: [
      { isActive: true },
      { isActive: { $exists: false } }
    ]
  })
    .populate('user', 'username profilePicture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  console.log('🎬 Found reels:', reels.length);

  // ⭐ Get current user's following list
  const currentUser = await User.findById(userId).select('following').lean();
  const followingIds = currentUser?.following || [];
  const followingIdsSet = new Set(followingIds.map(id => id.toString()));

  // Helper to construct proper video URL
  const getProperVideoUrl = (reel) => {
    if (!reel.videoUrl || reel.videoUrl.startsWith('undefined') || reel.videoUrl.includes('.s3.')) {
      if (reel.videoKey) {
        return `${CDN_BASE_URL}/${reel.videoKey}`;
      }
    }
    return reel.videoUrl;
  };

  // Add isLiked AND isFollowing flags
  const reelsWithStatus = reels.map((reel) => {
    const fixedUrl = getProperVideoUrl(reel);
    const { videoKey, ...reelWithoutKey } = reel;

    // Check if user liked this reel
    const isLiked = reel.likes?.some((id) => id.toString() === userId.toString());

    // ⭐ Check if user is following the reel creator
    const isFollowing = reel.user && reel.user._id 
      ? followingIdsSet.has(reel.user._id.toString())
      : false;

    return {
      ...reelWithoutKey,
      videoUrl: fixedUrl,
      isLiked,
      user: {
        ...reel.user,
        isFollowing // ⭐ Add isFollowing to user object
      }
    };
  });

  const totalReels = await Reel.countDocuments({ 
    $or: [
      { isActive: true },
      { isActive: { $exists: false } }
    ]
  });

  console.log('🎬 Returning reels:', {
    count: reelsWithStatus.length,
    totalReels,
    firstReel: reelsWithStatus[0] ? {
      id: reelsWithStatus[0]._id,
      videoUrl: reelsWithStatus[0].videoUrl,
      user: reelsWithStatus[0].user?.username,
      isFollowing: reelsWithStatus[0].user?.isFollowing
    } : null,
  });

  res.status(200).json({
    success: true,
    data: reelsWithStatus,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalReels / limit),
      totalReels,
    },
  });
});

/**
 * ======================================================
 * GET SINGLE REEL - ⭐ UPDATED WITH isFollowing
 * GET /api/v1/reels/:reelId
 * ======================================================
 */
exports.getReel = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const reel = await Reel.findById(req.params.reelId)
    .populate('user', 'username profilePicture')
    .lean();

  if (!reel) {
    return res.status(404).json({
      success: false,
      message: 'Reel not found',
    });
  }

  // Fix broken videoUrl
  if (!reel.videoUrl || reel.videoUrl.startsWith('undefined') || reel.videoUrl.includes('.s3.')) {
    if (reel.videoKey) {
      reel.videoUrl = `${CDN_BASE_URL}/${reel.videoKey}`;
    }
  }

  // Add isLiked flag
  reel.isLiked = reel.likes?.some((id) => id.toString() === userId.toString());

  // ⭐ Add isFollowing flag using User model
  if (reel.user && reel.user._id && reel.user._id.toString() !== userId.toString()) {
    const currentUser = await User.findById(userId).select('following').lean();
    const followingIds = currentUser?.following || [];
    const isFollowing = followingIds.some(id => id.toString() === reel.user._id.toString());
    reel.user.isFollowing = isFollowing;
  } else {
    reel.user.isFollowing = false;
  }

  res.status(200).json({
    success: true,
    data: reel,
  });
});

/**
 * ======================================================
 * GET USER'S REELS - ⭐ UPDATED WITH isFollowing
 * GET /api/v1/reels/user/:userId
 * ======================================================
 */
exports.getUserReels = catchAsync(async (req, res) => {
  const targetUserId = req.params.userId;
  const currentUserId = req.user.id;

  const reels = await Reel.find({ 
    user: targetUserId,
    $or: [
      { isActive: true },
      { isActive: { $exists: false } }
    ]
  })
    .populate('user', 'username profilePicture')
    .sort({ createdAt: -1 })
    .lean();

  // ⭐ Check if current user follows the target user
  let isFollowingUser = false;
  if (targetUserId !== currentUserId.toString()) {
    const currentUser = await User.findById(currentUserId).select('following').lean();
    const followingIds = currentUser?.following || [];
    isFollowingUser = followingIds.some(id => id.toString() === targetUserId);
  }

  const reelsWithStatus = reels.map((reel) => {
    let fixedVideoUrl = reel.videoUrl;
    if (!reel.videoUrl || reel.videoUrl.startsWith('undefined') || reel.videoUrl.includes('.s3.')) {
      if (reel.videoKey) {
        fixedVideoUrl = `${CDN_BASE_URL}/${reel.videoKey}`;
      }
    }
    
    return {
      ...reel,
      videoUrl: fixedVideoUrl,
      isLiked: reel.likes?.some((id) => id.toString() === currentUserId.toString()),
      user: {
        ...reel.user,
        isFollowing: isFollowingUser // ⭐ Add isFollowing
      }
    };
  });

  res.status(200).json({
    success: true,
    data: reelsWithStatus,
  });
});

/**
 * ======================================================
 * LIKE / UNLIKE REEL
 * PUT /api/v1/reels/:reelId/like
 * ======================================================
 */
exports.toggleLike = catchAsync(async (req, res) => {
  const { reelId } = req.params;
  const userId = req.user.id;

  const reel = await Reel.findById(reelId);

  if (!reel) {
    return res.status(404).json({
      success: false,
      message: 'Reel not found',
    });
  }

  const isLiked = reel.likes.includes(userId);

  if (isLiked) {
    await Reel.findByIdAndUpdate(reelId, {
      $pull: { likes: userId },
      $inc: { likesCount: -1 },
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('reel_like_updated', {
        reelId,
        userId,
        liked: false,
        likesCount: reel.likesCount - 1,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        liked: false,
        likesCount: reel.likesCount - 1,
      },
    });
  } else {
    await Reel.findByIdAndUpdate(reelId, {
      $push: { likes: userId },
      $inc: { likesCount: 1 },
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('reel_like_updated', {
        reelId,
        userId,
        liked: true,
        likesCount: reel.likesCount + 1,
      });

      if (reel.user.toString() !== userId.toString()) {
        io.to(reel.user.toString()).emit('notification', {
          type: 'REEL_LIKE',
          from: userId,
          reelId,
          text: 'liked your reel',
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        liked: true,
        likesCount: reel.likesCount + 1,
      },
    });
  }
});

/**
 * ======================================================
 * INCREMENT VIEW COUNT
 * PUT /api/v1/reels/:reelId/view
 * ======================================================
 */
exports.incrementView = catchAsync(async (req, res) => {
  const { reelId } = req.params;

  const reel = await Reel.findByIdAndUpdate(
    reelId,
    { $inc: { viewsCount: 1 } },
    { new: true }
  );

  if (!reel) {
    return res.status(404).json({
      success: false,
      message: 'Reel not found',
    });
  }

  res.status(200).json({
    success: true,
    data: {
      viewsCount: reel.viewsCount,
    },
  });
});

/**
 * ======================================================
 * DELETE REEL (OWNER ONLY)
 * DELETE /api/v1/reels/:reelId
 * ======================================================
 */
exports.deleteReel = catchAsync(async (req, res) => {
  const { reelId } = req.params;
  const userId = req.user.id;

  const reel = await Reel.findById(reelId).select('+videoKey');

  if (!reel) {
    return res.status(404).json({
      success: false,
      message: 'Reel not found',
    });
  }

  if (reel.user.toString() !== userId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this reel',
    });
  }

  if (reel.videoKey) {
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: reel.videoKey,
      });
      await s3Client.send(deleteCommand);
      console.log('🗑️ Deleted video from S3:', reel.videoKey);
    } catch (err) {
      console.error('⚠️ Failed to delete video from S3:', err);
    }
  }

  await reel.deleteOne();

  const io = req.app.get('io');
  if (io) {
    io.emit('reel_deleted', { reelId });
  }

  console.log('✅ Reel deleted:', reelId);

  res.status(200).json({
    success: true,
    message: 'Reel deleted successfully',
  });
});

/**
 * ======================================================
 * GET REEL COMMENTS
 * GET /api/v1/reels/:reelId/comments
 * ======================================================
 */
exports.getComments = catchAsync(async (req, res) => {
  const { reelId } = req.params;

  const reel = await Reel.findById(reelId)
    .select('comments commentsCount')
    .populate('comments.user', 'username profilePicture');

  if (!reel) {
    return res.status(404).json({
      success: false,
      message: 'Reel not found',
    });
  }

  res.status(200).json({
    success: true,
    results: reel.comments.length,
    data: reel.comments,
  });
});

/**
 * ======================================================
 * ADD COMMENT TO REEL
 * POST /api/v1/reels/:reelId/comments
 * ======================================================
 */
exports.addComment = catchAsync(async (req, res) => {
  const { reelId } = req.params;
  const { text } = req.body;
  const userId = req.user.id;

  if (!text || !text.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Comment text is required',
    });
  }

  const reel = await Reel.findById(reelId);

  if (!reel) {
    return res.status(404).json({
      success: false,
      message: 'Reel not found',
    });
  }

  const commentData = {
    user: userId,
    text: text.trim(),
    createdAt: new Date(),
  };

  reel.comments.push(commentData);
  reel.commentsCount = reel.comments.length;
  await reel.save();

  await reel.populate('comments.user', 'username profilePicture');

  const newComment = reel.comments[reel.comments.length - 1];

  const io = req.app.get('io');
  if (io) {
    if (reel.user.toString() !== userId.toString()) {
      io.to(reel.user.toString()).emit('notification', {
        type: 'REEL_COMMENT',
        from: userId,
        reelId,
        text: 'commented on your reel',
      });
    }
  }

  console.log('✅ Comment added to reel:', reelId);

  res.status(201).json({
    success: true,
    data: newComment,
  });
});