// import { Component, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
// import { Router } from '@angular/router';
// import { NavController } from '@ionic/angular/standalone';
// import { Preferences } from '@capacitor/preferences';

// import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { IonicModule } from '@ionic/angular';
// import { register } from 'swiper/element/bundle';

// import { AuthService } from 'src/app/services/auth/auth.service';

// // Register Swiper Web Components
// register();

// @Component({
//   selector: 'app-onboarding',
//   templateUrl: './onboarding.page.html',
//   styleUrls: ['./onboarding.page.scss'],
//   imports: [CommonModule, IonicModule],
//   standalone: true,
//   schemas: [CUSTOM_ELEMENTS_SCHEMA],
// })
// export class OnboardingPage implements AfterViewInit {
//   @ViewChild('swiper') swiperRef: ElementRef | undefined;

//   isLastSlide = false;

//   // Added 'loading' state
//   notificationStatus: 'idle' | 'loading' | 'granted' | 'denied' = 'idle';

//   constructor(
//     private navCtrl: NavController,
//     private router: Router,
//     private authService: AuthService,
//     private cdr: ChangeDetectorRef
//   ) {}

//   ngAfterViewInit() {
//     this.initSwiperEvents();
//   }

//   private initSwiperEvents() {
//     const swiperEl = this.swiperRef?.nativeElement;
//     if (!swiperEl) return;

//     // Listen to native swiper slide change events
//     swiperEl.addEventListener('swiper slidechange', (event: any) => {
//       const swiper = event.detail[0];
//       this.isLastSlide = swiper.isEnd;
//     });

//     // Backup check using activeIndex in case total slides === 3 (indices 0, 1, 2)
//     swiperEl.addEventListener('swiper activeindexchange', (event: any) => {
//       const swiper = event.detail[0];
//       this.isLastSlide = swiper.activeIndex === (swiper.slides.length - 1) || swiper.isEnd;
//     });
//   }

//   /**
//    * Advances to next slide or finishes onboarding if on the last slide
//    */
//   nextOrFinish() {
//     const swiper = this.swiperRef?.nativeElement?.swiper;

//     if (this.isLastSlide || !swiper) {
//       this.finishOnboarding();
//     } else {
//       swiper.slideNext();
//       // Check immediately after triggering slideNext
//       setTimeout(() => {
//         if (swiper) {
//           this.isLastSlide = swiper.isEnd;
//         }
//       }, 150);
//     }
//   }

// async requestNotifications() {
//     // 1. Instantly show a spinner/loading state in the UI
//     this.notificationStatus = 'loading';
//     this.cdr.detectChanges(); // Force template update right away

//     try {
//       // 2. Trigger native permission & backend token sync
//       await this.authService.registerDeviceTokenAfterLogin();

//       // 3. Update status on success
//       this.notificationStatus = 'granted';
//     } catch (error) {
//       console.warn('User denied notifications or error occurred:', error);
//       this.notificationStatus = 'denied';
//     } finally {
//       // 4. Ensure Angular re-renders the DOM immediately
//       this.cdr.detectChanges();
//     }
//   }

//   /**
//    * Sets completion flag and routes to the home tab workspace
//    */
//   async finishOnboarding() {
//     await Preferences.set({ key: 'chms_onboarding_completed', value: 'true' });
//     this.navCtrl.navigateRoot('/landing/tabs/home');
//   }
// }


import { Component, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular/standalone';
import { Preferences } from '@capacitor/preferences';

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { register } from 'swiper/element/bundle';

import { AuthService } from 'src/app/services/auth/auth.service';
import { PushNotifications } from '@capacitor/push-notifications';
import { FcmService } from 'src/app/services/fcm/fcm.service';

// Register Swiper Web Components
register();

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
  imports: [CommonModule, IonicModule],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class OnboardingPage implements AfterViewInit {
  @ViewChild('swiper') swiperRef: ElementRef | undefined;

  isLastSlide = false;
  notificationStatus: 'idle' | 'loading' | 'granted' | 'denied' = 'idle';

  constructor(
    private navCtrl: NavController,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private fcmService: FcmService
  ) { }

  ngAfterViewInit() {
    this.initSwiperEvents();
  }

  private initSwiperEvents() {
    const swiperEl = this.swiperRef?.nativeElement;
    if (!swiperEl) return;

    // Listen to native Swiper Web Component events
    swiperEl.addEventListener('swiperslidechange', (event: any) => {
      const swiper = event.detail[0];
      this.isLastSlide = swiper.isEnd;
      this.cdr.detectChanges(); // Sync UI immediately
    });

    // Fallback: fires specifically when reaching the last slide
    swiperEl.addEventListener('swiperreachend', () => {
      this.isLastSlide = true;
      this.cdr.detectChanges();
    });
  }

  /**
   * Advances to next slide or finishes onboarding if on the last slide
   */
  nextOrFinish() {
    const swiper = this.swiperRef?.nativeElement?.swiper;

    if (this.isLastSlide || !swiper) {
      this.finishOnboarding();
    } else {
      swiper.slideNext();
    }
  }

  async requestNotifications() {
    this.notificationStatus = 'loading';
    this.cdr.detectChanges();

    try {
      await this.authService.registerDeviceTokenAfterLogin();
      this.notificationStatus = 'granted';
    } catch (error) {
      console.warn('User denied notifications or error occurred:', error);
      this.notificationStatus = 'denied';
    } finally {
      this.cdr.detectChanges();
    }
  }

async finishOnboarding() {
    // 1. Mark onboarding as complete in Capacitor Preferences immediately
    await Preferences.set({ key: 'chms_onboarding_completed', value: 'true' });

    // 2. Navigate into the main application tabs immediately so the user is never blocked
    await this.navCtrl.navigateRoot('/landing/tabs/home');

    // 3. Request FCM token and sync in the background (non-blocking)
    this.fcmService.requestPermissionAndGetToken()
      .then(async (token) => {
        if (token) {
          await this.authService.silentdeviceTokenSync();
        }
      })
      .catch((err) => {
        console.warn('⚠️ [ONBOARDING] Background FCM token setup postponed:', err);
      });
  }

}