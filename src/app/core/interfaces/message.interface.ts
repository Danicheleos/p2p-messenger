/**
 * Message interface for chat messages
 */
export interface Message {
  id: string; // UUID
  senderId: string; // User ID
  recipientId: string; // Contact ID
  content: string; // Encrypted message content
  attachment?: {
    type: 'image';
    data: string; // Base64 or blob URL
    filename: string;
    size: number;
  };
  timestamp: Date;
  encrypted: boolean;
  delivered: boolean;
  read: boolean;
}

