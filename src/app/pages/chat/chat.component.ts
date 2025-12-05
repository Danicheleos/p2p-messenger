import { Component, OnInit, computed, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, ModalController } from '@ionic/angular/standalone';
import { UserService } from '../../core/services/user.service';
import { ContactService } from '../../core/services/contact.service';
import { MessageService } from '../../core/services/message.service';
import { APP_CONSTANTS } from '../../core/constants/app.const';
import { AddContactModalComponent } from '../../shared/components/add-contact-modal/add-contact-modal.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ChatHeaderComponent } from './components/chat-header/chat-header.component';
import { ChatAreaComponent } from './components/chat-area/chat-area.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    SidebarComponent,
    ChatHeaderComponent,
    ChatAreaComponent
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit {
  private userService = inject(UserService);
  private contactService = inject(ContactService);
  private messageService = inject(MessageService);

  readonly currentUser = this.userService.currentUser;
  readonly contacts = this.contactService.contacts;
  readonly selectedContact = this.contactService.selectedContact;
  readonly sidebarOpen = signal(false);

  readonly username = computed(() => this.currentUser()?.username || 'User');
  readonly selectedContactName = computed(() => this.selectedContact()?.username || 'P2P Chat');

  readonly userInitials = computed(() => {
    const username = this.username();
    if (username.length >= 2) {
      return username.substring(0, 2).toUpperCase();
    }
    return username.charAt(0).toUpperCase();
  });
  
  constructor() {
    // Load messages when contact is selected
    effect(() => {
      const contactId = this.contactService.selectedContactId();
      if (contactId) {
        this.messageService.loadMessages(contactId);
      } else {
        this.messageService.clearMessages();
      }
    });
  }

  async ngOnInit(): Promise<void> {
    // Load contacts on init
    await this.contactService.loadContacts();
    
    // Generate mock contacts if none exist (for testing)
    if (this.contacts().length === 0) {
      try {
        const createdContacts = await this.contactService.generateMockContacts();
        
        // Generate mock messages for first contact
        if (createdContacts.length > 0) {
          await this.messageService.generateMockMessages(createdContacts[0].id, 5);
        }
      } catch (error) {
        console.error('Error generating mock contacts:', error);
      }
    }
  }

  onContactSelected(contactId: string): void {
    this.contactService.selectContact(contactId);
    // Close sidebar on mobile after selection (< 768px)
    if (window.innerWidth < APP_CONSTANTS.BREAKPOINTS.DESKTOP_MIN) {
      this.sidebarOpen.set(false);
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(open => !open);
  }
}
