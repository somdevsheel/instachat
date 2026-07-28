// const User = require('../models/user.model');
// const Post = require('../models/Post');
// const notificationService = require('../services/notification.service');
// const { getUserStatus } = require('../utils/userStatus.util');

// /**
//  * CDN BASE URL
//  */
// const CDN_BASE_URL =
//   process.env.CDN_BASE_URL ||
//   `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

// /* ================================
//    🔍 SEARCH USERS
// ================================ */
// exports.searchUsers = async (req, res) => {
//   try {
//     const q = (req.query.q || '').trim();

//     if (!q) {
//       return res.status(200).json({ success: true, data: [] });
//     }

//     const currentUser = await User.findById(req.user.id).select('following');
//     const followingSet = new Set(
//       currentUser.following.map(id => id.toString())
//     );

//     const users = await User.find({
//       username: { $regex: q, $options: 'i' },
//       _id: { $ne: req.user.id },
//     }).select('username profilePicture lastSeen');

//     const usersWithStatus = await Promise.all(
//       users.map(async (user) => {
//         const status = await getUserStatus(user);
//         return {
//           _id: user._id,
//           username: user.username,
//           profilePicture: user.profilePicture,
//           isFollowing: followingSet.has(user._id.toString()),
//           online: status.online,
//           lastSeen: status.lastSeen,
//         };
//       })
//     );

//     return res.status(200).json({
//       success: true,
//       data: usersWithStatus,
//     });
//   } catch (err) {
//     console.error('Search users error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to search users',
//     });
//   }
// };

// /* ================================
//    👤 GET USER PROFILE (PUBLIC)
// ================================ */
// exports.getUserProfile = async (req, res) => {
//   try {
//     const user = await User.findOne({
//       username: req.params.username,
//     })
//       .select('-password')
//       .populate('followers', '_id')
//       .populate('following', '_id');

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     const posts = await Post.find({ user: user._id })
//       .sort({ createdAt: -1 })
//       .select('media user createdAt')
//       .lean();

//     const currentUser = await User.findById(req.user.id).select(
//       'following followers'
//     );

//     const isFollowing = currentUser.following.some(
//       id => id.toString() === user._id.toString()
//     );

//     const theyFollowMe = user.following.some(
//       f => f._id.toString() === req.user.id.toString()
//     );

//     const canMessage = isFollowing || theyFollowMe;
//     const status = await getUserStatus(user);

//     return res.status(200).json({
//       success: true,
//       data: {
//         _id: user._id,
//         username: user.username,
//         name: user.name || '',
//         profilePicture: user.profilePicture,
//         bio: user.bio,
//         postsCount: posts.length,
//         followersCount: user.followers.length,
//         followingCount: user.following.length,
//         isFollowing,
//         canMessage,
//         online: status.online,
//         lastSeen: status.lastSeen,
//         posts,
//       },
//     });
//   } catch (err) {
//     console.error('Get profile error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to load profile',
//     });
//   }
// };

// /* ================================
//    ✏️ UPDATE PROFILE
// ================================ */
// exports.updateUserProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     const { username, bio, avatarKey } = req.body;

//     if (username) user.username = username.trim();
//     if (bio !== undefined) user.bio = bio.trim();

//     if (avatarKey) {
//       const newUrl = `${CDN_BASE_URL}/${avatarKey}`;
//       if (user.profilePicture !== newUrl) {
//         user.profilePicture = newUrl;
//       }
//     }

//     await user.save();

//     return res.status(200).json({
//       success: true,
//       data: {
//         _id: user._id,
//         username: user.username,
//         email: user.email,
//         profilePicture: user.profilePicture,
//         bio: user.bio,
//         followersCount: user.followers.length,
//         followingCount: user.following.length,
//       },
//     });
//   } catch (err) {
//     console.error('Update profile error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Profile update failed',
//     });
//   }
// };

// /* ================================
//    🔐 UPDATE PASSWORD (ADD)
// ================================ */
// // exports.updatePassword = async (req, res) => {
// //   try {
// //     const { currentPassword, newPassword } = req.body;

// //     if (!currentPassword || !newPassword) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Current password and new password are required',
// //       });
// //     }

// //     if (newPassword.length < 8) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'New password must be at least 8 characters',
// //       });
// //     }

// //     const user = await User.findById(req.user.id).select('+password');

// //     if (!user) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'User not found',
// //       });
// //     }

// //     const isMatch = await user.isPasswordMatch(currentPassword);
// //     if (!isMatch) {
// //       return res.status(401).json({
// //         success: false,
// //         message: 'Current password is incorrect',
// //       });
// //     }

// //     user.password = newPassword;

// //       // prevent immediate JWT invalidation during this request
// //     user.passwordChangedAt = Date.now();

// //     await user.save();
// //  // triggers passwordChangedAt → logout all devices

// //     return res.status(200).json({
// //       success: true,
// //       message:
// //         'Password updated successfully. Please login again on all devices.',
// //     });
// //   } catch (err) {
// //     console.error('Update password error:', err);
// //     return res.status(500).json({
// //       success: false,
// //       message: 'Failed to update password',
// //     });
// //   }
// // };

// /* ================================
//    🔐 UPDATE PASSWORD (DEBUG MODE)
// ================================ */
// exports.updatePassword = async (req, res) => {
//   try {
//     console.log('================ PASSWORD DEBUG START ================');

//     console.log('➡️ Controller HIT');
//     console.log('➡️ req.user.id:', req.user?.id);

//     console.log('➡️ Raw body:', req.body);
//     console.log(
//       '➡️ currentPassword:',
//       `"${req.body.currentPassword}"`,
//       'length:',
//       req.body.currentPassword?.length
//     );
//     console.log(
//       '➡️ newPassword:',
//       `"${req.body.newPassword}"`,
//       'length:',
//       req.body.newPassword?.length
//     );

//     // FORCE TRIM (DEBUG)
//     const currentPassword = req.body.currentPassword?.trim();
//     const newPassword = req.body.newPassword?.trim();

//     console.log(
//       '➡️ currentPassword (trimmed):',
//       `"${currentPassword}"`,
//       'length:',
//       currentPassword?.length
//     );
//     console.log(
//       '➡️ newPassword (trimmed):',
//       `"${newPassword}"`,
//       'length:',
//       newPassword?.length
//     );

//     if (!currentPassword || !newPassword) {
//       console.log('❌ Missing password fields');
//       return res.status(400).json({
//         success: false,
//         message: 'Passwords missing',
//       });
//     }

//     const user = await require('../models/user.model')
//       .findById(req.user.id)
//       .select('+password');

//     console.log('➡️ User fetched:', !!user);
//     console.log(
//       '➡️ Stored hashed password:',
//       user.password
//     );

//     console.log('➡️ Comparing passwords with bcrypt...');
//     const isMatch = await user.isPasswordMatch(currentPassword);

//     console.log('➡️ bcrypt.compare result:', isMatch);

//     if (!isMatch) {
//       console.log('❌ PASSWORD MISMATCH');
//       return res.status(401).json({
//         success: false,
//         message: 'Current password incorrect',
//       });
//     }

//     console.log('✅ PASSWORD MATCHED');

//     user.password = newPassword;
//     await user.save();

//     console.log('✅ Password SAVED');
//     console.log('➡️ passwordChangedAt:', user.passwordChangedAt);

    

//     return res.status(200).json({
//       success: true,
//       message: 'Password updated successfully',
//     });
//   } catch (err) {
//     console.error('🔥 PASSWORD UPDATE ERROR:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Password update failed',
//     });
//   }
// };


// /* ================================
//    🔄 FOLLOW / UNFOLLOW
// ================================ */
// // exports.followUser = async (req, res) => {
// //   try {
// //     const me = await User.findById(req.user.id);
// //     const other = await User.findById(req.params.id);

// //     if (!me || !other) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'User not found',
// //       });
// //     }

// //     const isFollowing = me.following.includes(other._id);

// //     if (isFollowing) {
// //       me.following.pull(other._id);
// //       other.followers.pull(me._id);
// //     } else {
// //       me.following.push(other._id);
// //       other.followers.push(me._id);

// //       try {
// //         await notificationService.createNotification({
// //           recipient: other._id,
// //           sender: me._id,
// //           type: 'follow',
// //           message: 'started following you',
// //         });
// //       } catch (err) {
// //         console.error('Notification error:', err);
// //       }
// //     }

// //     await me.save();
// //     await other.save();

// //     return res.status(200).json({
// //       success: true,
// //       following: !isFollowing,
// //       followersCount: other.followers.length,
// //     });
// //   } catch (err) {
// //     console.error('Follow user error:', err);
// //     return res.status(500).json({
// //       success: false,
// //       message: 'Follow action failed',
// //     });
// //   }
// // };

