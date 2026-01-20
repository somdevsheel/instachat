import nacl from 'tweetnacl';
import { decodeBase64, encodeUTF8 } from 'tweetnacl-util';
import api from '../../services/api';
import { getSharedSecret, hasLocalKeyPair } from './keyGeneration';

/* =========================
   IN-MEMORY CACHES
========================= */
const publicKeyCache = new Map();
const sharedSecretCache = new Map();

/**
 * 🔓 Decrypt an E2EE message
 * @param {Object} params
 * @param {string} params.cipherText - Base64 encrypted text
 * @param {string} params.nonce - Base64 nonce
 * @param {string} params.senderId - Sender's user ID
 * @returns {Promise<string>} Decrypted plain text
 */
export const decryptMessage = async ({
  cipherText,
  nonce,
  senderId,
}) => {
  if (!cipherText || !nonce || !senderId) {
    throw new Error('Missing decrypt parameters');
  }

  // 🔒 HARD GUARD: E2EE must be ready
  const hasKeys = await hasLocalKeyPair();
  if (!hasKeys) {
    console.warn('⚠️ E2EE not initialized, skipping decrypt');
    return '[Encrypted message]';
  }

  try {
    /* =========================
       1️⃣ GET SENDER PUBLIC KEY
    ========================= */
    let senderPublicKey = publicKeyCache.get(senderId);

    if (!senderPublicKey) {
      const res = await api.get(`/keys/${senderId}`);
      const devices = res.data?.data;

      if (!Array.isArray(devices) || devices.length === 0) {
        throw new Error('Sender public key not found');
      }

      // ✅ Use first device's key (or implement device selection logic)
      senderPublicKey = devices[0].publicKey;

      if (!senderPublicKey) {
        throw new Error('Invalid sender public key');
      }

      publicKeyCache.set(senderId, senderPublicKey);
    }

    /* =========================
       2️⃣ GET SHARED SECRET
    ========================= */
    let sharedKey = sharedSecretCache.get(senderId);

    if (!sharedKey) {
      sharedKey = await getSharedSecret(senderPublicKey);
      sharedSecretCache.set(senderId, sharedKey);
    }

    /* =========================
       3️⃣ DECRYPT MESSAGE
    ========================= */
    const decrypted = nacl.box.open.after(
      decodeBase64(cipherText),
      decodeBase64(nonce),
      sharedKey
    );

    if (!decrypted) {
      throw new Error('Decryption failed - invalid signature or corrupted data');
    }

    return encodeUTF8(decrypted);
  } catch (error) {
    // Clear cache on error to retry next time
    publicKeyCache.delete(senderId);
    sharedSecretCache.delete(senderId);
    
    // Don't log - let caller decide whether to log
    throw error;
  }
};

/**
 * 🗑️ Clear decryption caches (e.g., on logout)
 */
export const clearDecryptionCache = () => {
  publicKeyCache.clear();
  sharedSecretCache.clear();
  console.log('🧹 Decryption cache cleared');
};