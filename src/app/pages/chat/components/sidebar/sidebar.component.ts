import { Component, Input, Output, EventEmitter, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonList,
  IonSearchbar,
  IonButton,
  IonIcon,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { ContactService } from '../../../../core/services/contact.service';
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

  readonly contacts = this.contactService.contacts;
  readonly selectedContactId = this.contactService.selectedContactId;

  private _searchQuery = '';

  readonly filteredContacts = computed(() => {
    const query = this._searchQuery.toLowerCase();
    if (!query) return this.contacts();
    return this.contacts().filter(c => c.username.toLowerCase().includes(query));
  });

  constructor() {
    addIcons({ add });
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
}

