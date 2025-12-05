import { Component, computed, inject } from '@angular/core';
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
  PopoverController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOut, person } from 'ionicons/icons';
import { UserService } from '../../core/services/user.service';
import { UserMenuComponent } from './user-menu.component';

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
    IonButtons
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent {
  private userService = inject(UserService);
  private router = inject(Router);
  private popoverController = inject(PopoverController);

  readonly currentUser = this.userService.currentUser;
  readonly username = computed(() => this.currentUser()?.username || 'User');

  constructor() {
    addIcons({ logOut, person });
  }

  async logout(): Promise<void> {
    try {
      await this.userService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error during logout:', error);
      // Still navigate to login even if logout fails
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
}

