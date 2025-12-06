import { Component, computed, inject, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chatbubblesOutline } from 'ionicons/icons';
import { Contact } from '../../../../core/interfaces';
import { Message } from '../../../../core/interfaces';
import { MessagesContainerComponent } from '../messages-container/messages-container.component';
import { MessageInputComponent } from '../../../../shared/components/message-input/message-input.component';
import { MessageService } from '../../../../core/services/message.service';
import { ContactService } from '../../../../core/services/contact.service';

@Component({
  selector: 'app-chat-area',
  standalone: true,
  imports: [
    CommonModule,
    IonIcon,
    MessagesContainerComponent,
    MessageInputComponent
  ],
  templateUrl: './chat-area.component.html',
  styleUrl: './chat-area.component.scss'
})
export class ChatAreaComponent {
  currentUserId = input('');

  private messageService = inject(MessageService);
  private contactService = inject(ContactService);

  readonly messages = this.messageService.messages;
  readonly selectedContact = this.contactService.selectedContact;
  isSending = signal(false);

  readonly hasSelectedContact = computed(() => this.selectedContact !== null);

  constructor() {
    addIcons({ chatbubblesOutline });
  }

  async onSendMessage(event: { text: string; file?: File }): Promise<void> {
    const selectedContact = this.selectedContact();
    if (!selectedContact || (!event.text.trim() && !event.file)) return;

    this.isSending.set(true);

    try {
      await this.messageService.sendMessage(event.text || '', selectedContact.id, event.file);
    } catch (error) {
      // Error already handled by ErrorService in MessageService
      // Just log for debugging
      console.error('Error sending message:', error);
    } finally {
      this.isSending.set(false);
    }
  }
}

