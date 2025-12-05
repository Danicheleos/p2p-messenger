import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { StorageService } from './core/services/storage.service';
import { ThemeService } from './core/services/theme.service';
import { UserService } from './core/services/user.service';

@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private storageService = inject(StorageService);
  private themeService = inject(ThemeService);
  private userService = inject(UserService);
  private router = inject(Router);

  async ngOnInit(): Promise<void> {
    // Initialize database first
    await this.storageService.initDatabase();
    
    // Try to load existing user
    try {
      const user = await this.userService.loadUser();
      // User will be redirected by auth guard if needed
    } catch (error) {
      console.error('Error loading user on startup:', error);
      // Continue to login page if user loading fails
    }
    
    // Theme service initializes automatically via effect
  }
}
