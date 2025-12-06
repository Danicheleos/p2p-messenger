import { Component, signal, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonItem,
  IonInput,
  IonButton,
  IonIcon,
  IonLabel,
  IonImg
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { send, attach, close } from 'ionicons/icons';
import { APP_CONSTANTS } from '../../../core/constants/app.const';

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonItem,
    IonInput,
    IonButton,
    IonIcon,
    IonImg
  ],
  template: `
    <div class="message-input-container">
      @if (previewFile()) {
        <div class="file-preview">
          <ion-img [src]="previewFile()?.data" [alt]="previewFile()?.name" class="preview-image"></ion-img>
          <div class="preview-info">
            <span class="preview-filename">{{ previewFile()?.name }}</span>
            <span class="preview-size">{{ formatFileSize(previewFile()?.size || 0) }}</span>
          </div>
          <ion-button fill="clear" size="small" (click)="clearPreview()">
            <ion-icon name="close" slot="icon-only"></ion-icon>
          </ion-button>
        </div>
      }

      <div class="input-row">
        <ion-button
          fill="clear"
          (click)="onAttachmentClick()"
          [disabled]="isSending()"
          class="attach-button"
        >
          <ion-icon name="attach" slot="icon-only"></ion-icon>
        </ion-button>

        <ion-item class="input-item">
          <ion-input
            [(ngModel)]="messageText"
            (keydown.enter)="onEnterKey($event)"
            placeholder="Type a message..."
            [disabled]="isSending()"
            [maxlength]="APP_CONSTANTS.VALIDATION.MESSAGE_MAX_LENGTH"
            class="message-input"
          ></ion-input>
        </ion-item>

        <ion-button
          (click)="onSend()"
          [disabled]="!canSend()"
          color="primary"
          class="send-button"
        >
          <ion-icon name="send" slot="icon-only"></ion-icon>
        </ion-button>
      </div>

      <input
        type="file"
        #fileInput
        (change)="onFileSelected($event)"
        accept="image/*"
        style="display: none"
      />
    </div>
  `,
  styles: `
    .message-input-container {
      background: var(--ion-background-color);
      border-top: 1px solid var(--ion-border-color);
      padding: 8px;
    }

    .file-preview {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background: var(--app-surface-color);
      border-radius: 8px;
      margin-bottom: 8px;
    }

    .preview-image {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 4px;
    }

    .preview-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .preview-filename {
      font-size: 0.875rem;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .preview-size {
      font-size: 0.75rem;
      color: var(--app-text-secondary);
    }

    .input-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .input-item {
      flex: 1;
      --background: transparent;
      --padding-start: 0;
      --padding-end: 0;
      --inner-padding-end: 0;
    }

    .message-input {
      --padding-start: 12px;
      --padding-end: 12px;
      background: var(--app-surface-color);
      border-radius: 24px;
      min-height: 44px;
    }

    .attach-button,
    .send-button {
      --padding-start: 12px;
      --padding-end: 12px;
      min-width: 44px;
      height: 44px;
    }

    .send-button:disabled {
      opacity: 0.5;
    }
  `
})
export class MessageInputComponent {
  isSending = input(false);
  sendMessage = output<{ text: string; file?: File }>();
  attachmentSelected = output<File>();

  readonly APP_CONSTANTS = APP_CONSTANTS;
  messageText = '';
  previewFile = signal<{ data: string; name: string; size: number } | null>(null);
  private fileInputRef?: HTMLInputElement;

  constructor() {
    addIcons({ send, attach, close });
  }

  canSend(): boolean {
    return (
      (this.messageText.trim().length > 0 || this.previewFile() !== null) &&
      !this.isSending()
    );
  }

  onSend(): void {
    if (!this.canSend()) return;

    const file = this.previewFile();
    this.sendMessage.emit({
      text: this.messageText.trim(),
      file: file ? this.getFileFromPreview() : undefined
    });

    this.messageText = '';
    this.clearPreview();
  }

  onEnterKey(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' && !keyboardEvent.shiftKey) {
      keyboardEvent.preventDefault();
      this.onSend();
    }
  }

  onAttachmentClick(): void {
    // Create file input if it doesn't exist
    if (!this.fileInputRef) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = APP_CONSTANTS.FILE.SUPPORTED_IMAGE_TYPES.join(',');
      input.style.display = 'none';
      input.addEventListener('change', (e) => this.onFileSelected(e));
      document.body.appendChild(input);
      this.fileInputRef = input;
    }

    this.fileInputRef.click();
  }


  clearPreview(): void {
    this.previewFile.set(null);
    if (this.fileInputRef) {
      this.fileInputRef.value = '';
    }
    (this as any)._selectedFile = undefined;
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  }

  private getFileFromPreview(): File | undefined {
    // Store the file reference when selected
    return (this as any)._selectedFile;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validate file type
    if (!APP_CONSTANTS.FILE.SUPPORTED_IMAGE_TYPES.includes(file.type as any)) {
      alert('Only image files are supported');
      return;
    }

    // Validate file size
    if (file.size > APP_CONSTANTS.FILE.MAX_SIZE) {
      alert(`File size must be less than ${APP_CONSTANTS.FILE.MAX_SIZE / 1024 / 1024}MB`);
      return;
    }

    // Store file reference
    (this as any)._selectedFile = file;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewFile.set({
        data: e.target?.result as string,
        name: file.name,
        size: file.size
      });
    };
    reader.readAsDataURL(file);
  }
}

