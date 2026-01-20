const keyCache = new Map();

export const getCachedPublicKey = (userId) => {
  return keyCache.get(userId);
};

export const setCachedPublicKey = (userId, publicKey) => {
  keyCache.set(userId, publicKey);
};
