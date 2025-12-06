import { Component, OnInit, computed, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, ModalController, ToastController } from '@ionic/angular/standalone';
import { UserService } from '../../core/services/user.service';
import { ContactService } from '../../core/services/contact.service';
import { MessageService } from '../../core/services/message.service';
import { P2PService } from '../../core/services/p2p.service';
import { APP_CONSTANTS } from '../../core/constants/app.const';
import { AddContactModalComponent } from '../../shared/components/add-contact-modal/add-contact-modal.component';
import { SignalingExchangeModalComponent } from '../../shared/components/signaling-exchange-modal/signaling-exchange-modal.component';
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
  private p2pService = inject(P2PService);
  private modalController = inject(ModalController);
  private toastController = inject(ToastController);

  readonly currentUser = this.userService.currentUser;
  readonly contacts = this.contactService.contacts;
  readonly selectedContact = this.contactService.selectedContact;
  readonly sidebarOpen = signal(false);

  readonly username = computed(() => this.currentUser()?.username || 'User');
  readonly selectedContactName = computed(() => this.selectedContact()?.username || 'P2P Chat');
  
  readonly connectionState = computed(() => {
    const contactId = this.contactService.selectedContactId();
    return contactId ? this.p2pService.getConnectionState(contactId) : 'disconnected';
  });

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

  /**
   * Initiate P2P connection for selected contact
   */
  async initiateConnection(): Promise<void> {
    const contactId = this.contactService.selectedContactId();
    if (!contactId) {
      await this.showToast('Please select a contact first', 'warning');
      return;
    }

    try {
      // Create offer
      const signalingData = await this.p2pService.sendOffer(contactId);
      
      // Export signaling data
      const exportData = this.p2pService.exportSignalingData(contactId);
      
      // Open signaling exchange modal
      await this.openSignalingModal(contactId, exportData);
    } catch (error) {
      console.error('Error initiating connection:', error);
      await this.showToast('Failed to initiate connection', 'danger');
    }
  }

  /**
   * Open signaling exchange modal
   */
  async openSignalingModal(contactId: string, exportData: string | null): Promise<void> {
    const modal = await this.modalController.create({
      component: SignalingExchangeModalComponent,
      componentProps: {
        contactId: signal(exportData),
        exportDataInput: signal(exportData)
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data) {
      await this.showToast('Connection data exchanged successfully', 'success');
    }
  }

  /**
   * Show toast notification
   */
  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
