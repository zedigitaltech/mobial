/**
 * Encryption utilities for secure data handling
 * Uses AES-256-GCM for encryption
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const _AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

// Get encryption key from environment or generate one
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV !== "development") {
      throw new Error(
        "ENCRYPTION_KEY environment variable is required in non-development environments",
      );
    }
    // In development, use a default key (should be set in production)
    console.warn(
      "WARNING: Using default encryption key. Set ENCRYPTION_KEY in production!",
    );
    return crypto.scryptSync("mobial-default-key", "salt", 32);
  }
  return Buffer.from(key, "hex");
}

/**
 * Encrypt sensitive data
 */
export function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);

  // Derive key with salt
  const derivedKey = crypto.scryptSync(key, salt, 32);

  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Format: salt:iv:authTag:encrypted (all hex)
  return [
    salt.toString("hex"),
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey();

  const [saltHex, ivHex, authTagHex, encryptedHex] = encryptedData.split(":");

  if (!saltHex || !ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Invalid encrypted data format");
  }

  const salt = Buffer.from(saltHex, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  // Derive key with salt
  const derivedKey = crypto.scryptSync(key, salt, 32);

  const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Hash a value (one-way)
 */
export function hash(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/**
 * Generate a secure random token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Generate a secure random code (for affiliate codes, etc.)
 */
export function generateCode(length: number = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    code += chars[randomBytes[i] % chars.length];
  }

  return code;
}

/**
 * Hash API key for storage
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

/**
 * Generate API key
 */
export function generateApiKey(): {
  key: string;
  hash: string;
  prefix: string;
} {
  const key = `mbl_${generateToken(24)}`;
  const hash = hashApiKey(key);
  const prefix = key.substring(0, 12);

  return { key, hash, prefix };
}

/**
 * Generate device fingerprint hash
 */
export function hashDeviceFingerprint(fingerprint: string): string {
  return hash(fingerprint);
}

/**
 * Constant-time comparison to prevent timing attacks.
 * Returns false for different-length inputs instead of throwing.
 */
export function secureCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
