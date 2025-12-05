import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonSpinner,
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircle,
  key,
  lockClosed
} from 'ionicons/icons';
import { UserService } from '../../core/services/user.service';
import { APP_CONSTANTS } from '../../core/constants/app.const';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonSpinner,
    IonIcon
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  username = '';
  isLoading = false;
  error = '';
  showUsernameError = false;
  usernameError = '';
  readonly APP_CONSTANTS = APP_CONSTANTS;

  constructor(
    private userService: UserService,
    private router: Router
  ) {
    addIcons({ alertCircle, key, lockClosed });
  }

  ngOnInit(): void {
    // Check if user is already logged in
    if (this.userService.isAuthenticated()) {
      this.router.navigate(['/chat']);
    }
  }

  onUsernameInput(): void {
    // Clear errors on input
    this.showUsernameError = false;
    this.error = '';
  }

  validateUsername(): void {
    const trimmed = this.username.trim();
    
    if (!trimmed) {
      this.showUsernameError = false;
      return;
    }

    if (!this.isValidUsername(trimmed)) {
      this.showUsernameError = true;
      if (trimmed.length < APP_CONSTANTS.VALIDATION.USERNAME_MIN_LENGTH) {
        this.usernameError = `Username must be at least ${APP_CONSTANTS.VALIDATION.USERNAME_MIN_LENGTH} characters`;
      } else if (trimmed.length > APP_CONSTANTS.VALIDATION.USERNAME_MAX_LENGTH) {
        this.usernameError = `Username must be no more than ${APP_CONSTANTS.VALIDATION.USERNAME_MAX_LENGTH} characters`;
      } else if (!APP_CONSTANTS.VALIDATION.USERNAME_PATTERN.test(trimmed)) {
        this.usernameError = 'Username can only contain letters, numbers, underscores, and hyphens';
      }
    } else {
      this.showUsernameError = false;
    }
  }

  isFormValid(): boolean {
    const trimmed = this.username.trim();
    return trimmed.length > 0 && this.isValidUsername(trimmed) && !this.isLoading;
  }

  async onSubmit(): Promise<void> {
    this.error = '';
    this.showUsernameError = false;
    
    const trimmed = this.username.trim();
    
    // Validate username
    if (!this.isValidUsername(trimmed)) {
      this.validateUsername();
      return;
    }

    this.isLoading = true;
    
    try {
      await this.userService.createUser(trimmed);
      // Small delay to show success state
      await new Promise(resolve => setTimeout(resolve, 300));
      this.router.navigate(['/chat']);
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      // Provide more specific error messages
      if (error?.message?.includes('ConstraintError') || error?.name === 'ConstraintError') {
        this.error = 'This username is already taken. Please choose another.';
      } else if (error?.message?.includes('QuotaExceededError')) {
        this.error = 'Storage quota exceeded. Please free up space and try again.';
      } else {
        this.error = 'Failed to create account. Please check your connection and try again.';
      }
    } finally {
      this.isLoading = false;
    }
  }

  private isValidUsername(username: string): boolean {
    const trimmed = username.trim();
    return (
      trimmed.length >= APP_CONSTANTS.VALIDATION.USERNAME_MIN_LENGTH &&
      trimmed.length <= APP_CONSTANTS.VALIDATION.USERNAME_MAX_LENGTH &&
      APP_CONSTANTS.VALIDATION.USERNAME_PATTERN.test(trimmed)
    );
  }
}

