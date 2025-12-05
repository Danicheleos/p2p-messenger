/**
 * User interface representing the current user
 */
export interface User {
  id: string;
  username: string;
  publicKey: string; // Base64 encoded
  privateKey: string; // Encrypted, Base64 encoded
  createdAt: Date;
}

