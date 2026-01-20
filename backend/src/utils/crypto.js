const crypto = require('crypto');

const algorithm = 'aes-256-cbc'; // Advanced Encryption Standard
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * secretKey derivation
 * We take the simple string from .env and hash it to ensure it is exactly 32 bytes
 * which is required by aes-256.
 */
const getSecretKey = () => {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is missing in .env file');
  }
  return crypto
    .createHash('sha256')
    .update(String(process.env.ENCRYPTION_KEY))
    .digest('base64')
    .substr(0, 32);
};

/**
 * Encrypt Text
 * @param {String} text - The plaintext message (e.g., "Hello World")
 * @returns {String} - format: "iv:encryptedText"
 */
exports.encrypt = (text) => {
  if (!text) return text;

  // 1. Generate a random Initialization Vector (IV)
  // This ensures that "Hello" encrypted twice results in different outputs
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // 2. Create Cipher
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(getSecretKey()), iv);
  
  // 3. Encrypt
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  // 4. Return IV + Encrypted Data (separated by :)
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

/**
 * Decrypt Text
 * @param {String} text - The encrypted string "iv:encryptedText"
 * @returns {String} - The original plaintext
 */
exports.decrypt = (text) => {
  if (!text) return text;

  try {
    const textParts = text.split(':');
    
    // Check format
    if (textParts.length !== 2) return text; 

    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(getSecretKey()), iv);
    
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  } catch (error) {
    // If decryption fails (e.g., wrong key), return null or original text
    console.error('Decryption failed:', error.message);
    return null; 
  }
};