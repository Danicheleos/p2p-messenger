/**
 * Storage keys for IndexedDB and localStorage
 */
export const STORAGE_KEYS = {
  DB_NAME: 'p2p-chat-db',
  DB_VERSION: 2,
  STORES: {
    USERS: 'users',
    CONTACTS: 'contacts',
    MESSAGES: 'messages',
    CONVERSATIONS: 'conversations',
    CONNECTION_DATA: 'connectionData'
  },
  LOCAL_STORAGE: {
    THEME: 'p2p-chat-theme',
    USER_ID: 'p2p-chat-user-id'
  }
} as const;

