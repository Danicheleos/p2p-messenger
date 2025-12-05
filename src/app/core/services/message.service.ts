import { Injectable, signal, computed, inject } from '@angular/core';
import { StorageService } from './storage.service';
import { UserService } from './user.service';
import { ContactService } from './contact.service';
import { Message } from '../interfaces';

/**
 * Message Service - Handles message operations using Angular Signals
 */
@Injectable({ providedIn: 'root' })
export class MessageService {
  private storageService = inject(StorageService);
  private userService = inject(UserService);
  private contactService = inject(ContactService);

  private _messages = signal<Message[]>([]);
  private _currentContactId = signal<string | null>(null);

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
    this._messages.set([]);
    this._currentContactId.set(null);
  }

  /**
   * Generate mock messages for testing
   * Creates sample messages for a contact
   */
  async generateMockMessages(contactId: string, count: number = 5): Promise<void> {
    const user = this.userService.currentUser();
    if (!user) {
      throw new Error('User must be authenticated to generate mock messages');
    }

    // Check if messages already exist
    const existingMessages = await this.storageService.getMessages(contactId, user.id);
    if (existingMessages.length > 0) {
      console.log(`Messages already exist for contact ${contactId}, skipping mock data generation`);
      return;
    }

    const mockMessages = [
      { senderId: contactId, content: 'Hey! How are you doing?', hoursAgo: 2 },
      { senderId: user.id, content: 'I\'m doing great, thanks for asking! How about you?', hoursAgo: 1.5 },
      { senderId: contactId, content: 'Pretty good! Just working on some projects.', hoursAgo: 1 },
      { senderId: user.id, content: 'That sounds interesting. What kind of projects?', hoursAgo: 0.5 },
      { senderId: contactId, content: 'Just some web development stuff. Nothing too exciting 😊', hoursAgo: 0.25 }
    ].slice(0, count);

    for (const mock of mockMessages) {
      const message: Message = {
        id: crypto.randomUUID(),
        senderId: mock.senderId,
        recipientId: mock.senderId === user.id ? contactId : user.id,
        content: mock.content,
        timestamp: new Date(Date.now() - mock.hoursAgo * 60 * 60 * 1000),
        encrypted: false,
        delivered: true,
        read: mock.senderId === user.id // Sent messages are "read" by default
      };

      await this.storageService.saveMessage(message);
    }

    // Reload messages if this is the current contact
    if (this._currentContactId() === contactId) {
      await this.loadMessages(contactId);
    }

    console.log(`Generated ${mockMessages.length} mock messages for contact ${contactId}`);
  }

  /**
   * Send a message (without encryption for now - will be added in Phase 6)
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

    // Save to storage
    await this.storageService.saveMessage(message);

    // Update signals
    this._messages.update(messages => [...messages, message]);

    // Update contact's last message timestamp
    this.contactService.updateContactLastMessage(contactId, message.timestamp);

    // TODO: Send via P2P connection (Phase 5)
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

