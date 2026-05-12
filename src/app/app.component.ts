// import { Component, OnInit } from '@angular/core';
// import { AuthService } from './features/auth/auth.service';
// import { FcmService } from './features/fcm/fcm.service';
// import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

// @Component({
//   standalone: true,
//   imports: [IonApp, IonRouterOutlet],

//   selector: 'app-root',
//   templateUrl: 'app.component.html',
//   styleUrls: ['app.component.scss'],
// })
// export class AppComponent implements OnInit {
//   constructor(
//     private authService: AuthService,
//     private fcmService: FcmService,
//   ) {}

//   ngOnInit() {
//     // Initialize push
//     this.fcmService.initPush();

//     // Restore auth state BEFORE routing
//     this.authService.autoLogin();
//   }
// }

import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common'; // Required for template logic
import { Router } from '@angular/router';
import {
  Platform,
  ToastController,
} from '@ionic/angular';
import { App } from '@capacitor/app';

// Import your internal services
import { AuthService } from './features/auth/auth.service';
import { FcmService } from './features/fcm/fcm.service';
import { IonApp, IonRouterOutlet } from "@ionic/angular/standalone";

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [CommonModule, IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  @ViewChild(IonRouterOutlet, { static: true }) routerOutlet: IonRouterOutlet;

  constructor(
    private authService: AuthService,
    private fcmService: FcmService,
    private platform: Platform,
    private router: Router,
    private toastController: ToastController
  ) {}

  async ngOnInit() {
    // Wait for the native platform to be ready
     await this.platform.ready()

     // 2. Only init FCM on native platforms to avoid Web errors
    if (this.platform.is('hybrid')) {
      this.fcmService.initPush();
    }

    const isSignedInIntent = JSON.parse(
      localStorage.getItem('isSignedIn') || 'false'
    );

    if (isSignedInIntent) {
      this.authService.autoLogin();
    } else {
      this.authService.clearUser();
    }

    this.setupBackButton();
  }

  setupBackButton() {
    this.platform.backButton.subscribeWithPriority(10, () => {
      const url = this.router.url;
      const isLoginPage = url.includes('/login');
      const isHomePage = url.includes('/landing/tabs/home');

      if (isLoginPage || isHomePage) {
        this.minimizeWithToast();
      } else {
        if (this.routerOutlet && this.routerOutlet.canGoBack()) {
          this.routerOutlet.pop();
        }
      }
    });
  }

  private async minimizeWithToast() {
    const toast = await this.toastController.create({
      message: 'Closing app...',
      duration: 1000,
      position: 'bottom',
    });
    await toast.present();

    setTimeout(() => {
      App.minimizeApp();
    }, 800);
  }
}
