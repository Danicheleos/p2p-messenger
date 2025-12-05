import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonIcon,
  IonSpinner,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, checkmark, alertCircle, informationCircle } from 'ionicons/icons';
import { APP_CONSTANTS } from '../../../core/constants/app.const';
import { EncryptionService } from '../../../core/services/encryption.service';

@Component({
  selector: 'app-add-contact-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonIcon,
    IonSpinner
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Add Contact</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form (ngSubmit)="onSubmit()" #addContactForm="ngForm">
        <ion-item class="input-item" [class.error]="showUsernameError">
          <ion-label position="stacked">Username</ion-label>
          <ion-input
            [(ngModel)]="username"
            name="username"
            type="text"
            placeholder="e.g., alice123"
            (ionInput)="onUsernameInput()"
            (ionBlur)="validateUsername()"
            required
            autocomplete="username"
          ></ion-input>
        </ion-item>

        @if (showUsernameError) {
          <div class="error-message">
            <ion-icon name="alert-circle"></ion-icon>
            <span>{{ usernameError }}</span>
          </div>
        }

        <ion-item class="input-item" [class.error]="showPublicKeyError">
          <ion-label position="stacked">Public Key</ion-label>
          <ion-textarea
            [(ngModel)]="publicKey"
            name="publicKey"
            placeholder="Paste the contact's public key here..."
            rows="6"
            (ionInput)="onPublicKeyInput()"
            (ionBlur)="validatePublicKey()"
            required
            class="public-key-input"
          ></ion-textarea>
        </ion-item>

        @if (showPublicKeyError) {
          <div class="error-message">
            <ion-icon name="alert-circle"></ion-icon>
            <span>{{ publicKeyError }}</span>
          </div>
        }

        <div class="info-message">
          <ion-icon name="information-circle"></ion-icon>
          <p>Ask your contact to share their public key. You can paste it here to add them as a contact.</p>
        </div>

        @if (error) {
          <div class="error-message">
            <ion-icon name="alert-circle"></ion-icon>
            <span>{{ error }}</span>
          </div>
        }

        <ion-button
          type="submit"
          expand="block"
          [disabled]="!isFormValid() || isLoading"
          color="primary"
          class="submit-button"
        >
          @if (isLoading) {
            <ion-spinner name="crescent"></ion-spinner>
            <span style="margin-left: 8px">Adding...</span>
          } @else {
            <ion-icon name="checkmark" slot="start"></ion-icon>
            Add Contact
          }
        </ion-button>
      </form>
    </ion-content>
  `,
  styles: `
    .input-item {
      margin-bottom: 0.5rem;
      border-radius: 8px;
      overflow: hidden;

      &.error {
        --border-color: var(--app-error-color);
        --highlight-color-focused: var(--app-error-color);
      }
    }

    .public-key-input {
      --padding-start: 12px;
      --padding-end: 12px;
      font-family: monospace;
      font-size: 0.875rem;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--app-error-color);
      font-size: 0.875rem;
      margin-top: 0.5rem;
      padding: 0.75rem;
      background-color: rgba(var(--app-error-color-rgb, 204, 0, 0), 0.1);
      border-radius: 8px;
      border-left: 3px solid var(--app-error-color);

      ion-icon {
        font-size: 1.25rem;
        flex-shrink: 0;
      }
    }

    .info-message {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      color: var(--app-text-secondary);
      font-size: 0.875rem;
      margin: 1rem 0;
      padding: 0.75rem;
      background-color: rgba(var(--ion-color-primary-rgb), 0.1);
      border-radius: 8px;

      ion-icon {
        font-size: 1.25rem;
        flex-shrink: 0;
        color: var(--ion-color-primary);
        margin-top: 2px;
      }

      p {
        margin: 0;
        line-height: 1.4;
      }
    }

    .submit-button {
      margin-top: 1.5rem;
      --border-radius: 8px;
      height: 48px;
      font-weight: 600;
      text-transform: none;
    }
  `
})
export class AddContactModalComponent {
  private modalController = inject(ModalController);
  private encryptionService = inject(EncryptionService);

  username = '';
  publicKey = '';
  isLoading = false;
  error = '';
  showUsernameError = false;
  usernameError = '';
  showPublicKeyError = false;
  publicKeyError = '';

  readonly APP_CONSTANTS = APP_CONSTANTS;

  constructor() {
    addIcons({ close, checkmark, alertCircle, informationCircle });
  }

  onUsernameInput(): void {
    this.showUsernameError = false;
    this.error = '';
  }

  onPublicKeyInput(): void {
    this.showPublicKeyError = false;
    this.error = '';
  }

  validateUsername(): void {
    const trimmed = this.username.trim();
    
    if (!trimmed) {
      this.showUsernameError = false;
      return;
    }

    if (!this.isValidUsername(trimmed)) {
      this.showUsernameError = true;
      if (trimmed.length < APP_CONSTANTS.VALIDATION.USERNAME_MIN_LENGTH) {
        this.usernameError = `Username must be at least ${APP_CONSTANTS.VALIDATION.USERNAME_MIN_LENGTH} characters`;
      } else if (trimmed.length > APP_CONSTANTS.VALIDATION.USERNAME_MAX_LENGTH) {
        this.usernameError = `Username must be no more than ${APP_CONSTANTS.VALIDATION.USERNAME_MAX_LENGTH} characters`;
      } else if (!APP_CONSTANTS.VALIDATION.USERNAME_PATTERN.test(trimmed)) {
        this.usernameError = 'Username can only contain letters, numbers, underscores, and hyphens';
      }
    } else {
      this.showUsernameError = false;
    }
  }

  async validatePublicKey(): Promise<void> {
    const trimmed = this.publicKey.trim();
    
    if (!trimmed) {
      this.showPublicKeyError = false;
      return;
    }

    // Try to import the public key to validate it
    try {
      await this.encryptionService.importPublicKey(trimmed);
      this.showPublicKeyError = false;
    } catch (error) {
      this.showPublicKeyError = true;
      this.publicKeyError = 'Invalid public key format. Please check and try again.';
    }
  }

  isValidUsername(username: string): boolean {
    const trimmed = username.trim();
    return (
      trimmed.length >= APP_CONSTANTS.VALIDATION.USERNAME_MIN_LENGTH &&
      trimmed.length <= APP_CONSTANTS.VALIDATION.USERNAME_MAX_LENGTH &&
      APP_CONSTANTS.VALIDATION.USERNAME_PATTERN.test(trimmed)
    );
  }

  isFormValid(): boolean {
    const trimmedUsername = this.username.trim();
    const trimmedPublicKey = this.publicKey.trim();
    return (
      trimmedUsername.length > 0 &&
      this.isValidUsername(trimmedUsername) &&
      trimmedPublicKey.length > 0 &&
      !this.showPublicKeyError &&
      !this.isLoading
    );
  }

  async onSubmit(): Promise<void> {
    this.error = '';
    this.showUsernameError = false;
    this.showPublicKeyError = false;

    const trimmedUsername = this.username.trim();
    const trimmedPublicKey = this.publicKey.trim();

    // Validate username
    if (!this.isValidUsername(trimmedUsername)) {
      this.validateUsername();
      return;
    }

    // Validate public key
    try {
      await this.encryptionService.importPublicKey(trimmedPublicKey);
    } catch (error) {
      this.showPublicKeyError = true;
      this.publicKeyError = 'Invalid public key format. Please check and try again.';
      return;
    }

    this.isLoading = true;

    try {
      // Return the contact data to the parent
      await this.modalController.dismiss({
        username: trimmedUsername,
        publicKey: trimmedPublicKey
      });
    } catch (error: any) {
      console.error('Error in modal dismiss:', error);
      this.error = 'An error occurred. Please try again.';
      this.isLoading = false;
    }
  }

  dismiss(): void {
    this.modalController.dismiss();
  }
}

