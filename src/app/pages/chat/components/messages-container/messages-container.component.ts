import { Component, input, effect, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
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
export class MessagesContainerComponent implements AfterViewChecked {
  messages = input<Message[]>([]);
  currentUserId = input('');

  @ViewChild('messagesContainer', { static: false }) messagesContainer?: ElementRef<HTMLDivElement>;
  
  private shouldScrollToBottom = false;
  private previousMessageCount = 0;

  constructor() {
    // Auto-scroll when new messages arrive
    effect(() => {
      const currentMessages = this.messages();
      const currentCount = currentMessages.length;
      
      // Check if a new message was added (count increased)
      if (currentCount > this.previousMessageCount) {
        this.shouldScrollToBottom = true;
      }
      
      this.previousMessageCount = currentCount;
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  /**
   * Scroll to bottom of messages container
   */
  private scrollToBottom(): void {
    if (this.messagesContainer?.nativeElement) {
      const container = this.messagesContainer.nativeElement;
      // Use smooth scroll for better UX
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }

  /**
   * TrackBy function for message list optimization
   */
  trackByMessageId(index: number, message: Message): string {
    return message.id;
  }
}

