import { Component, Input, Output, EventEmitter, inject, computed } from '@angular/core';
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
import { UserService } from '../../../../core/services/user.service';
import { Router } from '@angular/router';
import { APP_CONSTANTS } from '../../../../core/constants/app.const';
import { IS_MOBILE } from '../../../../core/constants/resize.token';

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
  @Output() menuToggle = new EventEmitter<void>();

  private router = inject(Router);
  private userService = inject(UserService);
  private popoverController = inject(PopoverController);

  readonly showMenuButton = inject(IS_MOBILE)

  
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
      this.logout();
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

  onMenuToggle(): void {
    this.menuToggle.emit();
  }
}

