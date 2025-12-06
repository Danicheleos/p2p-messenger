import { Component, inject, signal, OnInit, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonTextarea,
  IonItem,
  IonLabel,
  IonText,
  ModalController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, copy, checkmark } from 'ionicons/icons';
import { P2PService, SignalingData } from '../../../core/services/p2p.service';

/**
 * Signaling Exchange Modal Component
 * Allows users to manually exchange WebRTC connection data
 */
@Component({
  selector: 'app-signaling-exchange-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonTextarea,
    IonItem,
    IonLabel,
    IonText
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Exchange Connection Data</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon slot="icon-only" name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="signaling-container">
        <!-- Export Section -->
        <div class="section">
          <h3>Your Connection Data</h3>
          <p class="help-text">
            Copy this data and share it with your contact. They should paste it in the "Import" section below.
          </p>
          
          @if (exportData()) {
            <ion-item>
              <ion-textarea
                [(ngModel)]="exportData"
                readonly
                rows="10"
                placeholder="Connection data will appear here..."
              ></ion-textarea>
            </ion-item>
            
            <ion-button expand="block" (click)="copyToClipboard(exportData()!)">
              <ion-icon slot="start" name="copy"></ion-icon>
              Copy to Clipboard
            </ion-button>
          } @else {
            <ion-text color="medium">
              No connection data available. Create an offer first.
            </ion-text>
          }
        </div>

        <!-- Import Section -->
        <div class="section">
          <h3>Import Connection Data</h3>
          <p class="help-text">
            Paste the connection data received from your contact here.
          </p>
          
          <ion-item>
            <ion-textarea
              [(ngModel)]="importData"
              rows="10"
              placeholder="Paste connection data here..."
            ></ion-textarea>
          </ion-item>
          
          <ion-button expand="block" (click)="importDataHandler()" [disabled]="!importData()">
            Import Connection Data
          </ion-button>
        </div>

        <!-- Status -->
        @if (statusMessage()) {
          <div class="status-message" [class.success]="isSuccess()" [class.error]="!isSuccess()">
            <ion-icon [name]="isSuccess() ? 'checkmark' : 'close'"></ion-icon>
            <span>{{ statusMessage() }}</span>
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .signaling-container {
      max-width: 800px;
      margin: 0 auto;
    }

    .section {
      margin-bottom: 2rem;
    }

    .section h3 {
      margin-top: 0;
      margin-bottom: 0.5rem;
      font-size: 1.2rem;
      font-weight: 600;
    }

    .help-text {
      color: var(--ion-color-medium);
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }

    ion-textarea {
      --padding-start: 0;
      --padding-end: 0;
    }

    .status-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      border-radius: 8px;
      margin-top: 1rem;
    }

    .status-message.success {
      background-color: var(--ion-color-success-tint);
      color: var(--ion-color-success);
    }

    .status-message.error {
      background-color: var(--ion-color-danger-tint);
      color: var(--ion-color-danger);
    }

    ion-button {
      margin-top: 1rem;
    }
  `]
})
export class SignalingExchangeModalComponent implements OnInit {
  private modalController = inject(ModalController);
  private p2pService = inject(P2PService);
  private toastController = inject(ToastController);

  contactId = input.required<string>();
  exportDataInput = input<string | null>(null);

  exportData = signal<string | null>(null);
  importData = signal<string>('');
  statusMessage = signal<string | null>(null);
  isSuccess = signal<boolean>(false);

  constructor() {
    addIcons({ close, copy, checkmark });
  }

  ngOnInit(): void {
    // Initialize with provided data
    const exportDataValue = this.exportDataInput();
    if (exportDataValue) {
      this.exportData.set(exportDataValue);
    } else {
      const contactIdValue = this.contactId();
      // Try to get export data from P2P service
      const data = this.p2pService.exportSignalingData(contactIdValue);
      this.exportData.set(data);
    }
  }

  /**
   * Copy data to clipboard
   */
  async copyToClipboard(data: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(data);
      this.showToast('Copied to clipboard!', 'success');
    } catch (error) {
      console.error('Failed to copy:', error);
      this.showToast('Failed to copy to clipboard', 'danger');
    }
  }

  /**
   * Import connection data
   */
  async importDataHandler(): Promise<void> {
    const data = this.importData();
    if (!data || !data.trim()) {
      this.showStatus('Please paste connection data', false);
      return;
    }

    try {
      await this.p2pService.importSignalingData(data);
      this.showStatus('Connection data imported successfully!', true);
      this.importData.set('');
      
      // Dismiss after a short delay
      setTimeout(() => {
        this.dismiss(true);
      }, 1500);
    } catch (error) {
      console.error('Error importing signaling data:', error);
      this.showStatus('Failed to import connection data. Please check the format.', false);
    }
  }

  /**
   * Show status message
   */
  private showStatus(message: string, success: boolean): void {
    this.statusMessage.set(message);
    this.isSuccess.set(success);
    
    // Clear status after 5 seconds
    setTimeout(() => {
      this.statusMessage.set(null);
    }, 5000);
  }

  /**
   * Show toast notification
   */
  private async showToast(message: string, color: 'success' | 'danger' | 'primary' = 'primary'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  /**
   * Dismiss modal
   */
  dismiss(success: boolean = false): void {
    this.modalController.dismiss(success);
  }
}