// exports.followUser = async (req, res) => {
//   try {
//     const myId = req.user.id;
//     const targetId = req.params.id;

//     if (myId === targetId) {
//       return res.status(400).json({
//         success: false,
//         message: 'You cannot follow yourself',
//       });
//     }

//     const targetUser = await User.findById(targetId);
//     if (!targetUser) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     const me = await User.findById(myId).select('following');

//     const isFollowing = me.following.includes(targetId);

//     if (isFollowing) {
//       // UNFOLLOW
//       await User.findByIdAndUpdate(myId, {
//         $pull: { following: targetId },
//       });

//       await User.findByIdAndUpdate(targetId, {
//         $pull: { followers: myId },
//       });
//     } else {
//       // FOLLOW
//       await User.findByIdAndUpdate(myId, {
//         $addToSet: { following: targetId },
//       });

//       await User.findByIdAndUpdate(targetId, {
//         $addToSet: { followers: myId },
//       });

//       // Notification (safe)
//       try {
//         await notificationService.createNotification({
//           recipient: targetId,
//           sender: myId,
//           type: 'follow',
//           message: 'started following you',
//         });
//       } catch (err) {
//         console.error('Notification error:', err);
//       }
//     }

//     const updatedTarget = await User.findById(targetId).select('followers');

//     return res.status(200).json({
//       success: true,
//       following: !isFollowing,
//       followersCount: updatedTarget.followers.length,
//     });
//   } catch (err) {
//     console.error('Follow user error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Follow action failed',
//     });
//   }
// };


// /* ================================
//    👥 FOLLOWERS / FOLLOWING LIST
// ================================ */
// exports.getFollowList = async (req, res) => {
//   try {
//     const { id, type } = req.params;

//     if (!['followers', 'following'].includes(type)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid follow type',
//       });
//     }

//     const user = await User.findById(id)
//       .populate(type, 'username profilePicture lastSeen')
//       .select(type);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     const currentUser = await User.findById(req.user.id).select('following');
//     const followingSet = new Set(
//       currentUser.following.map(id => id.toString())
//     );

//     const listWithStatus = await Promise.all(
//       user[type].map(async (u) => {
//         const status = await getUserStatus(u);
//         return {
//           _id: u._id,
//           username: u.username,
//           profilePicture: u.profilePicture,
//           isFollowing: followingSet.has(u._id.toString()),
//           online: status.online,
//           lastSeen: status.lastSeen,
//         };
//       })
//     );

//     return res.status(200).json({
//       success: true,
//       data: listWithStatus,
//     });
//   } catch (err) {
//     console.error('Get follow list error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to load follow list',
//     });
//   }
// };

// /* ================================
//    ⭐ SUGGESTED USERS
// ================================ */
// exports.getSuggestedUsers = async (req, res) => {
//   try {
//     const me = await User.findById(req.user.id);

//     const users = await User.find({
//       _id: { $nin: [req.user.id, ...me.following] },
//     })
//       .select('username profilePicture lastSeen')
//       .limit(20);

//     const usersWithStatus = await Promise.all(
//       users.map(async (u) => {
//         const status = await getUserStatus(u);
//         return {
//           _id: u._id,
//           username: u.username,
//           profilePicture: u.profilePicture,
//           isFollowing: false,
//           online: status.online,
//           lastSeen: status.lastSeen,
//         };
//       })
//     );

//     return res.status(200).json({
//       success: true,
//       data: usersWithStatus,
//     });
//   } catch (err) {
//     console.error('Suggested users error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to load suggestions',
//     });
//   }
// };

// /* ================================
//    🤝 MUTUAL FOLLOWERS
// ================================ */
// exports.getMutualFollowers = async (req, res) => {
//   try {
//     const me = await User.findById(req.user.id)
//       .populate('followers', 'username profilePicture lastSeen')
//       .populate('following', '_id');

//     const followingSet = new Set(
//       me.following.map(u => u._id.toString())
//     );

//     const mutuals = await Promise.all(
//       me.followers
//         .filter(f => followingSet.has(f._id.toString()))
//         .map(async (f) => {
//           const status = await getUserStatus(f);
//           return {
//             _id: f._id,
//             username: f.username,
//             profilePicture: f.profilePicture,
//             isFollowing: true,
//             online: status.online,
//             lastSeen: status.lastSeen,
//           };
//         })
//     );

//     return res.status(200).json({
//       success: true,
//       data: mutuals,
//     });
//   } catch (err) {
//     console.error('Mutual followers error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to load mutual followers',
//     });
//   }
// };








// const User = require('../models/user.model');
// const Post = require('../models/Post');
// const notificationService = require('../services/notification.service');
// const { getUserStatus } = require('../utils/userStatus.util');

// /**
//  * CDN BASE URL
//  */
// const CDN_BASE_URL =
//   process.env.CDN_BASE_URL ||
//   `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

// /* ================================
//    🔍 SEARCH USERS
// ================================ */
// exports.searchUsers = async (req, res) => {
//   try {
//     const q = (req.query.q || '').trim();

//     if (!q) {
//       return res.status(200).json({ success: true, data: [] });
//     }

//     const currentUser = await User.findById(req.user.id).select('following');
//     const followingSet = new Set(
//       currentUser.following.map(id => id.toString())
//     );

//     const users = await User.find({
//       username: { $regex: q, $options: 'i' },
//       _id: { $ne: req.user.id },
//     }).select('username profilePicture lastSeen');

//     const usersWithStatus = await Promise.all(
//       users.map(async (user) => {
//         const status = await getUserStatus(user);
//         return {
//           _id: user._id,
//           username: user.username,
//           profilePicture: user.profilePicture,
//           isFollowing: followingSet.has(user._id.toString()),
//           online: status.online,
//           lastSeen: status.lastSeen,
//         };
//       })
//     );

//     return res.status(200).json({
//       success: true,
//       data: usersWithStatus,
//     });
//   } catch (err) {
//     console.error('Search users error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to search users',
//     });
//   }
// };

// /* ================================
//    👤 GET USER PROFILE (PUBLIC)
// ================================ */
// exports.getUserProfile = async (req, res) => {
//   try {
//     const user = await User.findOne({
//       username: req.params.username,
//     })
//       .select('-password')
//       .populate('followers', '_id')
//       .populate('following', '_id');

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     const posts = await Post.find({ user: user._id })
//       .sort({ createdAt: -1 })
//       .select('media user createdAt')
//       .lean();

//     const currentUser = await User.findById(req.user.id).select(
//       'following followers'
//     );

//     const isFollowing = currentUser.following.some(
//       id => id.toString() === user._id.toString()
//     );

//     const theyFollowMe = user.following.some(
//       f => f._id.toString() === req.user.id.toString()
//     );

//     const canMessage = isFollowing || theyFollowMe;
//     const status = await getUserStatus(user);

//     return res.status(200).json({
//       success: true,
//       data: {
//         _id: user._id,
//         username: user.username,
//         name: user.name || '',
//         profilePicture: user.profilePicture,
//         bio: user.bio,
//         postsCount: posts.length,
//         followersCount: user.followers.length,
//         followingCount: user.following.length,
//         isFollowing,
//         canMessage,
//         online: status.online,
//         lastSeen: status.lastSeen,
//         posts,
//       },
//     });
//   } catch (err) {
//     console.error('Get profile error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to load profile',
//     });
//   }
// };

// /* ================================
//    ✏️ UPDATE PROFILE
// ================================ */
// exports.updateUserProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     const { username, bio, avatarKey } = req.body;

//     if (username) user.username = username.trim();
//     if (bio !== undefined) user.bio = bio.trim();

//     if (avatarKey) {
//       const newUrl = `${CDN_BASE_URL}/${avatarKey}`;
//       if (user.profilePicture !== newUrl) {
//         user.profilePicture = newUrl;
//       }
//     }

//     await user.save();

//     return res.status(200).json({
//       success: true,
//       data: {
//         _id: user._id,
//         username: user.username,
//         email: user.email,
//         profilePicture: user.profilePicture,
//         bio: user.bio,
//         followersCount: user.followers.length,
//         followingCount: user.following.length,
//       },
//     });
//   } catch (err) {
//     console.error('Update profile error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Profile update failed',
//     });
//   }
// };

// /* ================================
//    🔐 UPDATE PASSWORD
// ================================ */
// exports.updatePassword = async (req, res) => {
//   try {
//     const currentPassword = req.body.currentPassword?.trim();
//     const newPassword = req.body.newPassword?.trim();

