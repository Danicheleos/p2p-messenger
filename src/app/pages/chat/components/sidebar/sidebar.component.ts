import { Component, Input, Output, EventEmitter, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonList,
  IonSearchbar,
  IonButton,
  IonIcon,
  ModalController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, copy } from 'ionicons/icons';
import { ContactService } from '../../../../core/services/contact.service';
import { UserService } from '../../../../core/services/user.service';
import { P2PService } from '../../../../core/services/p2p.service';
import { ContactItemComponent } from '../../../../shared/components/contact-item/contact-item.component';
import { AddContactModalComponent } from '../../../../shared/components/add-contact-modal/add-contact-modal.component';
import { MessageService } from '../../../../core/services/message.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    IonList,
    IonSearchbar,
    IonButton,
    IonIcon,
    ContactItemComponent
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  @Input() isOpen = false;
  @Input() username = '';
  @Input() userInitials = '';
  @Output() contactSelected = new EventEmitter<string>();
  @Output() searchChanged = new EventEmitter<string>();

  private modalController = inject(ModalController);
  private contactService = inject(ContactService);
  private messageService = inject(MessageService);
  private userService = inject(UserService);
  private p2pService = inject(P2PService);
  private toastController = inject(ToastController);

  readonly contacts = this.contactService.contacts;
  readonly selectedContactId = this.contactService.selectedContactId;
  readonly currentUser = this.userService.currentUser;

  private _searchQuery = '';

  readonly filteredContacts = computed(() => {
    const query = this._searchQuery.toLowerCase();
    if (!query) return this.contacts();
    return this.contacts().filter(c => c.username.toLowerCase().includes(query));
  });

  constructor() {
    addIcons({ add, copy });
  }

  onSearch(event: any): void {
    this._searchQuery = event.detail.value || '';
    this.searchChanged.emit(this._searchQuery);
  }

  onContactClick(contactId: string): void {
    this.contactSelected.emit(contactId);
  }

  async onContactDelete(contactId: string, contactUsername: string): Promise<void> {
   const confirmed = confirm(`Are you sure you want to delete ${contactUsername}? This action cannot be undone.`);
    
    if (confirmed) {
      try {
        await this.contactService.removeContact(contactId);
        // Clear messages if this was the selected contact
        if (this.selectedContactId() === contactId) {
          this.messageService.clearMessages();
        }
      } catch (error) {
        console.error('Error deleting contact:', error);
        alert('Failed to delete contact. Please try again.');
      }
    }
  }


  async onAddContact(): Promise<void> {
    const modal = await this.modalController.create({
      component: AddContactModalComponent,
      presentingElement: await this.modalController.getTop()
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if (data?.userId && data?.username && data?.publicKey) {
      try {
        const contact = await this.contactService.addContact(data.userId, data.username, data.publicKey);
        
        // Select the newly added contact first
        this.onContactClick(contact.id);

        // If connection data was provided, import it and initiate connection
        if (data.connectionData && Array.isArray(data.connectionData) && data.connectionData.length > 0) {
          try {
            // Update contactId in signaling data to match the new contact
            const updatedConnectionData = data.connectionData.map((item: any) => ({
              ...item,
              contactId: contact.id
            }));
            
            // Import connection data
            const connectionDataJson = JSON.stringify(updatedConnectionData);
            await this.p2pService.importSignalingData(connectionDataJson);
            
            await this.showToast('Contact added and connection initiated!', 'success');
          } catch (connectionError) {
            console.error('Error importing connection data:', connectionError);
            await this.showToast('Contact added, but connection setup failed', 'warning');
          }
        } else {
          await this.showToast('Contact added successfully!', 'success');
        }
      } catch (error: any) {
        console.error('Error adding contact:', error);
        await this.showToast(error.message || 'Failed to add contact. Please try again.', 'danger');
      }
    }
  }

  /**
   * Copy public key and connection data to clipboard
   * Creates a handshake data object with userId, username, publicKey, and optional connection data
   */
  async copyPublicKey(): Promise<void> {
    const user = this.currentUser();
    if (!user || !user.publicKey) {
      await this.showToast('No public key available', 'danger');
      return;
    }

    try {
      // Check if there's a selected contact with pending connection data
      const selectedContactId = this.selectedContactId();
      let connectionData: any = null;
      
      if (selectedContactId) {
        const signalingData = this.p2pService.getPendingSignalingData(selectedContactId);
        if (signalingData && signalingData.length > 0) {
          connectionData = signalingData;
        }
      }

      // Create handshake data
      const handshakeData = this.p2pService.createHandshakeData(
        user.id,
        user.username,
        user.publicKey,
        selectedContactId || undefined
      );

      // Copy as JSON string
      const handshakeJson = JSON.stringify(handshakeData, null, 2);
      await navigator.clipboard.writeText(handshakeJson);
      
      const message = connectionData 
        ? 'Connection data copied to clipboard!' 
        : 'Public key copied to clipboard!';
      await this.showToast(message, 'success');
    } catch (error) {
      console.error('Failed to copy public key:', error);
      await this.showToast('Failed to copy public key', 'danger');
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

