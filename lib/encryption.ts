/**
 * Field-level encryption for sensitive data stored in the database.
 *
 * Uses AES-256-GCM (authenticated encryption) so tampering is detected.
 * Each value gets a unique random IV.
 *
 * Encrypted values are stored as: "enc:v1:<iv>:<authTag>:<ciphertext>" (all base64).
 * The "enc:v1:" prefix allows us to detect already-encrypted values and
 * support future algorithm changes.
 *
 * Requires ENCRYPTION_KEY env var — a 64-char hex string (32 bytes).
 * Generate one with: openssl rand -hex 32
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16;
const PREFIX = 'enc:v1:';

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is required. Generate one with: openssl rand -hex 32'
    );
  }
  if (hex.length !== 64) {
    throw new Error(
      'ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Generate with: openssl rand -hex 32'
    );
  }
  return Buffer.from(hex, 'hex');
}

/**
 * Encrypt a plaintext string. Returns a prefixed string safe to store in the DB.
 * Returns null if the input is null/undefined.
 */
export function encrypt(plaintext: string | null | undefined): string | null {
  if (plaintext == null) return null;

  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

/**
 * Decrypt a value previously encrypted with `encrypt()`.
 * Returns null if the input is null/undefined.
 * Throws if the value is not in the expected format or decryption fails.
 */
export function decrypt(encryptedValue: string | null | undefined): string | null {
  if (encryptedValue == null) return null;

  if (!isEncrypted(encryptedValue)) {
    // Return as-is during migration — plain-text values that haven't been
    // encrypted yet should still be readable.
    return encryptedValue;
  }

  const key = getKey();
  const payload = encryptedValue.slice(PREFIX.length);
  const parts = payload.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted value format');
  }

  const [ivB64, authTagB64, ciphertextB64] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const ciphertext = Buffer.from(ciphertextB64, 'base64');

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Check whether a value is already encrypted (has our prefix).
 */
export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

/**
 * Compute a SHA-256 hash of a value. Used for indexed lookups on encrypted
 * columns (e.g. looking up a user by API token without decrypting every row).
 */
export function hashValue(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/**
 * Encrypt sensitive keys inside a node config object.
 * Only encrypts known secret field names; other fields are left untouched.
 */
const SECRET_CONFIG_KEYS = new Set([
  'apiKey',
  'apiToken',
  'botToken',
  'token',
  'accessToken',
  'secretKey',
  'authToken',
  'authValue',
  'twilioAuthToken',
  'smtpPass',
  'resendApiKey',
  'webhookUrl', // Discord webhook URLs contain tokens
]);

/**
 * Recursively encrypt sensitive keys inside a node config object.
 * Handles nested config structures like { emailConfig: { resendApiKey: "..." } }.
 */
export function encryptConfigSecrets(config: Record<string, unknown>): Record<string, unknown> {
  const result = { ...config };
  for (const key of Object.keys(result)) {
    const value = result[key];
    if (SECRET_CONFIG_KEYS.has(key) && typeof value === 'string' && !isEncrypted(value)) {
      result[key] = encrypt(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = encryptConfigSecrets(value as Record<string, unknown>);
    }
  }
  return result;
}

/**
 * Recursively decrypt sensitive keys inside a node config object.
 */
export function decryptConfigSecrets(config: Record<string, unknown>): Record<string, unknown> {
  const result = { ...config };
  for (const key of Object.keys(result)) {
    const value = result[key];
    if (SECRET_CONFIG_KEYS.has(key) && typeof value === 'string' && isEncrypted(value)) {
      result[key] = decrypt(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = decryptConfigSecrets(value as Record<string, unknown>);
    }
  }
  return result;
}
