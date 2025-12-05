/**
 * Encryption constants and configuration
 */
export const ENCRYPTION_CONFIG = {
  ALGORITHM: {
    NAME: 'RSA-OAEP' as const,
    MODULUS_LENGTH: 2048,
    PUBLIC_EXPONENT: new Uint8Array([1, 0, 1]),
    HASH: 'SHA-256' as const
  },
  KEY_USAGE: ['encrypt', 'decrypt'] as const,
  MAX_MESSAGE_SIZE: 245 // RSA-OAEP 2048-bit can encrypt ~245 bytes
} as const;

