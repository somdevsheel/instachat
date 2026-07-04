import api from '../services/api';

/**
 * ======================================================
 * REPORT API
 * ======================================================
 * POST /api/v1/reports
 *
 * @param {Object} data
 * @param {string} data.targetType - 'post' | 'reel' | 'story' | 'comment' | 'user'
 * @param {string} data.targetId   - ID of the content being reported
 * @param {string} data.reason     - One of: spam, harassment, hate_speech, violence,
 *                                   nudity, false_information, scam,
 *                                   intellectual_property, self_harm, other
 * @param {string} [data.description] - Optional additional details
 */
export const submitReport = async ({ targetType, targetId, reason, description }) => {
  const res = await api.post("/reports", {
    targetType,
    targetId,
    reason,
    description: description || "",
  });
  return res.data;
};