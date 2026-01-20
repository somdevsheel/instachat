import api from '../../services/api';
import Storage from '../storage';
import { getOrCreateKeyPair } from './keyGeneration';
import { getDeviceId } from '../deviceId';

export const initE2EE = async () => {
  try {
    const token = await Storage.getToken();
    if (!token) return;

    const deviceId = await getDeviceId();
    const { publicKey } = await getOrCreateKeyPair();

    const res = await api.get('/keys/me');

    const alreadyRegistered = res.data?.data?.some(
      k => k.deviceId === deviceId
    );

    if (alreadyRegistered) {
      console.log('🔐 Device key already registered');
      return;
    }

    await api.post('/keys', {
      identityPublicKey: publicKey,
      deviceId,
    });

    console.log('🔐 Device key registered:', deviceId);
  } catch (err) {
    console.warn('⚠️ E2EE init failed:', err.message);
  }
};
