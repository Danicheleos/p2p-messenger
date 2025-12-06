import { Injectable, signal, computed, inject } from '@angular/core';
import { StorageService } from './storage.service';
import { UserService } from './user.service';
import { ContactService } from './contact.service';
import { P2PService } from './p2p.service';
import { EncryptionService } from './encryption.service';
import { ErrorService } from './error.service';
import { Message, EncryptedContent } from '../interfaces';
import { SanitizationUtil } from '../utils/sanitization.util';

/**
 * Message Service - Handles message operations using Angular Signals
 */
@Injectable({ providedIn: 'root' })
export class MessageService {
  private storageService = inject(StorageService);
  private userService = inject(UserService);
  private contactService = inject(ContactService);
  private p2pService = inject(P2PService);
  private encryptionService = inject(EncryptionService);
  private errorService = inject(ErrorService);

  private _messages = signal<Message[]>([]);
  private _currentContactId = signal<string | null>(null);
  private messageUnsubscribers = new Map<string, () => void>();

  readonly messages = this._messages.asReadonly();
  readonly currentContactId = this._currentContactId.asReadonly();
  readonly unreadCount = computed(() => {
    return this._messages().filter(m => !m.read && m.recipientId === this.userService.currentUser()?.id).length;
  });

  /**
   * Load messages for a contact
   */
  async loadMessages(contactId: string): Promise<void> {
    const user = this.userService.currentUser();
    if (!user) {
      this._messages.set([]);
      return;
    }

    try {
      const messages = await this.storageService.getMessages(contactId, user.id);
      this._messages.set(messages);
      this._currentContactId.set(contactId);
      
      // Set up P2P message listener for this contact
      this.setupMessageListener(contactId);
      
      // Mark messages as read
      await this.markAsRead(contactId);
    } catch (error) {
      console.error('Error loading messages:', error);
      this._messages.set([]);
    }
  }

  /**
   * Clear messages (when no contact is selected)
   */
  clearMessages(): void {
    // Clean up message listeners
    const currentContactId = this._currentContactId();
    if (currentContactId) {
      const unsubscribe = this.messageUnsubscribers.get(currentContactId);
      if (unsubscribe) {
        unsubscribe();
        this.messageUnsubscribers.delete(currentContactId);
      }
    }
    
    this._messages.set([]);
    this._currentContactId.set(null);
  }

  /**
   * Send a message via P2P connection with encryption
   */
  async sendMessage(text: string, contactId: string, attachment?: File): Promise<void> {
    const user = this.userService.currentUser();
    if (!user) {
      throw new Error('User must be authenticated to send messages');
    }

    // Sanitize message content to prevent XSS
    const sanitizedText = SanitizationUtil.sanitizeMessage(text);

    // Get contact to access their public key
    const contact = this.contactService.contacts().find(c => c.id === contactId);
    if (!contact) {
      throw new Error('Contact not found');
    }

    let recipientPublicKey: CryptoKey;
    try {
      // Import recipient's public key
      recipientPublicKey = await this.encryptionService.importPublicKey(contact.publicKey);
    } catch (error) {
      await this.errorService.handleError(error, 'importing contact public key');
      throw error;
    }

    let encryptedContent: EncryptedContent;
    try {
      // Encrypt message content (use sanitized text)
      encryptedContent = await this.encryptionService.encryptMessageHybrid(sanitizedText, recipientPublicKey);
    } catch (error) {
      await this.errorService.handleError(error, 'encrypting message');
      throw error;
    }

    // Prepare attachment data
    let attachmentData: Message['attachment'] | undefined;
    let encryptedAttachment: EncryptedContent | undefined;

    if (attachment) {
      try {
        // Convert file to base64
        const base64Data = await this.fileToBase64(attachment);
        
        if (base64Data) {
          // Extract MIME type from data URL
          const mimeType = base64Data.data.split(';')[0].split(':')[1] || 'image/jpeg';
          
          // Encrypt attachment data (only the base64 part, not the data URL prefix)
          encryptedAttachment = await this.encryptionService.encryptAttachmentHybrid(
            base64Data.data,
            recipientPublicKey
          );

          // Store both encrypted and decrypted (for local display)
          attachmentData = {
            type: 'image',
            data: base64Data.data,
            filename: base64Data.filename,
            size: base64Data.size,
            encryptedData: encryptedAttachment
          };
        }
      } catch (error) {
        await this.errorService.handleError(error, 'processing attachment');
        throw error;
      }
    }

    // Create message object for local storage (with plain text for display)
    const message: Message = {
      id: crypto.randomUUID(),
      senderId: user.id,
      recipientId: contactId,
      content: sanitizedText, // Sanitized plain text for local display
      encryptedContent: encryptedContent, // Encrypted content for transmission
      attachment: attachmentData,
      timestamp: new Date(),
      encrypted: true,
      delivered: false,
      read: false
    };

    // Prepare encrypted payload for P2P transmission
    const encryptedPayload = JSON.stringify({
      encryptedContent: encryptedContent,
      attachment: encryptedAttachment ? {
        encryptedData: encryptedAttachment,
        filename: attachmentData!.filename,
        size: attachmentData!.size,
        type: attachmentData!.type,
        mimeType: attachmentData!.data.split(';')[0].split(':')[1] || 'image/jpeg'
      } : undefined,
      timestamp: new Date().toISOString()
    });

    // Try to send via P2P connection
    try {
      if (this.p2pService.hasConnection(contactId)) {
        const connectionState = this.p2pService.getConnectionState(contactId);
        if (connectionState === 'connected') {
          await this.p2pService.sendMessage(encryptedPayload, contactId);
          message.delivered = true;
        } else {
          // Connection not ready - message will be saved but not delivered
          await this.errorService.showWarning('Message saved but not delivered. Connection not established.');
        }
      } else {
        // No connection - message will be saved but not delivered
        await this.errorService.showWarning('Message saved but not delivered. Please establish connection first.');
      }
    } catch (error) {
      await this.errorService.handleError(error, 'sending message via P2P');
      // Message will be saved but marked as not delivered
    }

    // Save to storage (with plain text for local display)
    try {
      await this.storageService.saveMessage(message);
    } catch (error) {
      await this.errorService.handleError(error, 'saving message');
      throw error;
    }

    // Update signals
    this._messages.update(messages => [...messages, message]);

    // Update contact's last message timestamp
    this.contactService.updateContactLastMessage(contactId, message.timestamp);
  }

