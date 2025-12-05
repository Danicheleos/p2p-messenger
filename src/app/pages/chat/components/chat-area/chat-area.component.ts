import { Component, Input, Output, EventEmitter, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chatbubblesOutline } from 'ionicons/icons';
import { Contact } from '../../../../core/interfaces';
import { Message } from '../../../../core/interfaces';
import { MessagesContainerComponent } from '../messages-container/messages-container.component';
import { MessageInputComponent } from '../../../../shared/components/message-input/message-input.component';

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
  @Input() selectedContact: Contact | null = null;
  @Input() messages: Message[] = [];
  @Input() currentUserId = '';
  @Input() isSending = false;
  @Output() sendMessage = new EventEmitter<{ text: string; file?: File }>();

  readonly hasSelectedContact = computed(() => this.selectedContact !== null);

  constructor() {
    addIcons({ chatbubblesOutline });
  }

  onSendMessage(event: { text: string; file?: File }): void {
    this.sendMessage.emit(event);
  }
}

