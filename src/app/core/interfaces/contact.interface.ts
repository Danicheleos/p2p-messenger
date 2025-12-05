/**
 * Contact interface for user contacts
 */
export interface Contact {
  id: string;
  username: string;
  publicKey: string; // Base64 encoded public key
  userId: string; // Owner's user ID
  createdAt: Date;
  lastMessageTimestamp?: Date;
  unreadCount?: number;
}

