import { Injectable, inject } from '@angular/core';
import { getMessaging, onRegistered, register } from 'firebase/messaging';
import { firebaseApp } from './firebase.config';
import { NotificationService } from '../app/services/notification.service';
import { AuthService } from '../app/features/auth/services/auth.service';
import { STORAGE_KEYS } from '../app/core/constants/storage.constants';

@Injectable({
  providedIn: 'root'
})
export class MessagingService {

    private messaging = getMessaging(firebaseApp);
    private notificationService = inject(NotificationService);
    private authService = inject(AuthService);
    private isRegisteredWithBackend = false;

    constructor() {
      this.listenToAuthChanges();
    }

    private listenToAuthChanges(): void {
      this.authService.currentUser$.subscribe((user) => {
        if (user) {
          const installationId = localStorage.getItem(STORAGE_KEYS.FCM_INSTALLATION_ID);
          if (installationId) {
            this.registerDeviceWithBackend(installationId);
          }
        } else {
          this.isRegisteredWithBackend = false;
        }
      });
    }

    async initializeMessaging(): Promise<void> {

    try {
        console.log('1. Initializing Firebase Messaging...');
        // Ask user for notification permission
        const permission = await Notification.requestPermission();

        console.log('2. Notification permission:', permission);

        if (permission !== 'granted') {
            console.log('Notification permission was not granted.');
            return;
        }

        console.log('3. Notification permission granted.');

        // IMPORTANT:
        // Register onRegistered BEFORE calling register()
        onRegistered(this.messaging, (installationId) => {

            console.log(
            '4. Firebase Installation ID:',
            installationId
            );

            // Store FID locally
            localStorage.setItem(STORAGE_KEYS.FCM_INSTALLATION_ID, installationId);

            // Only register with backend if user is authenticated
            if (this.authService.isAuthenticated()) {
                this.registerDeviceWithBackend(installationId);
            } else {
                console.log(
                  '4a. Guest mode: FID stored locally. Will register with backend after login.'
                );
            }
        });

        console.log('5. onRegistered callback registered.');

        // Step 3: Register this browser/app instance with FCM
        await register(this.messaging, {
            vapidKey: 'BMM29hA5tuWzvTieRcPo0_nJrPjSFIUvDRXtpB8aADhjkZskJGJqoEGIDcp0inH0HsEcoJzALG4gsIl3NhV_BPg'
        });

        console.log(
            '6. Firebase Messaging registration completed.'
        );

    } catch (error) {
        console.error('Firebase Messaging initialization failed:', error);
    }   
  }

  public registerDeviceWithBackend(installationId: string): void {
    this.notificationService
      .registerDevice({
        installationId: installationId,
        deviceType: 'WEB'
      })
      .subscribe({
        next: (response) => {
          this.isRegisteredWithBackend = true;
          console.log(
            '7. Device registered in backend against authenticated user:',
            response
          );
        },
        error: (error) => {
          this.isRegisteredWithBackend = false;
          console.error(
            'Device registration failed:',
            error
          );
        }
      });
  }
}
