import { Component, inject, OnInit, signal, viewChild, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MenuController, Platform, ToastController } from '@ionic/angular';
import { App } from '@capacitor/app';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

// Internal domain infrastructures
import { AuthService } from './services/auth/auth.service';
import { FcmService } from './services/fcm/fcm.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonRouterOutlet,
    IonApp,
    RouterModule,
  ],
})
export class AppComponent implements OnInit {
  readonly isOffline = signal(false);
  readonly isLoading = signal(false);

  private readonly routerOutlet = viewChild(IonRouterOutlet);

  private readonly authService = inject(AuthService);
  private readonly fcmService = inject(FcmService);
  private readonly platform = inject(Platform);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);
  private readonly menuCtrl = inject(MenuController);
  private readonly destroyRef = inject(DestroyRef);

  public readonly signedInUser = this.authService.currentUser;

  constructor() {}

  async ngOnInit(): Promise<void> {
    await this.platform.ready();

    // 1. Configure Native Device Plugins (Capacitor Safe-Guarded)
    if (Capacitor.isNativePlatform()) {
      await SplashScreen.hide().catch(() => {});
      await StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
      await StatusBar.setStyle({ style: Style.Light }).catch(() => {});
      await StatusBar.setBackgroundColor({ color: '#ffffff' }).catch(() => {});
    }

    // 2. Initialize Network Listener & Hydrate Initial State
    await this.setupNetworkListener();

    // 3. App Initialization & Hardware Back-Button Handling
    await this.initializeApp();
    this.setupBackButton();
  }

  /**
   * Initializes network monitor and populates initial connection status
   */
  private async setupNetworkListener(): Promise<void> {
    try {
      const status = await Network.getStatus();
      this.isOffline.set(!status.connected);

      Network.addListener('networkStatusChange', (statusChange) => {
        this.isOffline.set(!statusChange.connected);
      });
    } catch (err) {
      console.warn('⚠️ [APP] Network status tracking unavailable:', err);
    }
  }

  /**
   * Cold-boot session recovery & notification sync
   */
  private async initializeApp(): Promise<void> {
    try {
      // Wait for AuthService session restoration from native Preferences
      await this.authService.isInitialized;

      if (this.authService.isAuthenticated()) {
        if (Capacitor.isNativePlatform()) {
          const permStatus = await PushNotifications.checkPermissions().catch(() => null);

          // Silent sync only if the user has previously granted push permissions
          if (permStatus?.receive === 'granted') {
            await this.initializeNotificationTelemetry();
            await this.authService.silentdeviceTokenSync();
          }
        } else {
          // Web environment fallback sync
          await this.authService.silentdeviceTokenSync();
        }
      }
    } catch (err) {
      console.error('❌ [App Init] Fault during app initialization sequence:', err);
    }
  }

  /**
   * Notification channels and stream subscription setup
   */
  private async initializeNotificationTelemetry(): Promise<void> {
    try {
      await this.fcmService.createNotificationChannels();

      this.fcmService
        .getRegistrationToken()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (token: string) => {
            if (token) {
              console.log('%c🚀 [APP] FCM Active:', 'color: #00ff00; font-weight: bold;', token);
            }
          },
          error: (err) => console.error('❌ [APP] FCM broadcast stream error:', err),
        });
    } catch (err) {
      console.error('❌ [APP] Notification lifecycle system boot failed:', err);
    }
  }

  /**
   * Hardware Back Button Handler for Android
   */
  private setupBackButton(): void {
    this.platform.backButton.subscribeWithPriority(10, async () => {
      // Close side menu if open
      const isMenuOpen = await this.menuCtrl.isOpen('main-menu');
      if (isMenuOpen) {
        await this.menuCtrl.close('main-menu');
        return;
      }

      const activeUrl = this.router.url;
      const isLoginPage = activeUrl.includes('/login');
      const isHomePage =
        activeUrl === '/landing/tabs/home' || activeUrl.startsWith('/landing/tabs/home');

      // Minimize app if on root destinations
      if (isLoginPage || isHomePage) {
        await this.minimizeWithToast();
        return;
      }

      // Pop navigation stack or fallback home
      const outlet = this.routerOutlet();
      if (outlet && outlet.canGoBack()) {
        outlet.pop();
      } else {
        await this.router.navigate(['/landing/tabs/home']);
      }
    });
  }

  /**
   * Graceful Android App Minimization
   */
  private async minimizeWithToast(): Promise<void> {
    try {
      const toastInstance = await this.toastController.create({
        message: 'Closing app...',
        duration: 1000,
        position: 'bottom',
      });
      await toastInstance.present();

      setTimeout(() => {
        App.minimizeApp();
      }, 800);
    } catch (error) {
      console.error('[App Runtime Error] Failed to minimize active window:', error);
    }
  }

  /**
   * Navigation Helper for Side Menu
   */
  public async navigateTo(path: string): Promise<void> {
    await this.router.navigate([path]);
    await this.menuCtrl.close('main-menu');
  }
}