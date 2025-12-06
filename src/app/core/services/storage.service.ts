import { Injectable } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { STORAGE_KEYS } from '../constants/storage-keys.const';
import { User, Contact, Message } from '../interfaces';

/**
 * IndexedDB schema definition
 */
interface P2PChatDB extends DBSchema {
  users: {
    key: string;
    value: User;
    indexes: { username: string };
  };
  contacts: {
    key: string;
    value: Contact;
    indexes: { username: string; userId: string };
  };
  messages: {
    key: string;
    value: Message;
    indexes: {
      senderId: string;
      recipientId: string;
      timestamp: Date;
      conversationId: string;
    };
  };
  conversations: {
    key: string;
    value: {
      id: string;
      userId: string;
      contactId: string;
      lastMessageTimestamp: Date;
    };
    indexes: { userId: string; contactId: string; lastMessageTimestamp: Date };
  };
  connectionData: {
    key: string;
    value: {
      contactId: string;
      userId: string;
      signalingData: Array<{
        type: 'offer' | 'answer' | 'ice-candidate';
        contactId: string;
        data: any;
        timestamp: number;
      }>;
      lastUpdated: Date;
    };
    indexes: { contactId: string; userId: string };
  };
}

/**
 * Storage Service - Manages IndexedDB operations
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private db: IDBPDatabase<P2PChatDB> | null = null;

  /**
   * Initialize the IndexedDB database
   */
  async initDatabase(): Promise<void> {
    if (this.db) {
      return;
    }

    this.db = await openDB<P2PChatDB>(STORAGE_KEYS.DB_NAME, STORAGE_KEYS.DB_VERSION, {
      upgrade(db) {
        // Users store
        if (!db.objectStoreNames.contains(STORAGE_KEYS.STORES.USERS)) {
          const userStore = db.createObjectStore(STORAGE_KEYS.STORES.USERS, { keyPath: 'id' });
          userStore.createIndex('username', 'username', { unique: true });
        }

        // Contacts store
        if (!db.objectStoreNames.contains(STORAGE_KEYS.STORES.CONTACTS)) {
          const contactStore = db.createObjectStore(STORAGE_KEYS.STORES.CONTACTS, {
            keyPath: 'id'
          });
          contactStore.createIndex('username', 'username');
          contactStore.createIndex('userId', 'userId');
        }

        // Messages store
        if (!db.objectStoreNames.contains(STORAGE_KEYS.STORES.MESSAGES)) {
          const messageStore = db.createObjectStore(STORAGE_KEYS.STORES.MESSAGES, {
            keyPath: 'id'
          });
          messageStore.createIndex('senderId', 'senderId');
          messageStore.createIndex('recipientId', 'recipientId');
          messageStore.createIndex('timestamp', 'timestamp');
          // Composite index for conversation queries
          messageStore.createIndex('conversationId', ['senderId', 'recipientId']);
        }

        // Conversations store (optional)
        if (!db.objectStoreNames.contains(STORAGE_KEYS.STORES.CONVERSATIONS)) {
          const conversationStore = db.createObjectStore(STORAGE_KEYS.STORES.CONVERSATIONS, {
            keyPath: 'id'
          });
          conversationStore.createIndex('userId', 'userId');
          conversationStore.createIndex('contactId', 'contactId');
          conversationStore.createIndex('lastMessageTimestamp', 'lastMessageTimestamp');
        }

        // Connection data store
        if (!db.objectStoreNames.contains(STORAGE_KEYS.STORES.CONNECTION_DATA)) {
          const connectionStore = db.createObjectStore(STORAGE_KEYS.STORES.CONNECTION_DATA, {
            keyPath: 'contactId'
          });
          connectionStore.createIndex('contactId', 'contactId');
          connectionStore.createIndex('userId', 'userId');
        }
      }
    });
  }

  /**
   * Save user to IndexedDB
   */
  async saveUser(user: User): Promise<void> {
    await this.ensureDb();
    await this.db!.put(STORAGE_KEYS.STORES.USERS, user);
  }

  /**
   * Get user from IndexedDB
   */
  async getUser(userId?: string): Promise<User | null> {
    await this.ensureDb();
    if (userId) {
      return (await this.db!.get(STORAGE_KEYS.STORES.USERS, userId)) || null;
    }
    // Get first user if no ID provided
    const users = await this.db!.getAll(STORAGE_KEYS.STORES.USERS);
    return users.length > 0 ? users[0] : null;
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<User | null> {
    await this.ensureDb();
    const tx = this.db!.transaction(STORAGE_KEYS.STORES.USERS, 'readonly');
    const index = tx.store.index('username');
    return (await index.get(username)) || null;
  }

  /**
   * Save message to IndexedDB
   */
  async saveMessage(message: Message): Promise<void> {
    await this.ensureDb();
    await this.db!.put(STORAGE_KEYS.STORES.MESSAGES, message);
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(contactId: string, userId: string): Promise<Message[]> {
    await this.ensureDb();
    const tx = this.db!.transaction(STORAGE_KEYS.STORES.MESSAGES, 'readonly');
    
    // Get messages where user is sender and contact is recipient
    const senderIndex = tx.store.index('senderId');
    const sentMessages = await senderIndex.getAll(userId);
    
    // Get messages where contact is sender and user is recipient
    const recipientIndex = tx.store.index('recipientId');
    const receivedMessages = await recipientIndex.getAll(userId);
    
    // Filter to only messages in this conversation
    const conversationMessages = [
      ...sentMessages.filter(m => m.recipientId === contactId),
      ...receivedMessages.filter(m => m.senderId === contactId)
    ];
    
    return conversationMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Save contact to IndexedDB
   */
  async saveContact(contact: Contact): Promise<void> {
    await this.ensureDb();
    await this.db!.put(STORAGE_KEYS.STORES.CONTACTS, contact);
  }

  /**
   * Get all contacts for a user
   */
  async getContacts(userId: string): Promise<Contact[]> {
    await this.ensureDb();
    const tx = this.db!.transaction(STORAGE_KEYS.STORES.CONTACTS, 'readonly');
    const index = tx.store.index('userId');
    return await index.getAll(userId);
  }

  /**
   * Get contact by ID
   */
  async getContact(contactId: string): Promise<Contact | null> {
    await this.ensureDb();
    return (await this.db!.get(STORAGE_KEYS.STORES.CONTACTS, contactId)) || null;
  }

  /**
   * Delete contact from IndexedDB
   */
  async deleteContact(contactId: string): Promise<void> {
    await this.ensureDb();
    await this.db!.delete(STORAGE_KEYS.STORES.CONTACTS, contactId);
  }

  /**
   * Save connection data for a contact
   */
  async saveConnectionData(contactId: string, userId: string, signalingData: Array<{
    type: 'offer' | 'answer' | 'ice-candidate';
    contactId: string;
    data: any;
    timestamp: number;
  }>): Promise<void> {
    await this.ensureDb();
    await this.db!.put(STORAGE_KEYS.STORES.CONNECTION_DATA, {
      contactId,
      userId,
      signalingData,
      lastUpdated: new Date()
    });
  }

  /**
   * Get connection data for a contact
   */
  async getConnectionData(contactId: string): Promise<Array<{
    type: 'offer' | 'answer' | 'ice-candidate';
    contactId: string;
    data: any;
    timestamp: number;
  }> | null> {
    await this.ensureDb();
    const data = await this.db!.get(STORAGE_KEYS.STORES.CONNECTION_DATA, contactId);
    return data ? data.signalingData : null;
  }

  /**
   * Add ICE candidate to stored connection data
   */
  async addIceCandidateToConnectionData(contactId: string, userId: string, candidate: {
    type: 'offer' | 'answer' | 'ice-candidate';
    contactId: string;
    data: any;
    timestamp: number;
  }): Promise<void> {
    await this.ensureDb();
    const existing = await this.db!.get(STORAGE_KEYS.STORES.CONNECTION_DATA, contactId);
    const signalingData = existing ? [...existing.signalingData, candidate] : [candidate];
    
    await this.db!.put(STORAGE_KEYS.STORES.CONNECTION_DATA, {
      contactId,
      userId,
      signalingData,
      lastUpdated: new Date()
    });
  }

  /**
   * Clear connection data for a contact
   */
  async clearConnectionData(contactId: string): Promise<void> {
    await this.ensureDb();
    await this.db!.delete(STORAGE_KEYS.STORES.CONNECTION_DATA, contactId);
  }

  /**
   * Ensure database is initialized
   */
  private async ensureDb(): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }
  }
}

