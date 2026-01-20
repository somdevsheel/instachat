import nacl from 'tweetnacl';
import { encodeBase64, decodeUTF8 } from 'tweetnacl-util';
import api from '../../services/api';
import { getSharedSecret } from './keyGeneration';

/**
 * Encrypt message for ALL receiver devices
 */
export const encryptMessage = async ({ text, receiverId }) => {
  if (!text || !receiverId) {
    throw new Error('Missing text or receiverId');
  }

  console.log('🔐 Encrypting message for:', receiverId);

  // 1️⃣ Fetch ALL receiver device keys
  const res = await api.get(`/keys/${receiverId}`);
  const devices = res.data?.data;

  if (!Array.isArray(devices) || devices.length === 0) {
    throw new Error('Receiver has not set up encryption yet');
  }

  // 2️⃣ Encrypt per device
  const encryptedPayloads = [];

  for (const device of devices) {
    const { deviceId, publicKey } = device;

    if (!deviceId || !publicKey) continue;

    const sharedKey = await getSharedSecret(publicKey);
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const cipher = nacl.box.after(
      decodeUTF8(text),
      nonce,
      sharedKey
    );

    encryptedPayloads.push({
      deviceId,
      cipherText: encodeBase64(cipher),
      nonce: encodeBase64(nonce),
    });
  }

  if (encryptedPayloads.length === 0) {
    throw new Error('No valid encryption targets');
  }

  console.log(
    `✅ Encrypted for ${encryptedPayloads.length} device(s)`
  );

  return encryptedPayloads;
};
