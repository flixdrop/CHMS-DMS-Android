import { Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterModule } from '@angular/router';
import { MenuController, Platform, ToastController } from '@ionic/angular';
import { App } from '@capacitor/app';
import { 
  IonApp, 
  IonIcon, 
  IonLoading, 
  IonRouterOutlet, 
  IonSplitPane, 
  IonMenu, 
  IonContent, 
  IonList, 
  IonItem,
  IonHeader,
  IonToolbar ,
  
} from "@ionic/angular/standalone";
import { Network } from '@capacitor/network';

// Internal domain infrastructures
import { AuthService } from './services/auth/auth.service';
import { FcmService } from './services/fcm/fcm.service';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar } from '@capacitor/status-bar';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [CommonModule, IonRouterOutlet, IonIcon, IonToolbar, IonSplitPane, IonMenu, IonContent, IonList, IonItem, IonHeader, RouterLinkActive, IonApp,  RouterModule, RouterLink]
})
export class AppComponent implements OnInit {

  readonly isOffline = signal(false);
  readonly isLoading = signal(false);

  // Clean, modern signal-based DOM element tracking query lookup
  private readonly routerOutlet = viewChild(IonRouterOutlet);

  // Modern functional structural dependency instantiation mapping instances
  private readonly authService = inject(AuthService);
  private readonly fcmService = inject(FcmService);
  private readonly platform = inject(Platform);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);
  private readonly menuCtrl = inject(MenuController);

  // Expose the current user signal directly from AuthService
  public readonly signedInUser = this.authService.currentUser;

  // 💥 NOTE: The constructor effect was removed here. Redirection is securely deferred to the Auth Guard.
  constructor() {}

  async ngOnInit(): Promise<void> {
    await this.platform.ready();
    
    // 5. Initialize Network Listener
    Network.addListener('networkStatusChange', status => {
      this.isOffline.set(!status.connected);
    });


    this.platform.ready().then(() => {

      SplashScreen.hide().catch(error => {
        console.log('%c Splash Screen works only on native android and ios devices', 'color: silver; font-size: 10px;');
      });
      StatusBar.setOverlaysWebView({ overlay: false }).catch(error => {
        console.log('%c Status Bar works only on native android and ios devices', 'color: silver; font-size: 10px;');
      });
      StatusBar.setBackgroundColor({ color: "#ffffff" }).catch(error => {
        console.log('%c Status Bar works only on native android and ios devices', 'color: silver; font-size: 10px;');
      });
    });


    // 🔍 Let the application shell initialization run asynchronously in the background
    // this.initializeNotificationTelemetry();
    await this.initializeApp();

    this.setupBackButton();
  }

  private async initializeApp() {
    // 1. Wait for AuthService to restore the native session from Preferences
    await this.authService.isInitialized;

    // 2. If session exists, silently sync FCM token without showing prompts
    if (this.authService.isAuthenticated()) {
      await this.authService.silentFcmTokenSync();
    }
  }

  /**
   * Asynchronously spins up push notification contexts in the background
   */
  private async initializeNotificationTelemetry(): Promise<void> {
    try {
      // 1. Create channels natively (only if not on web)
      await this.fcmService.createNotificationChannels();

      // 2. Simply subscribe. If the token is already there, it fires immediately.
      // If not, it waits until the service fetches it.
      this.fcmService.getRegistrationToken().subscribe({
        next: (token: string) => {
          if (token) {
            console.log('%c🚀 [APP] FCM active:', 'color: #00ff00; font-weight: bold;', token);
          }
        },
        error: (err) => console.error('❌ [APP] Broadcast stream fault:', err)
      });
    } catch (err) {
      console.error('❌ [APP] Notification lifecycle system boot failed:', err);
    }
  }

  /**
   * Configures low-level OS back-button routing behavior for Android hardware
   */
  // private setupBackButton(): void {
  //   this.platform.backButton.subscribeWithPriority(10, () => {
  //     const activeUrl = this.router.url;
  //     const isLoginPage = activeUrl.includes('/login');
      
  //     // Adjusted route matching pattern to accurately target your root "/home" structure
  //     // const isHomePage = activeUrl === '/home' || activeUrl.startsWith('/home/dashboard');
  //     const isHomePage = activeUrl === '/landing/tabs/home' || activeUrl.startsWith('/home/dashboard');

  //     if (isLoginPage || isHomePage) {
  //       this.minimizeWithToast();
  //     } else {
  //       const outlet = this.routerOutlet();
  //       if (outlet && outlet.canGoBack()) {
  //         outlet.pop();
  //       }
  //     }
  //   });
  // }

    private setupBackButton(): void {
  this.platform.backButton.subscribeWithPriority(10, async () => {
    // 1. Close active drawer/side-menu first if open
    const isMenuOpen = await this.menuCtrl.isOpen('main-menu');
    if (isMenuOpen) {
      await this.menuCtrl.close('main-menu');
      return;
    }

    const activeUrl = this.router.url;
    const isLoginPage = activeUrl.includes('/login');
    const isHomePage = activeUrl === '/landing/tabs/home' || activeUrl === '/landing/tabs/home';

    // 2. Minimize if at root entry points
    if (isLoginPage || isHomePage) {
      await this.minimizeWithToast();
      return;
    }

    // 3. Intelligently pop Ionic view stack
    const outlet = this.routerOutlet();
    if (outlet && outlet.canGoBack()) {
      outlet.pop();
    } else {
      // Fallback navigation back to home dashboard if history stack is lost
      await this.router.navigate(['/landing/tabs/home']);
    }
  });
}

  /**
   * Safe accessor for the viewchild signal
   */
  private Outlet() {
    return this.routerOutlet();
  }

  /**
   * Presents a localized notification prompt before sending the application to the background
   */
  private async minimizeWithToast(): Promise<void> {
    try {
      const toastInstance = await this.toastController.create({
        message: 'Closing app...',
        duration: 1000,
        position: 'bottom',
      });
      await toastInstance.present();

      // Safely schedule application background execution minimization loop
      setTimeout(() => {
        App.minimizeApp();
      }, 800);
    } catch (error) {
      console.error('[App Runtime Error] Failed to gracefully minimize active window environment:', error);
    }
  }

  // Programmatic Navigation handler: Guarantees routing execution & cleanly closes mobile drawer
  public async navigateTo(path: string): Promise<void> {
    console.log(`[Navigation] Routing intercepted to: ${path}`);
    await this.router.navigate([path]);
    await this.menuCtrl.close('main-menu');
  }
}