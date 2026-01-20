// const Key = require('../models/key.model');

// /**
//  * ======================================
//  * GET USER PUBLIC KEY
//  * GET /api/v1/keys/:userId
//  * ======================================
//  */
// exports.getUserKeys = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     // 🔒 Hard guard (prevents crashes forever)
//     if (!userId || userId === 'undefined') {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid userId',
//       });
//     }

//     // ✅ Correct variable name
//     const userKey = await Key.findOne({ user: userId });

//     if (!userKey) {
//       return res.status(404).json({
//         success: false,
//         message: 'Public key not found',
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: {
//         publicKey: userKey.identityPublicKey, // ✅ FIXED: was userKey.publicKey
//       },
//     });
//   } catch (err) {
//     console.error('Key fetch error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Server error',
//     });
//   }
// };


// /**
//  * ======================================
//  * UPLOAD/UPDATE USER PUBLIC KEY
//  * POST /api/v1/keys
//  * ======================================
//  */
// exports.upsertKeys = async (req, res) => {
//   try {
//     const userId = req.user.id; // from auth middleware
//     const { identityPublicKey } = req.body;

//     if (!identityPublicKey) {
//       return res.status(400).json({
//         success: false,
//         message: 'identityPublicKey is required',
//       });
//     }

//     const key = await Key.findOneAndUpdate(
//       { user: userId },
//       { identityPublicKey },
//       { upsert: true, new: true }
//     );

//     return res.status(200).json({
//       success: true,
//       message: 'Public key saved',
//       data: {
//         publicKey: key.identityPublicKey,
//       },
//     });
//   } catch (err) {
//     console.error('Key upsert error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Server error',
//     });
//   }
// };



// /// get my key
// exports.getMyKey = async (req, res) => {
//   const key = await Key.findOne({ user: req.user.id });

//   res.status(200).json({
//     success: true,
//     data: key || null,
//   });
// };



const Key = require('../models/key.model');

/**
 * GET ALL DEVICE KEYS OF A USER
 * GET /api/v1/keys/:userId
 */
exports.getUserKeys = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || userId === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Invalid userId',
      });
    }

    const keys = await Key.find({ user: userId });

    return res.status(200).json({
      success: true,
      data: keys.map(k => ({
        deviceId: k.deviceId,
        publicKey: k.identityPublicKey,
      })),
    });
  } catch (err) {
    console.error('Get user keys error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user keys',
    });
  }
};

/**
 * UPSERT DEVICE KEY
 * POST /api/v1/keys
 */
exports.upsertKeys = async (req, res) => {
  try {
    const userId = req.user.id;
    const { identityPublicKey, deviceId } = req.body;

    if (!identityPublicKey || !deviceId) {
      return res.status(400).json({
        success: false,
        message: 'identityPublicKey and deviceId required',
      });
    }

    const key = await Key.findOneAndUpdate(
      { user: userId, deviceId },
      {
        identityPublicKey,
        lastSeenAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      data: {
        deviceId: key.deviceId,
        publicKey: key.identityPublicKey,
      },
    });
  } catch (err) {
    console.error('Upsert key error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to save key',
    });
  }
};

/**
 * GET MY DEVICE KEYS
 * GET /api/v1/keys/me
 */
exports.getMyKey = async (req, res) => {
  try {
    const keys = await Key.find({ user: req.user.id });

    return res.status(200).json({
      success: true,
      data: keys.map(k => ({
        deviceId: k.deviceId,
        publicKey: k.identityPublicKey,
        lastSeenAt: k.lastSeenAt,
      })),
    });
  } catch (err) {
    console.error('Get my keys error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch keys',
    });
  }
};





