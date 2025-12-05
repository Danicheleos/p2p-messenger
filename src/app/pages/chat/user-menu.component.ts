import { Component, computed, inject } from '@angular/core';
import {
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonAvatar,
  PopoverController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOut } from 'ionicons/icons';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [IonList, IonItem, IonLabel, IonIcon, IonAvatar],
  template: `
    <ion-list>
      <ion-item>
        <ion-avatar slot="start">
          <div class="avatar-placeholder">{{ getInitials() }}</div>
        </ion-avatar>
        <ion-label>
          <h2>{{ username() }}</h2>
          <p>Your account</p>
        </ion-label>
      </ion-item>
      <ion-item button (click)="handleLogout()">
        <ion-icon name="log-out" slot="start"></ion-icon>
        <ion-label>Logout</ion-label>
      </ion-item>
    </ion-list>
  `,
  styles: `
    ion-list {
      padding: 0;
    }
    .avatar-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--ion-color-primary);
      color: white;
      font-weight: 600;
      border-radius: 50%;
      font-size: 0.875rem;
    }
    ion-item {
      --padding-start: 16px;
      --padding-end: 16px;
    }
  `
})
export class UserMenuComponent {
  private userService = inject(UserService);
  private popoverController = inject(PopoverController);

  readonly currentUser = this.userService.currentUser;
  readonly username = computed(() => this.currentUser()?.username || 'User');

  constructor() {
    addIcons({ logOut });
  }

  getInitials(): string {
    const username = this.username();
    if (username.length >= 2) {
      return username.substring(0, 2).toUpperCase();
    }
    return username.charAt(0).toUpperCase();
  }

  async handleLogout(): Promise<void> {
    await this.popoverController.dismiss({ action: 'logout' });
  }
}