//     if (!currentPassword || !newPassword) {
//       return res.status(400).json({
//         success: false,
//         message: 'Current password and new password are required',
//       });
//     }

//     if (newPassword.length < 8) {
//       return res.status(400).json({
//         success: false,
//         message: 'New password must be at least 8 characters',
//       });
//     }

//     const user = await User.findById(req.user.id).select('+password');

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     const isMatch = await user.isPasswordMatch(currentPassword);
//     if (!isMatch) {
//       return res.status(401).json({
//         success: false,
//         message: 'Current password is incorrect',
//       });
//     }

//     user.password = newPassword;
//     await user.save();

//     return res.status(200).json({
//       success: true,
//       message: 'Password updated successfully',
//     });
//   } catch (err) {
//     console.error('Update password error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to update password',
//     });
//   }
// };

// /* ================================================================
//    ========== ACCOUNT SETTINGS ==========
// ================================================================ */

// /* ================================
//    📋 GET ACCOUNT INFO
// ================================ */
// exports.getAccountInfo = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select(
//       'username email phone name gender dateOfBirth profilePicture'
//     );

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: {
//         username: user.username,
//         email: user.email,
//         phone: user.phone || '',
//         name: user.name || '',
//         gender: user.gender || '',
//         dateOfBirth: user.dateOfBirth || null,
//         profilePicture: user.profilePicture || '',
//       },
//     });
//   } catch (err) {
//     console.error('Get account info error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to load account info',
//     });
//   }
// };

// /* ================================
//    ✏️ UPDATE ACCOUNT INFO
// ================================ */
// exports.updateAccountInfo = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     const { username, email, phone, name, gender, dateOfBirth } = req.body;

//     // Username uniqueness check
//     if (username && username.trim().toLowerCase() !== user.username) {
//       const existing = await User.findOne({
//         username: username.trim().toLowerCase(),
//       });
//       if (existing) {
//         return res.status(400).json({
//           success: false,
//           message: 'Username is already taken',
//         });
//       }
//       user.username = username.trim().toLowerCase();
//     }

//     // Email uniqueness check
//     if (email && email.trim().toLowerCase() !== user.email) {
//       const existing = await User.findOne({
//         email: email.trim().toLowerCase(),
//       });
//       if (existing) {
//         return res.status(400).json({
//           success: false,
//           message: 'Email is already in use',
//         });
//       }
//       user.email = email.trim().toLowerCase();
//     }

//     if (phone !== undefined) user.phone = phone.trim();
//     if (name !== undefined) user.name = name.trim();
//     if (gender !== undefined) user.gender = gender;
//     if (dateOfBirth !== undefined) {
//       user.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
//     }

//     await user.save({ validateBeforeSave: true });

//     return res.status(200).json({
//       success: true,
//       message: 'Account updated successfully',
//       data: {
//         username: user.username,
//         email: user.email,
//         phone: user.phone,
//         name: user.name,
//         gender: user.gender,
//         dateOfBirth: user.dateOfBirth,
//       },
//     });
//   } catch (err) {
//     console.error('Update account info error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to update account info',
//     });
//   }
// };

// /* ================================================================
//    ========== PRIVACY SETTINGS ==========
// ================================================================ */

// /* ================================
//    🔒 GET PRIVACY SETTINGS
// ================================ */
// exports.getPrivacySettings = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select(
//       'isPrivate activityStatusVisible showReadReceipts'
//     );

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: {
//         isPrivate: user.isPrivate,
//         activityStatusVisible: user.activityStatusVisible,
//         showReadReceipts: user.showReadReceipts,
//       },
//     });
//   } catch (err) {
//     console.error('Get privacy settings error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to load privacy settings',
//     });
//   }
// };

// /* ================================
//    🔒 UPDATE PRIVACY SETTINGS
// ================================ */
// exports.updatePrivacySettings = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     const { isPrivate, activityStatusVisible, showReadReceipts } = req.body;

//     if (typeof isPrivate === 'boolean') user.isPrivate = isPrivate;
//     if (typeof activityStatusVisible === 'boolean')
//       user.activityStatusVisible = activityStatusVisible;
//     if (typeof showReadReceipts === 'boolean')
//       user.showReadReceipts = showReadReceipts;

//     await user.save();

//     return res.status(200).json({
//       success: true,
//       message: 'Privacy settings updated',
//       data: {
//         isPrivate: user.isPrivate,
//         activityStatusVisible: user.activityStatusVisible,
//         showReadReceipts: user.showReadReceipts,
//       },
//     });
//   } catch (err) {
//     console.error('Update privacy settings error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to update privacy settings',
//     });
//   }
// };

// /* ================================
//    🚫 BLOCK USER
// ================================ */
// exports.blockUser = async (req, res) => {
//   try {
//     const targetId = req.params.id;

//     if (targetId === req.user.id) {
//       return res.status(400).json({
//         success: false,
//         message: 'You cannot block yourself',
//       });
//     }

//     const targetUser = await User.findById(targetId);
//     if (!targetUser) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     const me = await User.findById(req.user.id);

//     const isBlocked = me.blockedUsers.includes(targetId);

//     if (isBlocked) {
//       // UNBLOCK
//       await User.findByIdAndUpdate(req.user.id, {
//         $pull: { blockedUsers: targetId },
//       });

//       return res.status(200).json({
//         success: true,
//         blocked: false,
//         message: `Unblocked @${targetUser.username}`,
//       });
//     } else {
//       // BLOCK — also unfollow each other
//       await User.findByIdAndUpdate(req.user.id, {
//         $addToSet: { blockedUsers: targetId },
//         $pull: { following: targetId },
//       });

//       await User.findByIdAndUpdate(targetId, {
//         $pull: { followers: req.user.id, following: req.user.id },
//       });

//       // Remove target from my followers too
//       await User.findByIdAndUpdate(req.user.id, {
//         $pull: { followers: targetId },
//       });

//       return res.status(200).json({
//         success: true,
//         blocked: true,
//         message: `Blocked @${targetUser.username}`,
//       });
//     }
//   } catch (err) {
//     console.error('Block user error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Block action failed',
//     });
//   }
// };

// /* ================================
//    🚫 GET BLOCKED USERS
// ================================ */
// exports.getBlockedUsers = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id)
//       .populate('blockedUsers', 'username profilePicture')
//       .select('blockedUsers');

//     return res.status(200).json({
//       success: true,
//       data: user.blockedUsers || [],
//     });
//   } catch (err) {
//     console.error('Get blocked users error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to load blocked users',
//     });
//   }
// };

// /* ================================
//    🔇 MUTE / UNMUTE USER
// ================================ */
// exports.muteUser = async (req, res) => {
//   try {
//     const targetId = req.params.id;

//     if (targetId === req.user.id) {
//       return res.status(400).json({
//         success: false,
//         message: 'You cannot mute yourself',
//       });
//     }

//     const targetUser = await User.findById(targetId);
//     if (!targetUser) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     const me = await User.findById(req.user.id);
//     const isMuted = me.mutedUsers.includes(targetId);

//     if (isMuted) {
//       await User.findByIdAndUpdate(req.user.id, {
//         $pull: { mutedUsers: targetId },
//       });

//       return res.status(200).json({
//         success: true,
//         muted: false,
//         message: `Unmuted @${targetUser.username}`,
//       });
//     } else {
//       await User.findByIdAndUpdate(req.user.id, {
//         $addToSet: { mutedUsers: targetId },
//       });

//       return res.status(200).json({
//         success: true,
//         muted: true,
//         message: `Muted @${targetUser.username}`,
//       });
//     }
//   } catch (err) {
//     console.error('Mute user error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Mute action failed',
//     });
//   }
// };

// /* ================================
//    🔇 GET MUTED USERS
// ================================ */
// exports.getMutedUsers = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id)
//       .populate('mutedUsers', 'username profilePicture')
//       .select('mutedUsers');

//     return res.status(200).json({
//       success: true,
//       data: user.mutedUsers || [],
//     });
//   } catch (err) {
//     console.error('Get muted users error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to load muted users',
//     });
//   }
// };

// /* ================================================================
//    ========== SECURITY SETTINGS ==========
// ================================================================ */

// /* ================================
//    🛡️ GET LOGIN ACTIVITY
// ================================ */
// exports.getLoginActivity = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select('loginActivity');

//     return res.status(200).json({
//       success: true,
//       data: user.loginActivity || [],
//     });
//   } catch (err) {
//     console.error('Get login activity error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to load login activity',
//     });
//   }
// };

// /* ================================
//    🛡️ TOGGLE TWO-FACTOR AUTH
// ================================ */
// exports.toggleTwoFactor = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     user.twoFactorEnabled = !user.twoFactorEnabled;
//     await user.save();

//     return res.status(200).json({
//       success: true,
//       twoFactorEnabled: user.twoFactorEnabled,
//       message: user.twoFactorEnabled
//         ? 'Two-factor authentication enabled'
//         : 'Two-factor authentication disabled',
//     });
//   } catch (err) {
//     console.error('Toggle 2FA error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to update two-factor setting',
//     });
//   }
// };

// /* ================================
//    🗑️ DELETE ACCOUNT
// ================================ */
// exports.deleteAccount = async (req, res) => {
//   try {
//     const { password } = req.body;

//     if (!password) {
//       return res.status(400).json({
//         success: false,
//         message: 'Password is required to delete account',
//       });
//     }

//     const user = await User.findById(req.user.id).select('+password');

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     const isMatch = await user.isPasswordMatch(password);
//     if (!isMatch) {
//       return res.status(401).json({
//         success: false,
//         message: 'Incorrect password',
//       });
//     }

//     // Remove user from all followers/following lists
//     await User.updateMany(
//       { followers: user._id },
//       { $pull: { followers: user._id } }
//     );
//     await User.updateMany(
//       { following: user._id },
//       { $pull: { following: user._id } }
//     );

//     // Delete user's posts
//     await Post.deleteMany({ user: user._id });

//     // Delete the user
//     await User.findByIdAndDelete(user._id);

//     return res.status(200).json({
//       success: true,
//       message: 'Account deleted successfully',
//     });
//   } catch (err) {
//     console.error('Delete account error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to delete account',
//     });
//   }
// };

// /* ================================
//    🔄 FOLLOW / UNFOLLOW
// ================================ */
// exports.followUser = async (req, res) => {
//   try {
//     const myId = req.user.id;
//     const targetId = req.params.id;

//     if (myId === targetId) {
//       return res.status(400).json({
//         success: false,
//         message: 'You cannot follow yourself',
//       });
//     }

//     const targetUser = await User.findById(targetId);
//     if (!targetUser) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     const me = await User.findById(myId).select('following');

//     const isFollowing = me.following.includes(targetId);

//     if (isFollowing) {
//       // UNFOLLOW
//       await User.findByIdAndUpdate(myId, {
//         $pull: { following: targetId },
//       });

//       await User.findByIdAndUpdate(targetId, {
//         $pull: { followers: myId },
//       });
//     } else {
//       // FOLLOW
//       await User.findByIdAndUpdate(myId, {
//         $addToSet: { following: targetId },
//       });

//       await User.findByIdAndUpdate(targetId, {
//         $addToSet: { followers: myId },
//       });

//       // Notification (safe)
//       try {
//         await notificationService.createNotification({
//           recipient: targetId,
//           sender: myId,
//           type: 'follow',
//           message: 'started following you',
//         });
//       } catch (err) {
//         console.error('Notification error:', err);
//       }
//     }

//     const updatedTarget = await User.findById(targetId).select('followers');

//     return res.status(200).json({
//       success: true,
//       following: !isFollowing,
//       followersCount: updatedTarget.followers.length,
//     });
//   } catch (err) {
//     console.error('Follow user error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Follow action failed',
//     });
//   }
// };

// /* ================================
//    👥 FOLLOWERS / FOLLOWING LIST
// ================================ */
// exports.getFollowList = async (req, res) => {
//   try {
//     const { id, type } = req.params;

//     if (!['followers', 'following'].includes(type)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid follow type',
//       });
//     }

//     const user = await User.findById(id)
//       .populate(type, 'username profilePicture lastSeen')
//       .select(type);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     const currentUser = await User.findById(req.user.id).select('following');
//     const followingSet = new Set(
//       currentUser.following.map(id => id.toString())
//     );

//     const listWithStatus = await Promise.all(
//       user[type].map(async (u) => {
//         const status = await getUserStatus(u);
//         return {
//           _id: u._id,
//           username: u.username,
//           profilePicture: u.profilePicture,
//           isFollowing: followingSet.has(u._id.toString()),
//           online: status.online,
//           lastSeen: status.lastSeen,
//         };
//       })
//     );

//     return res.status(200).json({
//       success: true,
//       data: listWithStatus,
//     });
//   } catch (err) {
//     console.error('Get follow list error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to load follow list',
//     });
//   }
// };

// /* ================================
//    ⭐ SUGGESTED USERS
// ================================ */
// exports.getSuggestedUsers = async (req, res) => {
//   try {
//     const me = await User.findById(req.user.id);

//     const users = await User.find({
//       _id: { $nin: [req.user.id, ...me.following] },
//     })
//       .select('username profilePicture lastSeen')
//       .limit(20);

//     const usersWithStatus = await Promise.all(
//       users.map(async (u) => {
//         const status = await getUserStatus(u);
//         return {
//           _id: u._id,
//           username: u.username,
//           profilePicture: u.profilePicture,
//           isFollowing: false,
//           online: status.online,
//           lastSeen: status.lastSeen,
//         };
//       })
//     );

//     return res.status(200).json({
//       success: true,
//       data: usersWithStatus,
//     });
//   } catch (err) {
//     console.error('Suggested users error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to load suggestions',
//     });
//   }
// };

// /* ================================
//    🤝 MUTUAL FOLLOWERS
// ================================ */
// exports.getMutualFollowers = async (req, res) => {
//   try {
//     const me = await User.findById(req.user.id)
//       .populate('followers', 'username profilePicture lastSeen')
//       .populate('following', '_id');

//     const followingSet = new Set(
//       me.following.map(u => u._id.toString())
//     );

//     const mutuals = await Promise.all(
//       me.followers
//         .filter(f => followingSet.has(f._id.toString()))
//         .map(async (f) => {
//           const status = await getUserStatus(f);
//           return {
//             _id: f._id,
//             username: f.username,
//             profilePicture: f.profilePicture,
//             isFollowing: true,
//             online: status.online,
//             lastSeen: status.lastSeen,
//           };
//         })
//     );

//     return res.status(200).json({
//       success: true,
//       data: mutuals,
//     });
//   } catch (err) {
//     console.error('Mutual followers error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to load mutual followers',
//     });
//   }
// };








// const User = require('../models/user.model');
// const Post = require('../models/Post');
// const notificationService = require('../services/notification.service');
// const { getUserStatus } = require('../utils/userStatus.util');

// /**
//  * CDN BASE URL
//  */
// const CDN_BASE_URL =
//   process.env.CDN_BASE_URL ||
//   `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

// /* ================================
//    🔍 SEARCH USERS
// ================================ */
// exports.searchUsers = async (req, res) => {
//   try {
//     const q = (req.query.q || '').trim();

//     if (!q) {
//       return res.status(200).json({ success: true, data: [] });
//     }

//     const currentUser = await User.findById(req.user.id).select('following');
//     const followingSet = new Set(
//       currentUser.following.map(id => id.toString())
//     );

//     const users = await User.find({
//       username: { $regex: q, $options: 'i' },
//       _id: { $ne: req.user.id },
//     }).select('username profilePicture lastSeen');

//     const usersWithStatus = await Promise.all(
//       users.map(async (user) => {
//         const status = await getUserStatus(user);
//         return {
//           _id: user._id,
//           username: user.username,
//           profilePicture: user.profilePicture,
//           isFollowing: followingSet.has(user._id.toString()),
//           online: status.online,
//           lastSeen: status.lastSeen,
//         };
//       })
//     );

//     return res.status(200).json({
//       success: true,
//       data: usersWithStatus,
//     });
//   } catch (err) {
//     console.error('Search users error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to search users',
//     });
//   }
// };

// /* ================================
//    👤 GET USER PROFILE (PUBLIC)
// ================================ */
// exports.getUserProfile = async (req, res) => {
//   try {
//     const user = await User.findOne({
//       username: req.params.username,
//     })
//       .select('-password')
//       .populate('followers', '_id')
//       .populate('following', '_id');

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     const posts = await Post.find({ user: user._id })
//       .sort({ createdAt: -1 })
//       .select('media user createdAt')
//       .lean();

//     const currentUser = await User.findById(req.user.id).select(
//       'following followers'
//     );

//     const isFollowing = currentUser.following.some(
//       id => id.toString() === user._id.toString()
//     );

//     const theyFollowMe = user.following.some(
//       f => f._id.toString() === req.user.id.toString()
//     );

//     const canMessage = isFollowing || theyFollowMe;
//     const status = await getUserStatus(user);

//     return res.status(200).json({
//       success: true,
//       data: {
//         _id: user._id,
//         username: user.username,
//         name: user.name || '',
//         profilePicture: user.profilePicture,
//         bio: user.bio,
//         postsCount: posts.length,
//         followersCount: user.followers.length,
//         followingCount: user.following.length,
//         isFollowing,
//         canMessage,
//         online: status.online,
//         lastSeen: status.lastSeen,
//         posts,
//       },
//     });
//   } catch (err) {
//     console.error('Get profile error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to load profile',
//     });
//   }
// };

// /* ================================
//    ✏️ UPDATE PROFILE
// ================================ */
// exports.updateUserProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     const { username, bio, avatarKey } = req.body;

//     if (username) user.username = username.trim();
//     if (bio !== undefined) user.bio = bio.trim();

//     if (avatarKey) {
//       const newUrl = `${CDN_BASE_URL}/${avatarKey}`;
//       if (user.profilePicture !== newUrl) {
//         user.profilePicture = newUrl;
//       }
//     }

//     await user.save();

//     return res.status(200).json({
//       success: true,
//       data: {
//         _id: user._id,
//         username: user.username,
//         email: user.email,
//         profilePicture: user.profilePicture,
//         bio: user.bio,
//         followersCount: user.followers.length,
//         followingCount: user.following.length,
//       },
//     });
//   } catch (err) {
//     console.error('Update profile error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Profile update failed',
//     });
//   }
// };

// /* ================================
//    🔐 UPDATE PASSWORD
// ================================ */
// exports.updatePassword = async (req, res) => {
//   try {
//     const currentPassword = req.body.currentPassword?.trim();
//     const newPassword = req.body.newPassword?.trim();

//     if (!currentPassword || !newPassword) {
//       return res.status(400).json({
//         success: false,
//         message: 'Current password and new password are required',
//       });
//     }

//     if (newPassword.length < 8) {
//       return res.status(400).json({
//         success: false,
//         message: 'New password must be at least 8 characters',
//       });
//     }

//     const user = await User.findById(req.user.id).select('+password');

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     const isMatch = await user.isPasswordMatch(currentPassword);
//     if (!isMatch) {
//       return res.status(401).json({
//         success: false,
//         message: 'Current password is incorrect',
//       });
//     }

//     user.password = newPassword;
//     await user.save({ validateBeforeSave: false });

//     return res.status(200).json({
//       success: true,
//       message: 'Password updated successfully',
//     });
//   } catch (err) {
//     console.error('Update password error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to update password',
//     });
//   }
// };

// /* ================================================================
//    ========== ACCOUNT SETTINGS ==========
// ================================================================ */

// /* ================================
//    📋 GET ACCOUNT INFO
// ================================ */
// exports.getAccountInfo = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select(
//       'username email phone name gender dateOfBirth profilePicture'
//     );

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: {
//         username: user.username,
//         email: user.email,
//         phone: user.phone || '',
//         name: user.name || '',
//         gender: user.gender || '',
//         dateOfBirth: user.dateOfBirth || null,
//         profilePicture: user.profilePicture || '',
//       },
//     });
//   } catch (err) {
//     console.error('Get account info error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to load account info',
//     });
//   }
// };

// /* ================================
//    ✏️ UPDATE ACCOUNT INFO
// ================================ */
// exports.updateAccountInfo = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     const { username, email, phone, name, gender, dateOfBirth } = req.body;

//     // Username uniqueness check
//     if (username && username.trim().toLowerCase() !== user.username) {
//       const existing = await User.findOne({
//         username: username.trim().toLowerCase(),
//       });
//       if (existing) {
//         return res.status(400).json({
//           success: false,
//           message: 'Username is already taken',
//         });
//       }
//       user.username = username.trim().toLowerCase();
//     }

//     // Email uniqueness check
//     if (email && email.trim().toLowerCase() !== user.email) {
//       const existing = await User.findOne({
//         email: email.trim().toLowerCase(),
//       });
//       if (existing) {
//         return res.status(400).json({
//           success: false,
//           message: 'Email is already in use',
//         });
//       }
//       user.email = email.trim().toLowerCase();
//     }

//     if (phone !== undefined) user.phone = phone.trim();
//     if (name !== undefined) user.name = name.trim();
//     if (gender !== undefined) user.gender = gender;
//     if (dateOfBirth !== undefined) {
//       user.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
//     }

//     await user.save({ validateBeforeSave: true });

//     return res.status(200).json({
//       success: true,
//       message: 'Account updated successfully',
//       data: {
//         username: user.username,
//         email: user.email,
//         phone: user.phone,
//         name: user.name,
//         gender: user.gender,
//         dateOfBirth: user.dateOfBirth,
//       },
//     });
//   } catch (err) {
//     console.error('Update account info error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to update account info',
//     });
//   }
// };

// /* ================================================================
//    ========== PRIVACY SETTINGS ==========
// ================================================================ */

// /* ================================
//    🔒 GET PRIVACY SETTINGS
// ================================ */
// exports.getPrivacySettings = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select(
//       'isPrivate activityStatusVisible showReadReceipts'
//     );

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: {
//         isPrivate: user.isPrivate,
//         activityStatusVisible: user.activityStatusVisible,
//         showReadReceipts: user.showReadReceipts,
//       },
//     });
//   } catch (err) {
//     console.error('Get privacy settings error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to load privacy settings',
//     });
//   }
// };

// /* ================================
//    🔒 UPDATE PRIVACY SETTINGS
// ================================ */
// exports.updatePrivacySettings = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     const { isPrivate, activityStatusVisible, showReadReceipts } = req.body;

//     if (typeof isPrivate === 'boolean') user.isPrivate = isPrivate;
//     if (typeof activityStatusVisible === 'boolean')
//       user.activityStatusVisible = activityStatusVisible;
//     if (typeof showReadReceipts === 'boolean')
//       user.showReadReceipts = showReadReceipts;

//     await user.save();

//     return res.status(200).json({
//       success: true,
//       message: 'Privacy settings updated',
//       data: {
//         isPrivate: user.isPrivate,
//         activityStatusVisible: user.activityStatusVisible,
//         showReadReceipts: user.showReadReceipts,
//       },
//     });
//   } catch (err) {
//     console.error('Update privacy settings error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to update privacy settings',
//     });
//   }
// };

// /* ================================
//    🚫 BLOCK USER
// ================================ */
// exports.blockUser = async (req, res) => {
//   try {
//     const targetId = req.params.id;

//     if (targetId === req.user.id) {
//       return res.status(400).json({
//         success: false,
//         message: 'You cannot block yourself',
//       });
//     }

//     const targetUser = await User.findById(targetId);
//     if (!targetUser) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     const me = await User.findById(req.user.id);

//     const isBlocked = me.blockedUsers.includes(targetId);

//     if (isBlocked) {
//       // UNBLOCK
//       await User.findByIdAndUpdate(req.user.id, {
//         $pull: { blockedUsers: targetId },
//       });

//       return res.status(200).json({
//         success: true,
//         blocked: false,
//         message: `Unblocked @${targetUser.username}`,
//       });
//     } else {
//       // BLOCK — also unfollow each other
//       await User.findByIdAndUpdate(req.user.id, {
//         $addToSet: { blockedUsers: targetId },
//         $pull: { following: targetId },
//       });

//       await User.findByIdAndUpdate(targetId, {
//         $pull: { followers: req.user.id, following: req.user.id },
//       });

//       // Remove target from my followers too
//       await User.findByIdAndUpdate(req.user.id, {
//         $pull: { followers: targetId },
//       });

//       return res.status(200).json({
//         success: true,
//         blocked: true,
//         message: `Blocked @${targetUser.username}`,
//       });
//     }
//   } catch (err) {
//     console.error('Block user error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Block action failed',
//     });
//   }
// };

// /* ================================
//    🚫 GET BLOCKED USERS
// ================================ */
// exports.getBlockedUsers = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id)
//       .populate('blockedUsers', 'username profilePicture')
//       .select('blockedUsers');

//     return res.status(200).json({
//       success: true,
//       data: user.blockedUsers || [],
//     });
//   } catch (err) {
//     console.error('Get blocked users error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to load blocked users',
//     });
//   }
// };

// /* ================================
//    🔇 MUTE / UNMUTE USER
// ================================ */
// exports.muteUser = async (req, res) => {
//   try {
//     const targetId = req.params.id;

//     if (targetId === req.user.id) {
//       return res.status(400).json({
//         success: false,
//         message: 'You cannot mute yourself',
//       });
//     }

//     const targetUser = await User.findById(targetId);
//     if (!targetUser) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     const me = await User.findById(req.user.id);
//     const isMuted = me.mutedUsers.includes(targetId);

//     if (isMuted) {
//       await User.findByIdAndUpdate(req.user.id, {
//         $pull: { mutedUsers: targetId },
//       });

//       return res.status(200).json({
//         success: true,
//         muted: false,
//         message: `Unmuted @${targetUser.username}`,
//       });
//     } else {
//       await User.findByIdAndUpdate(req.user.id, {
//         $addToSet: { mutedUsers: targetId },
//       });

//       return res.status(200).json({
//         success: true,
//         muted: true,
//         message: `Muted @${targetUser.username}`,
//       });
//     }
//   } catch (err) {
//     console.error('Mute user error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Mute action failed',
//     });
//   }
// };

// /* ================================
//    🔇 GET MUTED USERS
// ================================ */
// exports.getMutedUsers = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id)
//       .populate('mutedUsers', 'username profilePicture')
//       .select('mutedUsers');

//     return res.status(200).json({
//       success: true,
//       data: user.mutedUsers || [],
//     });
//   } catch (err) {
//     console.error('Get muted users error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to load muted users',
//     });
//   }
// };

// /* ================================================================
//    ========== SECURITY SETTINGS ==========
// ================================================================ */

// /* ================================
//    🛡️ GET LOGIN ACTIVITY
// ================================ */
// exports.getLoginActivity = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select('loginActivity');

//     return res.status(200).json({
//       success: true,
//       data: user.loginActivity || [],
//     });
//   } catch (err) {
//     console.error('Get login activity error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to load login activity',
//     });
//   }
// };

// /* ================================
//    🛡️ TOGGLE TWO-FACTOR AUTH
// ================================ */
// exports.toggleTwoFactor = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     user.twoFactorEnabled = !user.twoFactorEnabled;
//     await user.save();

//     return res.status(200).json({
//       success: true,
//       twoFactorEnabled: user.twoFactorEnabled,
//       message: user.twoFactorEnabled
//         ? 'Two-factor authentication enabled'
//         : 'Two-factor authentication disabled',
//     });
//   } catch (err) {
//     console.error('Toggle 2FA error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to update two-factor setting',
//     });
//   }
// };

// /* ================================
//    🗑️ DELETE ACCOUNT
// ================================ */
// exports.deleteAccount = async (req, res) => {
//   try {
//     const { password } = req.body;

//     if (!password) {
//       return res.status(400).json({
//         success: false,
//         message: 'Password is required to delete account',
//       });
//     }

//     const user = await User.findById(req.user.id).select('+password');

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     const isMatch = await user.isPasswordMatch(password);
//     if (!isMatch) {
//       return res.status(401).json({
//         success: false,
//         message: 'Incorrect password',
//       });
//     }

//     // Remove user from all followers/following lists
//     await User.updateMany(
//       { followers: user._id },
//       { $pull: { followers: user._id } }
//     );
//     await User.updateMany(
//       { following: user._id },
//       { $pull: { following: user._id } }
//     );

//     // Delete user's posts
//     await Post.deleteMany({ user: user._id });

//     // Delete the user
//     await User.findByIdAndDelete(user._id);

//     return res.status(200).json({
//       success: true,
//       message: 'Account deleted successfully',
//     });
//   } catch (err) {
//     console.error('Delete account error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to delete account',
//     });
//   }
// };

// /* ================================
//    🔄 FOLLOW / UNFOLLOW
// ================================ */
// exports.followUser = async (req, res) => {
//   try {
//     const myId = req.user.id;
//     const targetId = req.params.id;

//     if (myId === targetId) {
//       return res.status(400).json({
//         success: false,
//         message: 'You cannot follow yourself',
//       });
//     }

//     const targetUser = await User.findById(targetId);
//     if (!targetUser) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     const me = await User.findById(myId).select('following');

//     const isFollowing = me.following.includes(targetId);

//     if (isFollowing) {
//       // UNFOLLOW
//       await User.findByIdAndUpdate(myId, {
//         $pull: { following: targetId },
//       });

//       await User.findByIdAndUpdate(targetId, {
//         $pull: { followers: myId },
//       });
//     } else {
//       // FOLLOW
//       await User.findByIdAndUpdate(myId, {
//         $addToSet: { following: targetId },
//       });

//       await User.findByIdAndUpdate(targetId, {
//         $addToSet: { followers: myId },
//       });

//       // Notification (safe)
//       try {
//         await notificationService.createNotification({
//           recipient: targetId,
//           sender: myId,
//           type: 'follow',
//           message: 'started following you',
//         });
//       } catch (err) {
//         console.error('Notification error:', err);
//       }
//     }

//     const updatedTarget = await User.findById(targetId).select('followers');

//     return res.status(200).json({
//       success: true,
//       following: !isFollowing,
//       followersCount: updatedTarget.followers.length,
//     });
//   } catch (err) {
//     console.error('Follow user error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Follow action failed',
//     });
//   }
// };

// /* ================================
//    👥 FOLLOWERS / FOLLOWING LIST
// ================================ */
// exports.getFollowList = async (req, res) => {
//   try {
//     const { id, type } = req.params;

//     if (!['followers', 'following'].includes(type)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid follow type',
//       });
//     }

//     const user = await User.findById(id)
//       .populate(type, 'username profilePicture lastSeen')
//       .select(type);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found',
//       });
//     }

//     const currentUser = await User.findById(req.user.id).select('following');
//     const followingSet = new Set(
//       currentUser.following.map(id => id.toString())
//     );

//     const listWithStatus = await Promise.all(
//       user[type].map(async (u) => {
//         const status = await getUserStatus(u);
//         return {
//           _id: u._id,
//           username: u.username,
//           profilePicture: u.profilePicture,
//           isFollowing: followingSet.has(u._id.toString()),
//           online: status.online,
//           lastSeen: status.lastSeen,
//         };
//       })
//     );

//     return res.status(200).json({
//       success: true,
//       data: listWithStatus,
//     });
//   } catch (err) {
//     console.error('Get follow list error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to load follow list',
//     });
//   }
// };

// /* ================================
//    ⭐ SUGGESTED USERS
// ================================ */
// exports.getSuggestedUsers = async (req, res) => {
//   try {
//     const me = await User.findById(req.user.id);

//     const users = await User.find({
//       _id: { $nin: [req.user.id, ...me.following] },
//     })
//       .select('username profilePicture lastSeen')
//       .limit(20);

//     const usersWithStatus = await Promise.all(
//       users.map(async (u) => {
//         const status = await getUserStatus(u);
//         return {
//           _id: u._id,
//           username: u.username,
//           profilePicture: u.profilePicture,
//           isFollowing: false,
//           online: status.online,
//           lastSeen: status.lastSeen,
//         };
//       })
//     );

//     return res.status(200).json({
//       success: true,
//       data: usersWithStatus,
//     });
//   } catch (err) {
//     console.error('Suggested users error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to load suggestions',
//     });
//   }
// };

// /* ================================
//    🤝 MUTUAL FOLLOWERS
// ================================ */
// exports.getMutualFollowers = async (req, res) => {
//   try {
//     const me = await User.findById(req.user.id)
//       .populate('followers', 'username profilePicture lastSeen')
//       .populate('following', '_id');

//     const followingSet = new Set(
//       me.following.map(u => u._id.toString())
//     );

//     const mutuals = await Promise.all(
//       me.followers
//         .filter(f => followingSet.has(f._id.toString()))
//         .map(async (f) => {
//           const status = await getUserStatus(f);
//           return {
//             _id: f._id,
//             username: f.username,
//             profilePicture: f.profilePicture,
//             isFollowing: true,
//             online: status.online,
//             lastSeen: status.lastSeen,
//           };
//         })
//     );

//     return res.status(200).json({
//       success: true,
//       data: mutuals,
//     });
//   } catch (err) {
//     console.error('Mutual followers error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to load mutual followers',
//     });
//   }
// };






const User = require('../models/user.model');
const Post = require('../models/Post');
const notificationService = require('../services/notification.service');
const { getUserStatus } = require('../utils/userStatus.util');

/**
 * CDN BASE URL
 */
const CDN_BASE_URL =
  process.env.CDN_BASE_URL ||
  `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

/* ================================
   🔍 SEARCH USERS
================================ */
exports.searchUsers = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();

    if (!q) {
      return res.status(200).json({ success: true, data: [] });
    }

    const currentUser = await User.findById(req.user.id).select('following');
    const followingSet = new Set(
      currentUser.following.map(id => id.toString())
    );

    const users = await User.find({
      username: { $regex: q, $options: 'i' },
      _id: { $ne: req.user.id },
    }).select('username profilePicture lastSeen');

    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const status = await getUserStatus(user);
        return {
          _id: user._id,
          username: user.username,
          profilePicture: user.profilePicture,
          isFollowing: followingSet.has(user._id.toString()),
          online: status.online,
          lastSeen: status.lastSeen,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: usersWithStatus,
    });
  } catch (err) {
    console.error('Search users error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to search users',
    });
  }
};

/* ================================
   👤 GET USER PROFILE (PUBLIC)
================================ */
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username,
    })
      .select('-password')
      .populate('followers', 'username profilePicture')
      .populate('following', '_id');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .select('media user createdAt repostOf repostOfModel')
      .populate({
        path: 'repostOf',
        populate: { path: 'user', select: 'username name profilePicture' },
      })
      .lean();

    const currentUser = await User.findById(req.user.id).select(
      'following followers'
    );

    const isFollowing = currentUser.following.some(
      id => id.toString() === user._id.toString()
    );

    const theyFollowMe = user.following.some(
      f => f._id.toString() === req.user.id.toString()
    );

    const canMessage = isFollowing || theyFollowMe;
    const status = await getUserStatus(user);

    // Mutual = people I follow who also follow this profile.
    const myFollowingSet = new Set(
      currentUser.following.map(id => id.toString())
    );
    const mutualFollowers = user.followers.filter(
      f => f._id.toString() !== req.user.id.toString() && myFollowingSet.has(f._id.toString())
    );

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        name: user.name || '',
        profilePicture: user.profilePicture,
        bio: user.bio,
        location: user.location || '',
        website: user.website || '',
        isVerified: user.isVerified || false,
        createdAt: user.createdAt,
        postsCount: posts.length,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        isFollowing,
        canMessage,
        online: status.online,
        lastSeen: status.lastSeen,
        mutualCount: mutualFollowers.length,
        mutualPreview: mutualFollowers.slice(0, 6).map(f => ({
          _id: f._id,
          username: f.username,
          profilePicture: f.profilePicture,
        })),
        posts,
      },
    });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load profile',
    });
  }
};

/* ================================
   ✏️ UPDATE PROFILE
================================ */
exports.updateUserProfile = async (req, res) => {
  try {
    const { username, bio, location, website, avatarKey } = req.body;

    // Build update fields
    const updateFields = {};
    if (username) updateFields.username = username.trim();
    if (bio !== undefined) updateFields.bio = bio.trim();
    if (location !== undefined) updateFields.location = location.trim();
    if (website !== undefined) updateFields.website = website.trim();
    if (avatarKey) {
      updateFields.profilePicture = `${CDN_BASE_URL}/${avatarKey}`;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      {
        new: true,
        select:
          '_id username email profilePicture bio location website isVerified createdAt followers following',
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
        location: user.location || '',
        website: user.website || '',
        isVerified: user.isVerified || false,
        createdAt: user.createdAt,
        followersCount: user.followers.length,
        followingCount: user.following.length,
      },
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({
      success: false,
      message: 'Profile update failed',
    });
  }
};

/* ================================
   🔐 UPDATE PASSWORD
================================ */
exports.updatePassword = async (req, res) => {
  try {
    const currentPassword = req.body.currentPassword?.trim();
    const newPassword = req.body.newPassword?.trim();

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters',
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isMatch = await user.isPasswordMatch(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (err) {
    console.error('Update password error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update password',
    });
  }
};

/* ================================================================
   ========== ACCOUNT SETTINGS ==========
================================================================ */

/* ================================
   📋 GET ACCOUNT INFO
================================ */
exports.getAccountInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      'username email phone name gender dateOfBirth profilePicture twoFactorEnabled'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        username: user.username,
        email: user.email,
        phone: user.phone || '',
        name: user.name || '',
        gender: user.gender || '',
        dateOfBirth: user.dateOfBirth || null,
        profilePicture: user.profilePicture || '',
        twoFactorEnabled: user.twoFactorEnabled || false,
      },
    });
  } catch (err) {
    console.error('Get account info error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load account info',
    });
  }
};

/* ================================
   ✏️ UPDATE ACCOUNT INFO
================================ */
exports.updateAccountInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const { username, email, phone, name, gender, dateOfBirth } = req.body;

    // Username uniqueness check
    if (username && username.trim().toLowerCase() !== user.username) {
      const existing = await User.findOne({
        username: username.trim().toLowerCase(),
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken',
        });
      }
      user.username = username.trim().toLowerCase();
    }

    // Email uniqueness check
    if (email && email.trim().toLowerCase() !== user.email) {
      const existing = await User.findOne({
        email: email.trim().toLowerCase(),
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use',
        });
      }
      user.email = email.trim().toLowerCase();
    }

    if (phone !== undefined) user.phone = phone.trim();
    if (name !== undefined) user.name = name.trim();
    if (gender !== undefined) user.gender = gender;
    if (dateOfBirth !== undefined) {
      user.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    }

    await user.save({ validateBeforeSave: true });

    return res.status(200).json({
      success: true,
      message: 'Account updated successfully',
      data: {
        username: user.username,
        email: user.email,
        phone: user.phone,
        name: user.name,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
      },
    });
  } catch (err) {
    console.error('Update account info error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update account info',
    });
  }
};

/* ================================================================
   ========== PRIVACY SETTINGS ==========
================================================================ */

/* ================================
   🔒 GET PRIVACY SETTINGS
================================ */
exports.getPrivacySettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      'isPrivate activityStatusVisible showReadReceipts'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        isPrivate: user.isPrivate,
        activityStatusVisible: user.activityStatusVisible,
        showReadReceipts: user.showReadReceipts,
      },
    });
  } catch (err) {
    console.error('Get privacy settings error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load privacy settings',
    });
  }
};

/* ================================
   🔒 UPDATE PRIVACY SETTINGS
================================ */
exports.updatePrivacySettings = async (req, res) => {
  try {
    const { isPrivate, activityStatusVisible, showReadReceipts } = req.body;

    // Build only the fields that were sent
    const updateFields = {};
    if (typeof isPrivate === 'boolean') updateFields.isPrivate = isPrivate;
    if (typeof activityStatusVisible === 'boolean')
      updateFields.activityStatusVisible = activityStatusVisible;
    if (typeof showReadReceipts === 'boolean')
      updateFields.showReadReceipts = showReadReceipts;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, select: 'isPrivate activityStatusVisible showReadReceipts' }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Privacy settings updated',
      data: {
        isPrivate: user.isPrivate,
        activityStatusVisible: user.activityStatusVisible,
        showReadReceipts: user.showReadReceipts,
      },
    });
  } catch (err) {
    console.error('Update privacy settings error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update privacy settings',
    });
  }
};

/* ================================
   🚫 BLOCK USER
================================ */
exports.blockUser = async (req, res) => {
  try {
    const targetId = req.params.id;

    if (targetId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot block yourself',
      });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const me = await User.findById(req.user.id);

    const isBlocked = me.blockedUsers.includes(targetId);

    if (isBlocked) {
      // UNBLOCK
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { blockedUsers: targetId },
      });

      return res.status(200).json({
        success: true,
        blocked: false,
        message: `Unblocked @${targetUser.username}`,
      });
    } else {
      // BLOCK — also unfollow each other
      await User.findByIdAndUpdate(req.user.id, {
        $addToSet: { blockedUsers: targetId },
        $pull: { following: targetId },
      });

      await User.findByIdAndUpdate(targetId, {
        $pull: { followers: req.user.id, following: req.user.id },
      });

      // Remove target from my followers too
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { followers: targetId },
      });

      return res.status(200).json({
        success: true,
        blocked: true,
        message: `Blocked @${targetUser.username}`,
      });
    }
  } catch (err) {
    console.error('Block user error:', err);
    return res.status(500).json({
      success: false,
      message: 'Block action failed',
    });
  }
};

/* ================================
   🚫 GET BLOCKED USERS
================================ */
exports.getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('blockedUsers', 'username profilePicture')
      .select('blockedUsers');

    return res.status(200).json({
      success: true,
      data: user.blockedUsers || [],
    });
  } catch (err) {
    console.error('Get blocked users error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load blocked users',
    });
  }
};

/* ================================
   🔇 MUTE / UNMUTE USER
================================ */
exports.muteUser = async (req, res) => {
  try {
    const targetId = req.params.id;

    if (targetId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot mute yourself',
      });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const me = await User.findById(req.user.id);
    const isMuted = me.mutedUsers.includes(targetId);

    if (isMuted) {
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { mutedUsers: targetId },
      });

      return res.status(200).json({
        success: true,
        muted: false,
        message: `Unmuted @${targetUser.username}`,
      });
    } else {
      await User.findByIdAndUpdate(req.user.id, {
        $addToSet: { mutedUsers: targetId },
      });

      return res.status(200).json({
        success: true,
        muted: true,
        message: `Muted @${targetUser.username}`,
      });
    }
  } catch (err) {
    console.error('Mute user error:', err);
    return res.status(500).json({
      success: false,
      message: 'Mute action failed',
    });
  }
};

/* ================================
   🔇 GET MUTED USERS
================================ */
exports.getMutedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('mutedUsers', 'username profilePicture')
      .select('mutedUsers');

    return res.status(200).json({
      success: true,
      data: user.mutedUsers || [],
    });
  } catch (err) {
    console.error('Get muted users error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load muted users',
    });
  }
};

/* ================================================================
   ========== SECURITY SETTINGS ==========
================================================================ */

/* ================================
   🛡️ GET LOGIN ACTIVITY
================================ */
exports.getLoginActivity = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('loginActivity');

    return res.status(200).json({
      success: true,
      data: user.loginActivity || [],
    });
  } catch (err) {
    console.error('Get login activity error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load login activity',
    });
  }
};

/* ================================
   🛡️ TOGGLE TWO-FACTOR AUTH
================================ */
exports.registerPushToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Push token is required',
      });
    }

    // A device's token can migrate from another account (logout/login as
    // someone else on the same phone) — drop it everywhere else first.
    await User.updateMany(
      { pushTokens: token },
      { $pull: { pushTokens: token } }
    );

    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { pushTokens: token },
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Register push token error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to register push token',
    });
  }
};

exports.removePushToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Push token is required',
      });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { pushTokens: token },
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Remove push token error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove push token',
    });
  }
};

exports.toggleTwoFactor = async (req, res) => {
  try {
    // Step 1: Get current value
    const user = await User.findById(req.user.id).select('twoFactorEnabled');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const newValue = !user.twoFactorEnabled;

    // Step 2: Atomic update — NO .save(), NO validation
    await User.findByIdAndUpdate(
      req.user.id,
      { $set: { twoFactorEnabled: newValue } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      twoFactorEnabled: newValue,
      message: newValue
        ? 'Two-factor authentication enabled'
        : 'Two-factor authentication disabled',
    });
  } catch (err) {
    console.error('Toggle 2FA error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update two-factor setting',
    });
  }
};

/* ================================
   🗑️ DELETE ACCOUNT
================================ */
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete account',
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isMatch = await user.isPasswordMatch(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password',
      });
    }

    // Remove user from all followers/following lists
    await User.updateMany(
      { followers: user._id },
      { $pull: { followers: user._id } }
    );
    await User.updateMany(
      { following: user._id },
      { $pull: { following: user._id } }
    );

    // Delete user's posts
    await Post.deleteMany({ user: user._id });

    // Delete the user
    await User.findByIdAndDelete(user._id);

    return res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (err) {
    console.error('Delete account error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete account',
    });
  }
};

/* ================================
   🔄 FOLLOW / UNFOLLOW
================================ */
exports.followUser = async (req, res) => {
  try {
    const myId = req.user.id;
    const targetId = req.params.id;

    if (myId === targetId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself',
      });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const me = await User.findById(myId).select('following');

    const isFollowing = me.following.includes(targetId);

    if (isFollowing) {
      // UNFOLLOW
      await User.findByIdAndUpdate(myId, {
        $pull: { following: targetId },
      });

      await User.findByIdAndUpdate(targetId, {
        $pull: { followers: myId },
      });
    } else {
      // FOLLOW
      await User.findByIdAndUpdate(myId, {
        $addToSet: { following: targetId },
      });

      await User.findByIdAndUpdate(targetId, {
        $addToSet: { followers: myId },
      });

      // Notification (safe)
      try {
        await notificationService.createNotification({
          recipient: targetId,
          sender: myId,
          type: 'follow',
          message: 'started following you',
        });
      } catch (err) {
        console.error('Notification error:', err);
      }
    }

    const updatedTarget = await User.findById(targetId).select('followers');

    return res.status(200).json({
      success: true,
      following: !isFollowing,
      followersCount: updatedTarget.followers.length,
    });
  } catch (err) {
    console.error('Follow user error:', err);
    return res.status(500).json({
      success: false,
      message: 'Follow action failed',
    });
  }
};

/* ================================
   💜 CLOSE FRIENDS
================================ */
exports.getCloseFriendsCandidates = async (req, res) => {
  try {
    const me = await User.findById(req.user.id)
      .populate('following', 'username name profilePicture')
      .select('following closeFriends');

    if (!me) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const closeFriendsSet = new Set(
      me.closeFriends.map((id) => id.toString())
    );

    const data = me.following.map((u) => ({
      _id: u._id,
      username: u.username,
      name: u.name,
      profilePicture: u.profilePicture,
      isCloseFriend: closeFriendsSet.has(u._id.toString()),
    }));

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    console.error('Get close friends candidates error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load close friends',
    });
  }
};

exports.toggleCloseFriend = async (req, res) => {
  try {
    const myId = req.user.id;
    const targetId = req.params.id;

    if (myId === targetId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot add yourself as a close friend',
      });
    }

    const me = await User.findById(myId).select('closeFriends');
    const isCloseFriend = me.closeFriends.some(
      (id) => id.toString() === targetId
    );

    await User.findByIdAndUpdate(myId, {
      [isCloseFriend ? '$pull' : '$addToSet']: { closeFriends: targetId },
    });

    return res.status(200).json({
      success: true,
      isCloseFriend: !isCloseFriend,
    });
  } catch (err) {
    console.error('Toggle close friend error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update close friends',
    });
  }
};

/* ================================
   👥 FOLLOWERS / FOLLOWING LIST
================================ */
exports.getFollowList = async (req, res) => {
  try {
    const { id, type } = req.params;

    if (!['followers', 'following'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid follow type',
      });
    }

    const user = await User.findById(id)
      .populate(type, 'username profilePicture lastSeen')
      .select(type);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const currentUser = await User.findById(req.user.id).select('following');
    const followingSet = new Set(
      currentUser.following.map(id => id.toString())
    );

    const listWithStatus = await Promise.all(
      user[type].map(async (u) => {
        const status = await getUserStatus(u);
        return {
          _id: u._id,
          username: u.username,
          profilePicture: u.profilePicture,
          isFollowing: followingSet.has(u._id.toString()),
          online: status.online,
          lastSeen: status.lastSeen,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: listWithStatus,
    });
  } catch (err) {
    console.error('Get follow list error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load follow list',
    });
  }
};

/* ================================
   ⭐ SUGGESTED USERS
================================ */
exports.getSuggestedUsers = async (req, res) => {
  try {
    const me = await User.findById(req.user.id).select('following');
    const myFollowingSet = new Set(me.following.map((id) => id.toString()));

    const users = await User.find({
      _id: { $nin: [req.user.id, ...me.following] },
    })
      .select('username profilePicture lastSeen followers')
      .limit(20);

    const usersWithStatus = await Promise.all(
      users.map(async (u) => {
        const status = await getUserStatus(u);

        // Mutual = people I follow who also follow this candidate.
        const mutualCount = (u.followers || []).filter((f) =>
          myFollowingSet.has(f.toString())
        ).length;

        return {
          _id: u._id,
          username: u.username,
          profilePicture: u.profilePicture,
          isFollowing: false,
          online: status.online,
          lastSeen: status.lastSeen,
          mutualCount,
        };
      })
    );

    // Surface the most relevant (highest mutual overlap) suggestions first.
    usersWithStatus.sort((a, b) => b.mutualCount - a.mutualCount);

    return res.status(200).json({
      success: true,
      data: usersWithStatus,
    });
  } catch (err) {
    console.error('Suggested users error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load suggestions',
    });
  }
};

/* ================================
   🤝 MUTUAL FOLLOWERS
================================ */
exports.getMutualFollowers = async (req, res) => {
  try {
    const me = await User.findById(req.user.id)
      .populate('followers', 'username profilePicture lastSeen')
      .populate('following', '_id');

    const followingSet = new Set(
      me.following.map(u => u._id.toString())
    );

    const mutuals = await Promise.all(
      me.followers
        .filter(f => followingSet.has(f._id.toString()))
        .map(async (f) => {
          const status = await getUserStatus(f);
          return {
            _id: f._id,
            username: f.username,
            profilePicture: f.profilePicture,
            isFollowing: true,
            online: status.online,
            lastSeen: status.lastSeen,
          };
        })
    );

    return res.status(200).json({
      success: true,
      data: mutuals,
    });
  } catch (err) {
    console.error('Mutual followers error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load mutual followers',
    });
  }
};