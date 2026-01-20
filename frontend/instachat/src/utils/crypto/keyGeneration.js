import nacl from 'tweetnacl';
import {
  encodeBase64,
  decodeBase64,
} from 'tweetnacl-util';
import * as SecureStore from 'expo-secure-store';

const IDENTITY_KEY = 'identity_keypair';

/* =========================
   CREATE OR LOAD KEYPAIR
========================= */
export const getOrCreateKeyPair = async () => {
  const existing = await SecureStore.getItemAsync(IDENTITY_KEY);

  if (existing) {
    return JSON.parse(existing);
  }

  const keyPair = nacl.box.keyPair();

  const stored = {
    publicKey: encodeBase64(keyPair.publicKey),
    secretKey: encodeBase64(keyPair.secretKey),
  };

  await SecureStore.setItemAsync(
    IDENTITY_KEY,
    JSON.stringify(stored)
  );

  return stored;
};

/* =========================
   CHECK IF LOCAL KEYS EXIST
========================= */
export const hasLocalKeyPair = async () => {
  const stored = await SecureStore.getItemAsync(IDENTITY_KEY);
  return !!stored;
};

/* =========================
   GET MY PUBLIC KEY
========================= */
export const getIdentityPublicKey = async () => {
  const stored = await SecureStore.getItemAsync(IDENTITY_KEY);
  if (!stored) {
    throw new Error('Identity keys not found');
  }

  return JSON.parse(stored).publicKey;
};

/* =========================
   DERIVE SHARED SECRET
========================= */
export const getSharedSecret = async (theirPublicKeyBase64) => {
  if (!theirPublicKeyBase64) {
    throw new Error('Missing public key');
  }

  const stored = await SecureStore.getItemAsync(IDENTITY_KEY);
  if (!stored) {
    throw new Error('Identity keys not found');
  }

  const { secretKey } = JSON.parse(stored);

  return nacl.box.before(
    decodeBase64(theirPublicKeyBase64),
    decodeBase64(secretKey)
  );
};
