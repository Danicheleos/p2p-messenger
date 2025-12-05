import { Injectable, signal, computed, inject } from '@angular/core';
import { StorageService } from './storage.service';
import { UserService } from './user.service';
import { Contact } from '../interfaces';

/**
 * Contact Service - Manages contacts using Angular Signals
 */
@Injectable({ providedIn: 'root' })
export class ContactService {
  private storageService = inject(StorageService);
  private userService = inject(UserService);

  private _contacts = signal<Contact[]>([]);
  private _selectedContactId = signal<string | null>(null);

  readonly contacts = this._contacts.asReadonly();
  readonly selectedContactId = this._selectedContactId.asReadonly();
  readonly selectedContact = computed(() => {
    const selectedId = this._selectedContactId();
    if (!selectedId) return null;
    return this._contacts().find(c => c.id === selectedId) || null;
  });

  /**
   * Load contacts for current user
   */
  async loadContacts(): Promise<void> {
    const user = this.userService.currentUser();
    if (!user) {
      this._contacts.set([]);
      return;
    }

    try {
      const contacts = await this.storageService.getContacts(user.id);
      this._contacts.set(contacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
      this._contacts.set([]);
    }
  }

  /**
   * Add a new contact
   */
  async addContact(username: string, publicKey: string): Promise<Contact> {
    const user = this.userService.currentUser();
    if (!user) {
      throw new Error('User must be authenticated to add contacts');
    }

    // Check if contact already exists
    const existingContact = this._contacts().find(
      c => c.username === username && c.userId === user.id
    );
    if (existingContact) {
      throw new Error('Contact already exists');
    }

    const contact: Contact = {
      id: crypto.randomUUID(),
      username,
      publicKey,
      userId: user.id,
      createdAt: new Date(),
      unreadCount: 0
    };

    await this.storageService.saveContact(contact);
    this._contacts.update(contacts => [...contacts, contact]);

    return contact;
  }

  /**
   * Remove a contact
   */
  async removeContact(contactId: string): Promise<void> {
    await this.storageService.deleteContact(contactId);
    this._contacts.update(contacts => contacts.filter(c => c.id !== contactId));
    
    // Clear selection if removed contact was selected
    if (this._selectedContactId() === contactId) {
      this._selectedContactId.set(null);
    }
  }

  /**
   * Select a contact
   */
  selectContact(contactId: string): void {
    const contact = this._contacts().find(c => c.id === contactId);
    if (contact) {
      this._selectedContactId.set(contactId);
    }
  }

  /**
   * Update contact's last message timestamp
   */
  updateContactLastMessage(contactId: string, timestamp: Date): void {
    this._contacts.update(contacts =>
      contacts.map(c =>
        c.id === contactId
          ? { ...c, lastMessageTimestamp: timestamp }
          : c
      )
    );
  }

  /**
   * Increment unread count for a contact
   */
  incrementUnreadCount(contactId: string): void {
    this._contacts.update(contacts =>
      contacts.map(c =>
        c.id === contactId
          ? { ...c, unreadCount: (c.unreadCount || 0) + 1 }
          : c
      )
    );
  }

  /**
   * Clear unread count for a contact
   */
  clearUnreadCount(contactId: string): void {
    this._contacts.update(contacts =>
      contacts.map(c =>
        c.id === contactId ? { ...c, unreadCount: 0 } : c
      )
    );
  }
}

