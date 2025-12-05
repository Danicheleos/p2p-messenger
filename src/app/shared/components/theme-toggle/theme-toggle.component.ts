import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { moon, sunny } from 'ionicons/icons';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon],
  template: `
    <ion-button
      (click)="toggleTheme()"
      [fill]="'clear'"
      [size]="'default'"
      class="theme-toggle-button"
      [attr.aria-label]="'Toggle theme'"
    >
      <ion-icon [name]="themeService.theme() === 'dark' ? 'sunny' : 'moon'" slot="icon-only"></ion-icon>
    </ion-button>
  `,
  styles: `
    .theme-toggle-button {
      --color: var(--ion-text-color);
    }
  `
})
export class ThemeToggleComponent {
  readonly themeService = inject(ThemeService);

  constructor() {
    addIcons({ moon, sunny });
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}

