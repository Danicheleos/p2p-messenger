import { Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonItem, IonLabel, IonAvatar, IonImg, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkDone } from 'ionicons/icons';
import { Message } from '../../../core/interfaces';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [CommonModule, IonItem, IonLabel, IonAvatar, IonImg, IonIcon],
  template: `
    <div [class]="messageClass()">
      <div class="message-content">
        @if (message.attachment) {
          <div class="attachment-container">
            <ion-img
              [src]="message.attachment.data"
              [alt]="message.attachment.filename"
              class="attachment-image"
            ></ion-img>
            <div class="attachment-info">
              <span class="attachment-filename">{{ message.attachment.filename }}</span>
              <span class="attachment-size">{{ formatFileSize(message.attachment.size) }}</span>
            </div>
          </div>
        }
        <div class="message-text">{{ message.content }}</div>
        <div class="message-footer">
          <span class="message-time">{{ formatTime(message.timestamp) }}</span>
          @if (isSent()) {
            <ion-icon name="checkmark-done" [class.delivered]="message.delivered" [class.read]="message.read"></ion-icon>
          }
        </div>
      </div>
    </div>
  `,
  styles: `
    .message-bubble {
      display: flex;
      margin-bottom: 12px;
      padding: 0 16px;
      animation: fadeIn 0.3s ease;

      &.sent {
        justify-content: flex-end;

        .message-content {
          background: var(--ion-color-primary);
          color: var(--ion-color-primary-contrast);
          border-radius: 18px 18px 4px 18px;
          max-width: 70%;
        }
      }

      &.received {
        justify-content: flex-start;

        .message-content {
          background: var(--app-surface-color);
          color: var(--app-text-primary);
          border-radius: 18px 18px 18px 4px;
          max-width: 70%;
        }
      }
    }

    .message-content {
      padding: 10px 14px;
      word-wrap: break-word;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .attachment-container {
      margin-bottom: 8px;
      border-radius: 8px;
      overflow: hidden;
    }

    .attachment-image {
      width: 100%;
      max-width: 300px;
      height: auto;
      display: block;
    }

    .attachment-info {
      display: flex;
      justify-content: space-between;
      padding: 8px;
      background: rgba(0, 0, 0, 0.1);
      font-size: 0.75rem;
    }

    .attachment-filename {
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
    }

    .attachment-size {
      margin-left: 8px;
      opacity: 0.8;
    }

    .message-text {
      line-height: 1.4;
      white-space: pre-wrap;
    }

    .message-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
      margin-top: 4px;
      font-size: 0.75rem;
      opacity: 0.8;
    }

    .message-time {
      font-size: 0.7rem;
    }

    ion-icon {
      font-size: 0.875rem;

      &.delivered {
        color: var(--ion-color-primary-tint);
      }

      &.read {
        color: var(--ion-color-success);
      }
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `
})
export class MessageBubbleComponent {
  @Input() message!: Message;
  @Input() currentUserId!: string;

  private userService = inject(UserService);

  constructor() {
    addIcons({ checkmarkDone });
  }

  readonly isSent = computed(() => this.message.senderId === this.currentUserId);
  readonly messageClass = computed(() => 
    this.isSent() ? 'message-bubble sent' : 'message-bubble received'
  );

  formatTime(date: Date): string {
    const messageDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return messageDate.toLocaleDateString();
    }
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
}

