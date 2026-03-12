import { encrypt, decrypt } from '@/lib/encryption';

/**
 * Encrypt an eSIM field value for storage.
 * Returns encrypted string, or undefined if input is falsy.
 */
export function encryptEsimField(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  return encrypt(value);
}

/**
 * Decrypt an eSIM field value from storage.
 * Backward-compatible: detects legacy plaintext (no colons in expected format)
 * and returns it as-is. Encrypted format is salt:iv:authTag:encrypted (4 colon-separated hex segments).
 */
export function decryptEsimField(value: string | null | undefined): string | undefined {
  if (!value) return undefined;

  // Encrypted format has exactly 4 colon-separated hex segments
  const parts = value.split(':');
  if (parts.length === 4 && parts.every(p => /^[0-9a-f]+$/i.test(p))) {
    return decrypt(value);
  }

  // Legacy plaintext — return as-is
  return value;
}
