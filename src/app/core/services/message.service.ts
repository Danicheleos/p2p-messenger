import { Injectable, signal, computed, inject } from '@angular/core';
import { StorageService } from './storage.service';
import { UserService } from './user.service';
import { ContactService } from './contact.service';
import { P2PService } from './p2p.service';
import { Message } from '../interfaces';

/**
 * Message Service - Handles message operations using Angular Signals
 */
@Injectable({ providedIn: 'root' })
export class MessageService {
  private storageService = inject(StorageService);
  private userService = inject(UserService);
  private contactService = inject(ContactService);
  private p2pService = inject(P2PService);

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
   * Send a message via P2P connection
   */
  async sendMessage(text: string, contactId: string, attachment?: File): Promise<void> {
    const user = this.userService.currentUser();
    if (!user) {
      throw new Error('User must be authenticated to send messages');
    }

    let attachmentData: Message['attachment'] | undefined;

    if (attachment) {
      // Convert file to base64
      attachmentData = await this.fileToBase64(attachment);
    }

    // Prepare message payload (will be encrypted in Phase 6)
    const messagePayload = JSON.stringify({
      text,
      attachment: attachmentData,
      timestamp: new Date().toISOString()
    });

    const message: Message = {
      id: crypto.randomUUID(),
      senderId: user.id,
      recipientId: contactId,
      content: text,
      attachment: attachmentData,
      timestamp: new Date(),
      encrypted: false, // Will be true when encryption is implemented
      delivered: false,
      read: false
    };

    // Try to send via P2P connection
    try {
      if (this.p2pService.hasConnection(contactId)) {
        const connectionState = this.p2pService.getConnectionState(contactId);
        if (connectionState === 'connected') {
          await this.p2pService.sendMessage(messagePayload, contactId);
          message.delivered = true;
        }
      }
    } catch (error) {
      console.error('Error sending message via P2P:', error);
      // Message will be saved but marked as not delivered
    }

    // Save to storage
    await this.storageService.saveMessage(message);

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
   * Handle incoming message from P2P connection
   */
  private async handleIncomingMessage(messageData: string, contactId: string): Promise<void> {
    const user = this.userService.currentUser();
    if (!user) {
      return;
    }

    try {
      // Parse message payload (will decrypt in Phase 6)
      const payload = JSON.parse(messageData);
      
      const message: Message = {
        id: crypto.randomUUID(),
        senderId: contactId,
        recipientId: user.id,
        content: payload.text,
        attachment: payload.attachment,
        timestamp: new Date(payload.timestamp || Date.now()),
        encrypted: false, // Will be true when encryption is implemented
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
      console.error('Error handling incoming message:', error);
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

