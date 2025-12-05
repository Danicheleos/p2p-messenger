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
  private router = inject(Router);
  private modalController = inject(ModalController);

  readonly currentUser = this.userService.currentUser;
  readonly contacts = this.contactService.contacts;
  readonly selectedContact = this.contactService.selectedContact;
  readonly messages = this.messageService.messages;
  readonly selectedContactId = this.contactService.selectedContactId;
  readonly isSending = signal(false);
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
  readonly showMenuButton = computed(() => window.innerWidth < APP_CONSTANTS.BREAKPOINTS.DESKTOP_MIN);

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

  async logout(): Promise<void> {
    try {
      await this.userService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error during logout:', error);
      this.router.navigate(['/login']);
    }
  }

  onContactSelected(contactId: string): void {
    this.contactService.selectContact(contactId);
    // Close sidebar on mobile after selection (< 768px)
    if (window.innerWidth < APP_CONSTANTS.BREAKPOINTS.DESKTOP_MIN) {
      this.sidebarOpen.set(false);
    }
  }

  async onSendMessage(event: { text: string; file?: File }): Promise<void> {
    const selectedContact = this.selectedContact();
    if (!selectedContact || !event.text.trim()) return;

    this.isSending.set(true);

    try {
      await this.messageService.sendMessage(event.text, selectedContact.id, event.file);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      this.isSending.set(false);
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(open => !open);
  }

  async onAddContact(): Promise<void> {
    const modal = await this.modalController.create({
      component: AddContactModalComponent,
      presentingElement: await this.modalController.getTop()
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if (data?.username && data?.publicKey) {
      try {
        await this.contactService.addContact(data.username, data.publicKey);
        // Optionally select the newly added contact
        const contacts = this.contactService.contacts();
        const newContact = contacts.find(c => c.username === data.username);
        if (newContact) {
          this.onContactSelected(newContact.id);
        }
      } catch (error: any) {
        console.error('Error adding contact:', error);
        alert(error.message || 'Failed to add contact. Please try again.');
      }
    }
  }

  async onContactDeleted(contactData: { id: string; username: string }): Promise<void> {
    const confirmed = confirm(`Are you sure you want to delete ${contactData.username}? This action cannot be undone.`);
    
    if (confirmed) {
      try {
        await this.contactService.removeContact(contactData.id);
        // Clear messages if this was the selected contact
        if (this.selectedContactId() === contactData.id) {
          this.messageService.clearMessages();
        }
      } catch (error) {
        console.error('Error deleting contact:', error);
        alert('Failed to delete contact. Please try again.');
      }
    }
  }
}
