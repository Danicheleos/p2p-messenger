import { Component, computed, inject, input, output } from '@angular/core';
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
  isOpen = input(false);
  username = input('');
  userInitials = input('');
  contactSelected = output<string>();
  searchChanged = output<string>();

  private modalController = inject(ModalController);
  private contactService = inject(ContactService);
  private messageService = inject(MessageService);
  private userService = inject(UserService);
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

    if (data?.username && data?.publicKey) {
      try {
        await this.contactService.addContact(data.username, data.publicKey);
        // Optionally select the newly added contact
        const contacts = this.contactService.contacts();
        const newContact = contacts.find(c => c.username === data.username);
        if (newContact) {
          this.onContactClick(newContact.id);
        }
      } catch (error: any) {
        console.error('Error adding contact:', error);
        alert(error.message || 'Failed to add contact. Please try again.');
      }
    }
  }

  /**
   * Copy public key to clipboard
   */
  async copyPublicKey(): Promise<void> {
    const user = this.currentUser();
    if (!user || !user.publicKey) {
      await this.showToast('No public key available', 'danger');
      return;
    }

    try {
      await navigator.clipboard.writeText(user.publicKey);
      await this.showToast('Public key copied to clipboard!', 'success');
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

