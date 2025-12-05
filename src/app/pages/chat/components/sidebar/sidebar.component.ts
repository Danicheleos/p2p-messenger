import { Component, Input, Output, EventEmitter, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonList,
  IonSearchbar,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { ContactService } from '../../../../core/services/contact.service';
import { ContactItemComponent } from '../../../../shared/components/contact-item/contact-item.component';

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
  @Output() contactDeleted = new EventEmitter<{ id: string; username: string }>();
  @Output() addContactClicked = new EventEmitter<void>();
  @Output() searchChanged = new EventEmitter<string>();

  private contactService = inject(ContactService);

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

  onContactDelete(contactId: string, contactUsername: string): void {
    this.contactDeleted.emit({ id: contactId, username: contactUsername });
  }

  onAddContact(): void {
    this.addContactClicked.emit();
  }
}

