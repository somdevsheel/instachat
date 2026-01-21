// import nacl from 'tweetnacl';
// import { encodeBase64, decodeUTF8 } from 'tweetnacl-util';
// import api from '../../services/api';
// import { getSharedSecret } from './keyGeneration';

// /**
//  * Encrypt message for ALL receiver devices
//  */
// export const encryptMessage = async ({ text, receiverId }) => {
//   if (!text || !receiverId) {
//     throw new Error('Missing text or receiverId');
//   }

//   console.log('🔐 Encrypting message for:', receiverId);

//   // 1️⃣ Fetch ALL receiver device keys
//   const res = await api.get(`/keys/${receiverId}`);
//   const devices = res.data?.data;

//   if (!Array.isArray(devices) || devices.length === 0) {
//     throw new Error('Receiver has not set up encryption yet');
//   }

//   // 2️⃣ Encrypt per device
//   const encryptedPayloads = [];

//   for (const device of devices) {
//     const { deviceId, publicKey } = device;

//     if (!deviceId || !publicKey) continue;

//     const sharedKey = await getSharedSecret(publicKey);
//     const nonce = nacl.randomBytes(nacl.box.nonceLength);
//     const cipher = nacl.box.after(
//       decodeUTF8(text),
//       nonce,
//       sharedKey
//     );

//     encryptedPayloads.push({
//       deviceId,
//       cipherText: encodeBase64(cipher),
//       nonce: encodeBase64(nonce),
//     });
//   }

//   if (encryptedPayloads.length === 0) {
//     throw new Error('No valid encryption targets');
//   }

//   console.log(
//     `✅ Encrypted for ${encryptedPayloads.length} device(s)`
//   );

//   return encryptedPayloads;
// };





// import nacl from 'tweetnacl';
// import { encodeBase64, decodeUTF8 } from 'tweetnacl-util';
// import api from '../../services/api';
// import { getSharedSecret, getOrCreateKeyPair } from './keyGeneration';

// /**
//  * Encrypt message for ALL receiver devices
//  */
// export const encryptMessage = async ({ text, receiverId }) => {
//   if (!text || !receiverId) {
//     throw new Error('Missing text or receiverId');
//   }

//   // 🔐 GUARANTEE local device identity exists
//   await getOrCreateKeyPair();

//   console.log('🔐 Encrypting message for:', receiverId);

//   // 1️⃣ Fetch ALL receiver device keys
//   const res = await api.get(`/keys/${receiverId}`);
//   const devices = res.data?.data;

//   if (!Array.isArray(devices) || devices.length === 0) {
//     throw new Error('Receiver has no registered devices');
//   }

//   // 2️⃣ Encrypt per device
//   const encryptedPayloads = [];

//   for (const device of devices) {
//     const { deviceId, publicKey } = device;
//     if (!deviceId || !publicKey) continue;

//     const sharedKey = await getSharedSecret(publicKey);
//     const nonce = nacl.randomBytes(nacl.box.nonceLength);

//     const cipher = nacl.box.after(
//       decodeUTF8(text),
//       nonce,
//       sharedKey
//     );

//     encryptedPayloads.push({
//       deviceId,
//       cipherText: encodeBase64(cipher),
//       nonce: encodeBase64(nonce),
//     });
//   }

//   if (encryptedPayloads.length === 0) {
//     throw new Error('No valid encryption targets');
//   }

//   console.log(`✅ Encrypted for ${encryptedPayloads.length} device(s)`);
//   return encryptedPayloads;
// };



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

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 ENCRYPTION START');
  console.log('📤 Encrypting for receiver:', receiverId);
  console.log('📝 Message text:', text.substring(0, 20) + '...');

  try {
    // 1️⃣ Fetch ALL receiver device keys
    console.log('📡 Fetching receiver keys...');
    const res = await api.get(`/keys/${receiverId}`);
    const devices = res.data?.data;

    console.log('📦 API Response:', {
      success: res.data?.success,
      dataType: typeof res.data?.data,
      isArray: Array.isArray(devices),
      deviceCount: devices?.length,
    });

    if (!Array.isArray(devices)) {
      console.error('❌ Invalid response format!');
      console.error('Expected array, got:', typeof devices);
      console.error('Full response:', JSON.stringify(res.data, null, 2));
      throw new Error('Invalid response format from server');
    }

    if (devices.length === 0) {
      console.error('❌ Receiver has no devices!');
      throw new Error('Receiver has not set up encryption yet');
    }

    console.log(`✅ Found ${devices.length} receiver device(s):`);
    devices.forEach((device, idx) => {
      console.log(`  ${idx + 1}. deviceId: ${device.deviceId}`);
      console.log(`     publicKey: ${device.publicKey?.substring(0, 20)}...`);
    });

    // 2️⃣ Encrypt per device
    const encryptedPayloads = [];

    for (let i = 0; i < devices.length; i++) {
      const device = devices[i];
      const { deviceId, publicKey } = device;

      console.log(`\n🔐 Encrypting for device ${i + 1}/${devices.length}:`);
      console.log(`   deviceId: ${deviceId}`);

      if (!deviceId) {
        console.warn(`⚠️ Device ${i + 1} missing deviceId, skipping`);
        continue;
      }

      if (!publicKey) {
        console.warn(`⚠️ Device ${i + 1} missing publicKey, skipping`);
        continue;
      }

      try {
        const sharedKey = await getSharedSecret(publicKey);
        const nonce = nacl.randomBytes(nacl.box.nonceLength);
        const cipher = nacl.box.after(
          decodeUTF8(text),
          nonce,
          sharedKey
        );

        const payload = {
          deviceId,
          cipherText: encodeBase64(cipher),
          nonce: encodeBase64(nonce),
        };

        encryptedPayloads.push(payload);
        console.log(`   ✅ Encrypted successfully`);
        console.log(`   cipherText length: ${payload.cipherText.length}`);
        console.log(`   nonce length: ${payload.nonce.length}`);
      } catch (deviceErr) {
        console.error(`   ❌ Encryption failed:`, deviceErr.message);
        // Continue with other devices
      }
    }

    if (encryptedPayloads.length === 0) {
      console.error('❌ No valid encryption targets!');
      throw new Error('No valid encryption targets');
    }

    console.log(`\n✅ ENCRYPTION COMPLETE`);
    console.log(`📦 Created ${encryptedPayloads.length} payload(s):`);
    encryptedPayloads.forEach((p, idx) => {
      console.log(`  ${idx + 1}. deviceId: ${p.deviceId}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return encryptedPayloads;
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ ENCRYPTION FAILED');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    throw error;
  }
};