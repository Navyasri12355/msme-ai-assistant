import crypto from 'crypto';
import config from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Derive a 32-byte key from the encryption key in config
 */
function getEncryptionKey(): Buffer {
  const key = config.encryption.key;
  // Use SHA-256 to derive a consistent 32-byte key
  return crypto.createHash('sha256').update(key).digest();
}

/**
 * Encrypt sensitive data using AES-256-GCM
 * Returns encrypted data in format: iv:authTag:encryptedData (all base64 encoded)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    return plaintext;
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();
  
  // Combine iv, authTag, and encrypted data
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt data encrypted with encrypt()
 * Expects format: iv:authTag:encryptedData (all base64 encoded)
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) {
    return ciphertext;
  }

  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }

  const [ivBase64, authTagBase64, encryptedBase64] = parts;
  
  const key = getEncryptionKey();
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const encrypted = Buffer.from(encryptedBase64, 'base64');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString('utf8');
}

/**
 * Encrypt a number (converts to string, encrypts, returns encrypted string)
 */
export function encryptNumber(value: number): string {
  return encrypt(value.toString());
}

/**
 * Decrypt a number (decrypts string, converts back to number)
 */
export function decryptNumber(ciphertext: string): number {
  const decrypted = decrypt(ciphertext);
  return parseFloat(decrypted);
}

/**
 * Check if a value is encrypted (has the expected format)
 */
export function isEncrypted(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }
  const parts = value.split(':');
  return parts.length === 3;
}
