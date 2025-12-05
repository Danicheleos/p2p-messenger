import { Injectable } from '@angular/core';
import { ENCRYPTION_CONFIG } from '../constants/encryption.const';

/**
 * Encryption Service - Handles all cryptographic operations using Web Crypto API
 */
@Injectable({ providedIn: 'root' })
export class EncryptionService {
  /**
   * Generate RSA key pair
   */
  async generateKeyPair(): Promise<CryptoKeyPair> {
    return await crypto.subtle.generateKey(
      {
        name: ENCRYPTION_CONFIG.ALGORITHM.NAME,
        modulusLength: ENCRYPTION_CONFIG.ALGORITHM.MODULUS_LENGTH,
        publicExponent: ENCRYPTION_CONFIG.ALGORITHM.PUBLIC_EXPONENT,
        hash: ENCRYPTION_CONFIG.ALGORITHM.HASH
      },
      true,
      ENCRYPTION_CONFIG.KEY_USAGE
    );
  }

  /**
   * Encrypt message with recipient's public key
   */
  async encryptMessage(message: string, publicKey: CryptoKey): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    
    // RSA-OAEP can only encrypt small chunks, so we need to handle larger messages
    // For now, we'll encrypt the entire message (up to ~245 bytes)
    // For larger messages, we'd need to use hybrid encryption (AES + RSA)
    const encrypted = await crypto.subtle.encrypt(
      { name: ENCRYPTION_CONFIG.ALGORITHM.NAME },
      publicKey,
      data
    );
    
    // Convert to base64 string
    return this.arrayBufferToBase64(encrypted);
  }

  /**
   * Decrypt message with private key
   */
  async decryptMessage(encryptedMessage: string, privateKey: CryptoKey): Promise<string> {
    const encryptedData = this.base64ToArrayBuffer(encryptedMessage);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: ENCRYPTION_CONFIG.ALGORITHM.NAME },
      privateKey,
      encryptedData
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  /**
   * Export public key to base64 string
   */
  async exportPublicKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('spki', key);
    return this.arrayBufferToBase64(exported);
  }

  /**
   * Export private key to base64 string
   */
  async exportPrivateKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('pkcs8', key);
    return this.arrayBufferToBase64(exported);
  }

  /**
   * Import public key from base64 string
   */
  async importPublicKey(keyString: string): Promise<CryptoKey> {
    const keyData = this.base64ToArrayBuffer(keyString);
    
    return await crypto.subtle.importKey(
      'spki',
      keyData,
      {
        name: ENCRYPTION_CONFIG.ALGORITHM.NAME,
        hash: ENCRYPTION_CONFIG.ALGORITHM.HASH
      },
      true,
      ['encrypt']
    );
  }

  /**
   * Import private key from base64 string
   */
  async importPrivateKey(keyString: string): Promise<CryptoKey> {
    const keyData = this.base64ToArrayBuffer(keyString);
    
    return await crypto.subtle.importKey(
      'pkcs8',
      keyData,
      {
        name: ENCRYPTION_CONFIG.ALGORITHM.NAME,
        hash: ENCRYPTION_CONFIG.ALGORITHM.HASH
      },
      true,
      ['decrypt']
    );
  }

  /**
   * Hash data using SHA-256
   */
  async hashData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    return this.arrayBufferToBase64(hashBuffer);
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

