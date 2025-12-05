import { Component, OnInit, computed, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonButtons,
  IonList,
  IonSearchbar,
  PopoverController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOut, person, add, search, menu, chatbubblesOutline } from 'ionicons/icons';
import { UserService } from '../../core/services/user.service';
import { ContactService } from '../../core/services/contact.service';
import { MessageService } from '../../core/services/message.service';
import { StorageService } from '../../core/services/storage.service';
import { APP_CONSTANTS } from '../../core/constants/app.const';
import { UserMenuComponent } from './user-menu.component';
import { ContactItemComponent } from '../../shared/components/contact-item/contact-item.component';
import { MessageBubbleComponent } from '../../shared/components/message-bubble/message-bubble.component';
import { MessageInputComponent } from '../../shared/components/message-input/message-input.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonIcon,
    IonButtons,
    IonList,
    IonSearchbar,
    ContactItemComponent,
    MessageBubbleComponent,
    MessageInputComponent,
    ThemeToggleComponent
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit {
  private userService = inject(UserService);
  private contactService = inject(ContactService);
  private messageService = inject(MessageService);
  private storageService = inject(StorageService);
  private router = inject(Router);
  private popoverController = inject(PopoverController);

  readonly currentUser = this.userService.currentUser;
  readonly contacts = this.contactService.contacts;
  readonly selectedContact = this.contactService.selectedContact;
  readonly messages = this.messageService.messages;
  readonly selectedContactId = this.contactService.selectedContactId;
  readonly isSending = signal(false);
  readonly searchQuery = signal('');
  readonly sidebarOpen = signal(false);

  readonly username = computed(() => this.currentUser()?.username || 'User');
  readonly selectedContactName = computed(() => this.selectedContact()?.username || '');
  readonly filteredContacts = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.contacts();
    return this.contacts().filter(c => c.username.toLowerCase().includes(query));
  });

  constructor() {
    addIcons({ logOut, person, add, search, menu, chatbubblesOutline });

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

  async presentPopover(event: Event): Promise<void> {
    const popover = await this.popoverController.create({
      component: UserMenuComponent,
      event: event,
      translucent: true,
      showBackdrop: true
    });

    await popover.present();

    const { data } = await popover.onDidDismiss();
    if (data?.action === 'logout') {
      await this.logout();
    }
  }

  selectContact(contactId: string): void {
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

  onSearch(event: any): void {
    this.searchQuery.set(event.detail.value || '');
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(open => !open);
  }

  // Placeholder for add contact - will be implemented in Phase 4
  async addContact(): Promise<void> {
    alert('Add contact functionality will be implemented in Phase 4');
  }

  getInitials(): string {
    const username = this.username();
    if (username.length >= 2) {
      return username.substring(0, 2).toUpperCase();
    }
    return username.charAt(0).toUpperCase();
  }
}
