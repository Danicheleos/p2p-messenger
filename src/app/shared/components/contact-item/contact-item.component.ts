import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonItem, IonLabel, IonAvatar, IonBadge, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trash } from 'ionicons/icons';
import { Contact } from '../../../core/interfaces';

@Component({
  selector: 'app-contact-item',
  standalone: true,
  imports: [CommonModule, IonItem, IonLabel, IonAvatar, IonBadge, IonButton, IonIcon],
  template: `
    <ion-item
      [button]="true"
      [class.selected]="isSelected()"
      (click)="onClick()"
      class="contact-item"
    >
      <ion-avatar slot="start">
        <div class="avatar-placeholder">{{ getInitials() }}</div>
      </ion-avatar>
      <ion-label>
        <h2>{{ contact().username }}</h2>
        @if (lastMessage()) {
          <p class="last-message">{{ lastMessage() }}</p>
        } @else {
          <p class="no-messages">No messages yet</p>
        }
      </ion-label>
      @if (unreadCount() && unreadCount()! > 0) {
        <ion-badge slot="end" color="primary">{{ unreadCount() }}</ion-badge>
      }
      <ion-button
        slot="end"
        fill="clear"
        size="small"
        (click)="onDelete($event)"
        class="delete-button"
        [attr.aria-label]="'Delete contact'"
      >
        <ion-icon name="trash" slot="icon-only"></ion-icon>
      </ion-button>
    </ion-item>
  `,
  styles: `
    .contact-item {
      --padding-start: 16px;
      --padding-end: 16px;
      --min-height: 72px;
      cursor: pointer;
      transition: background-color 0.2s ease;

      &.selected {
        --background: var(--ion-color-primary-tint);
        --color: var(--ion-color-primary-contrast);
      }

      &:hover {
        --background: var(--app-surface-color);
      }
    }

    .avatar-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--ion-color-primary);
      color: white;
      font-weight: 600;
      border-radius: 50%;
      font-size: 0.875rem;
    }

    .last-message {
      font-size: 0.875rem;
      color: var(--app-text-secondary);
      margin-top: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .no-messages {
      font-size: 0.75rem;
      color: var(--app-text-secondary);
      font-style: italic;
      margin-top: 4px;
    }

    ion-badge {
      margin-inline-start: 8px;
    }

    .delete-button {
      --color: var(--app-error-color);
      opacity: 0;
      transition: opacity 0.2s ease;
      margin-inline-start: 4px;
    }

    .contact-item:hover .delete-button {
      opacity: 1;
    }

    @media (max-width: 767px) {
      .delete-button {
        opacity: 1; // Always visible on mobile
      }
    }
  `
})
export class ContactItemComponent {
  contact = input.required<Contact>();
  isSelected = input(false);
  lastMessage = input<string | undefined>(undefined);
  unreadCount = input<number | undefined>(undefined);
  clicked = output<void>();
  delete = output<void>();

  constructor() {
    addIcons({ trash });
  }

  getInitials(): string {
    const username = this.contact().username;
    if (username.length >= 2) {
      return username.substring(0, 2).toUpperCase();
    }
    return username.charAt(0).toUpperCase();
  }

  onClick(): void {
    this.clicked.emit();
  }

  onDelete(event: Event): void {
    event.stopPropagation(); // Prevent triggering the contact selection
    this.delete.emit();
  }
}

