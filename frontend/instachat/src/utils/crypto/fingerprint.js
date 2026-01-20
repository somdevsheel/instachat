import sodium from 'react-native-libsodium';

/**
 * Generates a human-verifiable fingerprint (safety number)
 */
export const generateFingerprint = async (
  identityPublicKey,
  signingPublicKey
) => {
  await sodium.ready;

  const combined = identityPublicKey + signingPublicKey;

  const hash = sodium.crypto_generichash(
    32,
    sodium.from_string(combined)
  );

  return sodium.to_hex(hash);
};
