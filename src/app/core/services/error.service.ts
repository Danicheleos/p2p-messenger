import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';

/**
 * Error types for categorization
 */
export enum ErrorType {
  NETWORK = 'network',
  ENCRYPTION = 'encryption',
  STORAGE = 'storage',
  VALIDATION = 'validation',
  P2P = 'p2p',
  UNKNOWN = 'unknown'
}

/**
 * Error Service - Centralized error handling and user feedback
 */
@Injectable({ providedIn: 'root' })
export class ErrorService {
  private toastController = inject(ToastController);

  /**
   * Handle and display error to user
   */
  async handleError(error: unknown, context?: string): Promise<void> {
    const errorType = this.categorizeError(error);
    const message = this.getErrorMessage(error, errorType, context);
    
    console.error(`[${errorType.toUpperCase()}]${context ? ` [${context}]` : ''}:`, error);
    
    await this.showErrorToast(message, errorType);
  }

  /**
   * Show error toast notification
   */
  private async showErrorToast(message: string, errorType: ErrorType): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 4000,
      color: 'danger',
      position: 'bottom',
      buttons: [
        {
          text: 'OK',
          role: 'cancel'
        }
      ]
    });
    
    await toast.present();
  }

  /**
   * Show success toast notification
   */
  async showSuccess(message: string, duration: number = 2000): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration,
      color: 'success',
      position: 'bottom'
    });
    
    await toast.present();
  }

  /**
   * Show warning toast notification
   */
  async showWarning(message: string, duration: number = 3000): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration,
      color: 'warning',
      position: 'bottom'
    });
    
    await toast.present();
  }

  /**
   * Show info toast notification
   */
  async showInfo(message: string, duration: number = 3000): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration,
      color: 'primary',
      position: 'bottom'
    });
    
    await toast.present();
  }

  /**
   * Categorize error type
   */
  private categorizeError(error: unknown): ErrorType {
    if (!error) return ErrorType.UNKNOWN;

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : '';

    // Network errors
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('connection') ||
      errorName === 'NetworkError'
    ) {
      return ErrorType.NETWORK;
    }

    // Encryption errors
    if (
      errorMessage.includes('encrypt') ||
      errorMessage.includes('decrypt') ||
      errorMessage.includes('key') ||
      errorMessage.includes('crypto') ||
      errorName === 'OperationError'
    ) {
      return ErrorType.ENCRYPTION;
    }

    // Storage errors
    if (
      errorMessage.includes('storage') ||
      errorMessage.includes('IndexedDB') ||
      errorMessage.includes('QuotaExceeded') ||
      errorName === 'QuotaExceededError' ||
      errorName === 'ConstraintError'
    ) {
      return ErrorType.STORAGE;
    }

    // Validation errors
    if (
      errorMessage.includes('invalid') ||
      errorMessage.includes('validation') ||
      errorMessage.includes('format')
    ) {
      return ErrorType.VALIDATION;
    }

    // P2P/WebRTC errors
    if (
      errorMessage.includes('webrtc') ||
      errorMessage.includes('peer') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('data channel')
    ) {
      return ErrorType.P2P;
    }

    return ErrorType.UNKNOWN;
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: unknown, errorType: ErrorType, context?: string): string {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : '';

    switch (errorType) {
      case ErrorType.NETWORK:
        return 'Network error. Please check your connection and try again.';

      case ErrorType.ENCRYPTION:
        if (errorMessage.includes('key')) {
          return 'Encryption key error. Please verify the contact\'s public key.';
        }
        return 'Encryption error. Please try again or contact support if the problem persists.';

      case ErrorType.STORAGE:
        if (errorName === 'QuotaExceededError') {
          return 'Storage quota exceeded. Please free up space and try again.';
        }
        if (errorName === 'ConstraintError') {
          return 'This item already exists.';
        }
        return 'Storage error. Please try again.';

      case ErrorType.VALIDATION:
        return errorMessage || 'Invalid input. Please check your data and try again.';

      case ErrorType.P2P:
        if (errorMessage.includes('connection')) {
          return 'Connection failed. Please check your network and try again.';
        }
        if (errorMessage.includes('data channel')) {
          return 'Message delivery failed. The connection may be unstable.';
        }
        return 'Connection error. Please try again.';

      default:
        if (context) {
          return `An error occurred while ${context}. Please try again.`;
        }
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Extract detailed error information for logging
   */
  getErrorDetails(error: unknown): { message: string; name: string; stack?: string } {
    if (error instanceof Error) {
      return {
        message: error.message,
        name: error.name,
        stack: error.stack
      };
    }
    
    return {
      message: String(error),
      name: 'UnknownError'
    };
  }
}

