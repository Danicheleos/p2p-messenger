/**
 * Encrypted content structure for hybrid encryption
 */
export interface EncryptedContent {
  encryptedData: string; // Base64 encoded encrypted data
  encryptedKey: string; // Base64 encoded encrypted AES key
  iv: string; // Base64 encoded initialization vector
}

/**
 * Message integrity signature (HMAC)
 */
export interface MessageSignature {
  hmac: string; // Base64 encoded HMAC-SHA256
  timestamp: number; // Message timestamp for replay protection
}

/**
 * Message interface for chat messages
 */
export interface Message {
  id: string; // UUID
  senderId: string; // User ID
  recipientId: string; // Contact ID
  content: string; // Plain text content (decrypted) or encrypted content structure (when encrypted)
  encryptedContent?: EncryptedContent; // Encrypted content structure (for sending/storage)
  attachment?: {
    type: 'image';
    data: string; // Base64 or blob URL (decrypted) or encrypted content structure
    encryptedData?: EncryptedContent; // Encrypted attachment data (for sending/storage)
    filename: string;
    size: number;
  };
  timestamp: Date;
  encrypted: boolean; // Whether the message is encrypted
  delivered: boolean;
  read: boolean;
}