  /**
   * Mark messages as read for a contact
   */
  async markAsRead(contactId: string): Promise<void> {
    const user = this.userService.currentUser();
    if (!user) return;

    const messagesToUpdate = this._messages().filter(
      m => m.recipientId === user.id && m.senderId === contactId && !m.read
    );

    if (messagesToUpdate.length === 0) return;

    // Update in storage
    for (const message of messagesToUpdate) {
      const updatedMessage: Message = { ...message, read: true };
      await this.storageService.saveMessage(updatedMessage);
    }

    // Update signals
    this._messages.update(messages =>
      messages.map(m =>
        m.recipientId === user.id && m.senderId === contactId && !m.read
          ? { ...m, read: true }
          : m
      )
    );

    // Clear unread count
    this.contactService.clearUnreadCount(contactId);
  }

  /**
   * Set up message listener for a contact
   */
  private setupMessageListener(contactId: string): void {
    // Remove existing listener if any
    const existingUnsubscribe = this.messageUnsubscribers.get(contactId);
    if (existingUnsubscribe) {
      existingUnsubscribe();
    }

    // Set up new listener
    const unsubscribe = this.p2pService.onMessage(contactId, async (messageData: string) => {
      await this.handleIncomingMessage(messageData, contactId);
    });

    this.messageUnsubscribers.set(contactId, unsubscribe);
  }

  /**
   * Handle incoming message from P2P connection and decrypt it
   */
  private async handleIncomingMessage(messageData: string, contactId: string): Promise<void> {
    const user = this.userService.currentUser();
    if (!user) {
      return;
    }

    try {
      // Parse message payload
      const payload = JSON.parse(messageData);
      
      // Import user's private key for decryption
      const privateKey = await this.encryptionService.importPrivateKey(user.privateKey);

      // Decrypt message content
      let decryptedContent: string;
      if (payload.encryptedContent) {
        // New encrypted format (hybrid encryption)
        const rawContent = await this.encryptionService.decryptMessageHybrid(
          payload.encryptedContent.encryptedData,
          payload.encryptedContent.encryptedKey,
          payload.encryptedContent.iv,
          privateKey
        );
        // Sanitize decrypted content to prevent XSS
        decryptedContent = SanitizationUtil.sanitizeMessage(rawContent);
      } else if (payload.text) {
        // Legacy plain text format (for backward compatibility)
        decryptedContent = SanitizationUtil.sanitizeMessage(payload.text);
      } else {
        throw new Error('Invalid message format');
      }

      // Decrypt attachment if present
      let attachmentData: Message['attachment'] | undefined;
      if (payload.attachment) {
        if (payload.attachment.encryptedData && payload.attachment.encryptedData.encryptedData) {
          // New encrypted format (hybrid encryption)
          const encryptedAttachment = payload.attachment.encryptedData;
          const decryptedBase64 = await this.encryptionService.decryptAttachmentHybrid(
            encryptedAttachment.encryptedData,
            encryptedAttachment.encryptedKey,
            encryptedAttachment.iv,
            privateKey
          );

          // Reconstruct data URL with original MIME type
          const mimeType = payload.attachment.mimeType || 'image/jpeg';
          const dataUrl = decryptedBase64.startsWith('data:') 
            ? decryptedBase64 
            : `data:${mimeType};base64,${decryptedBase64}`;

          attachmentData = {
            type: payload.attachment.type || 'image',
            data: dataUrl,
            filename: payload.attachment.filename,
            size: payload.attachment.size
          };
        } else if (payload.attachment.data) {
          // Legacy plain text format
          attachmentData = payload.attachment;
        }
      }

      const message: Message = {
        id: crypto.randomUUID(),
        senderId: contactId,
        recipientId: user.id,
        content: decryptedContent,
        attachment: attachmentData,
        timestamp: new Date(payload.timestamp || Date.now()),
        encrypted: !!payload.encryptedContent, // True if encrypted, false if legacy
        delivered: true,
        read: false
      };

      // Save to storage
      await this.storageService.saveMessage(message);

      // Update signals if this is the current contact
      if (this._currentContactId() === contactId) {
        this._messages.update(messages => [...messages, message]);
        await this.markAsRead(contactId);
      } else {
        // Increment unread count
        this.contactService.incrementUnreadCount(contactId);
      }

      // Update contact's last message timestamp
      this.contactService.updateContactLastMessage(contactId, message.timestamp);
    } catch (error) {
      await this.errorService.handleError(error, 'processing incoming message');
      // Don't throw - allow app to continue functioning
    }
  }

  /**
   * Convert file to base64 with attachment metadata
   */
  private async fileToBase64(file: File): Promise<Message['attachment']> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          type: 'image',
          data: reader.result as string,
          filename: file.name,
          size: file.size
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

