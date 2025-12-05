import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../../../../core/interfaces';
import { MessageBubbleComponent } from '../../../../shared/components/message-bubble/message-bubble.component';

@Component({
  selector: 'app-messages-container',
  standalone: true,
  imports: [CommonModule, MessageBubbleComponent],
  templateUrl: './messages-container.component.html',
  styleUrl: './messages-container.component.scss'
})
export class MessagesContainerComponent {
  @Input() messages: Message[] = [];
  @Input() currentUserId = '';
}

