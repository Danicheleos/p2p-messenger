import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonButtons,
  PopoverController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { person, menu } from 'ionicons/icons';
import { ThemeToggleComponent } from '../../../../shared/components/theme-toggle/theme-toggle.component';
import { UserMenuComponent } from '../../user-menu.component';

@Component({
  selector: 'app-chat-header',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonIcon,
    IonButtons,
    ThemeToggleComponent
  ],
  templateUrl: './chat-header.component.html',
  styleUrl: './chat-header.component.scss'
})
export class ChatHeaderComponent {
  @Input() title = 'P2P Chat';
  @Input() showMenuButton = false;
  @Output() menuToggle = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  private popoverController = inject(PopoverController);

  constructor() {
    addIcons({ person, menu });
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
      this.logout.emit();
    }
  }

  onMenuToggle(): void {
    this.menuToggle.emit();
  }
}

