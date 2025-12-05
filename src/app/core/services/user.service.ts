import { Injectable, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';
import { EncryptionService } from './encryption.service';
import { User } from '../interfaces';

/**
 * User Service - Manages current user state using Angular Signals
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private _currentUser = signal<User | null>(null);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  constructor(
    private storageService: StorageService,
    private encryptionService: EncryptionService
  ) {}

  /**
   * Create a new user with generated key pair
   */
  async createUser(username: string): Promise<User> {
    const userExists = await this.storageService.getUserByUsername(username)
    if (userExists) return userExists

    // Generate key pair
    const keyPair = await this.encryptionService.generateKeyPair();
    
    // Export keys to strings
    const publicKeyStr = await this.encryptionService.exportPublicKey(keyPair.publicKey);
    const privateKeyStr = await this.encryptionService.exportPrivateKey(keyPair.privateKey);
    
    // Create user object
    const user: User = {
      id: crypto.randomUUID(),
      username,
      publicKey: publicKeyStr,
      privateKey: privateKeyStr,
      createdAt: new Date()
    };
    
    // Save to storage
    await this.storageService.saveUser(user);
    
    // Update signal
    this._currentUser.set(user);
    
    // Store user ID in localStorage for quick access
    localStorage.setItem('p2p-chat-user-id', user.id);
    
    return user;
  }

  /**
   * Load user from storage
   */
  async loadUser(): Promise<User | null> {
    // Try to get user ID from localStorage first
    const userId = localStorage.getItem('p2p-chat-user-id');
    const user = userId 
      ? await this.storageService.getUser(userId)
      : await this.storageService.getUser();
    
    if (user) {
      this._currentUser.set(user);
      if (!userId) {
        localStorage.setItem('p2p-chat-user-id', user.id);
      }
    }
    
    return user;
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    this._currentUser.set(null);
    localStorage.removeItem('p2p-chat-user-id');
  }
}

