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
    const crypto = window.crypto

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

  /**
   * Encrypt message using hybrid encryption (AES-GCM + RSA-OAEP)
   * This allows encrypting messages larger than RSA-OAEP's 245-byte limit
   * 
   * @param message - Plain text message to encrypt
   * @param publicKey - Recipient's public key (RSA)
   * @returns Encrypted data structure: { encryptedData, encryptedKey, iv }
   */
  async encryptMessageHybrid(message: string, publicKey: CryptoKey): Promise<{
    encryptedData: string;
    encryptedKey: string;
    iv: string;
  }> {
    // Generate a random AES-GCM key
    const aesKey = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    );

    // Generate a random IV (Initialization Vector)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the message with AES-GCM
    const encoder = new TextEncoder();
    const messageData = encoder.encode(message);
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      aesKey,
      messageData
    );

    // Export and encrypt the AES key with RSA-OAEP
    const exportedAesKey = await crypto.subtle.exportKey('raw', aesKey);
    const encryptedKey = await crypto.subtle.encrypt(
      { name: ENCRYPTION_CONFIG.ALGORITHM.NAME },
      publicKey,
      exportedAesKey
    );

    return {
      encryptedData: this.arrayBufferToBase64(encryptedData),
      encryptedKey: this.arrayBufferToBase64(encryptedKey),
      iv: this.arrayBufferToBase64(iv.buffer)
    };
  }

  /**
   * Decrypt message using hybrid decryption (AES-GCM + RSA-OAEP)
   * 
   * @param encryptedData - Encrypted message data (base64)
   * @param encryptedKey - Encrypted AES key (base64)
   * @param iv - Initialization vector (base64)
   * @param privateKey - Recipient's private key (RSA)
   * @returns Decrypted plain text message
   */
  async decryptMessageHybrid(
    encryptedData: string,
    encryptedKey: string,
    iv: string,
    privateKey: CryptoKey
  ): Promise<string> {
    // Decrypt the AES key with RSA-OAEP
    const encryptedKeyBuffer = this.base64ToArrayBuffer(encryptedKey);
    const decryptedKeyBuffer = await crypto.subtle.decrypt(
      { name: ENCRYPTION_CONFIG.ALGORITHM.NAME },
      privateKey,
      encryptedKeyBuffer
    );

    // Import the AES key
    const aesKey = await crypto.subtle.importKey(
      'raw',
      decryptedKeyBuffer,
      {
        name: 'AES-GCM'
      },
      true,
      ['encrypt', 'decrypt']
    );

    // Decrypt the message with AES-GCM
    const ivBuffer = this.base64ToArrayBuffer(iv);
    const encryptedDataBuffer = this.base64ToArrayBuffer(encryptedData);
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(ivBuffer)
      },
      aesKey,
      encryptedDataBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  }

  /**
   * Encrypt attachment data using hybrid encryption
   * 
   * @param data - Base64 encoded attachment data
   * @param publicKey - Recipient's public key (RSA)
   * @returns Encrypted attachment data structure
   */
  async encryptAttachmentHybrid(
    data: string,
    publicKey: CryptoKey
  ): Promise<{
    encryptedData: string;
    encryptedKey: string;
    iv: string;
  }> {
    // Generate a random AES-GCM key
    const aesKey = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    );

    // Generate a random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Convert base64 data to ArrayBuffer
    const dataBuffer = this.base64ToArrayBuffer(data.split(',')[1] || data); // Remove data URL prefix if present

    // Encrypt the attachment data with AES-GCM
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      aesKey,
      dataBuffer
    );

    // Export and encrypt the AES key with RSA-OAEP
    const exportedAesKey = await crypto.subtle.exportKey('raw', aesKey);
    const encryptedKey = await crypto.subtle.encrypt(
      { name: ENCRYPTION_CONFIG.ALGORITHM.NAME },
      publicKey,
      exportedAesKey
    );

    return {
      encryptedData: this.arrayBufferToBase64(encryptedData),
      encryptedKey: this.arrayBufferToBase64(encryptedKey),
      iv: this.arrayBufferToBase64(iv.buffer)
    };
  }

  /**
   * Decrypt attachment data using hybrid decryption
   * 
   * @param encryptedData - Encrypted attachment data (base64)
   * @param encryptedKey - Encrypted AES key (base64)
   * @param iv - Initialization vector (base64)
   * @param privateKey - Recipient's private key (RSA)
   * @returns Decrypted base64 data (without data URL prefix)
   */
  async decryptAttachmentHybrid(
    encryptedData: string,
    encryptedKey: string,
    iv: string,
    privateKey: CryptoKey
  ): Promise<string> {
    // Decrypt the AES key with RSA-OAEP
    const encryptedKeyBuffer = this.base64ToArrayBuffer(encryptedKey);
    const decryptedKeyBuffer = await crypto.subtle.decrypt(
      { name: ENCRYPTION_CONFIG.ALGORITHM.NAME },
      privateKey,
      encryptedKeyBuffer
    );

    // Import the AES key
    const aesKey = await crypto.subtle.importKey(
      'raw',
      decryptedKeyBuffer,
      {
        name: 'AES-GCM'
      },
      true,
      ['encrypt', 'decrypt']
    );

    // Decrypt the attachment data with AES-GCM
    const ivBuffer = this.base64ToArrayBuffer(iv);
    const encryptedDataBuffer = this.base64ToArrayBuffer(encryptedData);
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(ivBuffer)
      },
      aesKey,
      encryptedDataBuffer
    );

    // Convert back to base64 (without data URL prefix - caller will add it)
    return this.arrayBufferToBase64(decryptedData);
  }
}

