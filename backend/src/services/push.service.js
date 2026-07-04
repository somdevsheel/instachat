const { Expo } = require('expo-server-sdk');
const User = require('../models/user.model');

const expo = new Expo();

/**
 * Send a push notification to every registered device of the given users.
 * Silently drops malformed tokens and prunes tokens Expo reports as dead.
 */
exports.sendPushToUsers = async (userIds, { title, body, data = {} }) => {
  const ids = Array.isArray(userIds) ? userIds : [userIds];

  const users = await User.find({ _id: { $in: ids } }).select('pushTokens');
  const tokenToUser = new Map();

  for (const user of users) {
    for (const token of user.pushTokens || []) {
      if (Expo.isExpoPushToken(token)) {
        tokenToUser.set(token, user._id.toString());
      }
    }
  }

  const tokens = [...tokenToUser.keys()];
  if (tokens.length === 0) return;

  const messages = tokens.map((token) => ({
    to: token,
    sound: 'default',
    title,
    body,
    data,
  }));

  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  for (const chunk of chunks) {
    try {
      const receipts = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...receipts);
    } catch (err) {
      console.error('Push send error:', err.message);
    }
  }

  scheduleReceiptCheck(tokens, tickets);
};

/**
 * Expo delivery receipts aren't ready immediately after sending.
 * Check them after a delay and drop tokens Expo says are no longer valid
 * (e.g. app uninstalled) so we stop pushing to dead devices.
 */
function scheduleReceiptCheck(tokens, tickets) {
  const receiptIds = tickets
    .filter((t) => t.status === 'ok' && t.id)
    .map((t) => t.id);

  if (receiptIds.length === 0) return;

  setTimeout(async () => {
    try {
      const chunks = expo.chunkPushNotificationReceiptIds(receiptIds);
      const deadTokens = [];

      for (let i = 0; i < chunks.length; i++) {
        const receipts = await expo.getPushNotificationReceiptsAsync(chunks[i]);
        for (const [receiptId, receipt] of Object.entries(receipts)) {
          if (
            receipt.status === 'error' &&
            receipt.details?.error === 'DeviceNotRegistered'
          ) {
            const idx = tickets.findIndex((t) => t.id === receiptId);
            if (idx !== -1) deadTokens.push(tokens[idx]);
          }
        }
      }

      if (deadTokens.length > 0) {
        await User.updateMany(
          { pushTokens: { $in: deadTokens } },
          { $pull: { pushTokens: { $in: deadTokens } } }
        );
      }
    } catch (err) {
      console.error('Push receipt check error:', err.message);
    }
  }, 20000);
}
