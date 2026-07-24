// import { Injectable } from "@angular/core";
// import { Capacitor } from "@capacitor/core";
// import {
//   ActionPerformed,
//   PushNotifications,
//   PushNotificationSchema,
//   Token,
// } from "@capacitor/push-notifications";
// import { BehaviorSubject, Observable } from "rxjs";
// import { initializeApp } from "firebase/app";
// import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";
// import { environment } from "src/environments/environment";

// @Injectable({
//   providedIn: "root",
// })
// export class FcmService {
//   private registrationTokenSubject: BehaviorSubject<string> =
//     new BehaviorSubject<string>("");
//   private messaging: Messaging | null = null;

//   // 🔑 IMPORTANT: Add your Firebase VAPID Public Key from Firebase Console
//   // Project Settings → Cloud Messaging → Web Push certificates → Public key
//   private VAPID_PUBLIC_KEY = "BL7m8QRW2yo_BM_iLGdw7WAiqxBYFG70fQy13h2FpAgY-sg5A0YirSvgp2BL2eUN-vaZxAiQltYPo6GQI7jeTw8";

//   private fcmInitialized = false;

//   constructor() {
//     // this.initializeFCM();
//   }

//   /**
//    * Initialize FCM based on platform
//    */
//   private async initializeFCM() {
//     if (Capacitor.getPlatform() === "web") {
//       // Web platform: Use Firebase Messaging
//       await this.initializeWebMessaging();
//     } else {
//       // Mobile platform: Use Capacitor Push Notifications
//       this.registerPush();
//     }
//     this.fcmInitialized = true;
//   }

//   /**
//    * Wait for FCM to be fully initialized
//    */
//   async waitForFCMInitialization(): Promise<void> {
//     let attempts = 0;
//     while (!this.fcmInitialized && attempts < 50) {
//       await new Promise(resolve => setTimeout(resolve, 100));
//       attempts++;
//     }
//     if (!this.fcmInitialized) {
//       console.warn("⚠️ [FCM] FCM initialization timeout. Continuing anyway...");
//     }
//   }

//   /**
//    * Initialize Firebase Cloud Messaging for web
//    */
//   private async initializeWebMessaging() {
//     try {
//       const app = initializeApp(environment.firebaseConfig);
//       this.messaging = getMessaging(app);

//       // Check if the browser supports service workers
//       if ("serviceWorker" in navigator) {
//         try {
//           const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
//           console.log("✅ [FCM] Service Worker registered successfully:", registration);
//           await this.requestWebNotificationPermission(registration);
//         } catch (error) {
//           console.error("❌ [FCM] Service Worker registration failed:", error);
//         }
//       } else {
//         console.warn("⚠️ [FCM] Service Workers are not supported in this browser");
//       }

//       // Listen to messages when the app is in the foreground
//       onMessage(this.messaging, (payload) => {
//         console.log("[FCM] Foreground message received:", payload);
        
//         // Show notification in foreground
//         if (payload.notification) {
//           new Notification(payload.notification.title || "CHMS Notification", {
//             body: payload.notification.body,
//             icon: "/assets/icons/app-icon.png",
//             badge: "/assets/icons/badge-icon.png",
//             tag: "chms-notification",
//             data: payload.data
//           });
//         }
//       });
//     } catch (error) {
//       console.error("[FCM] Failed to initialize Firebase Messaging:", error);
//     }
//   }

//   /**
//    * Request permission for web notifications
//    */
//   private async requestWebNotificationPermission(registration?: ServiceWorkerRegistration) {
//     if (!this.messaging) return;

//     if (!this.VAPID_PUBLIC_KEY || this.VAPID_PUBLIC_KEY === 'ByvU2NSdp8sSQi8twTKrSylufrw12B41tQ6no4uHB-0') {
//       console.error('❌ [FCM] Missing VAPID public key. Set VAPID_PUBLIC_KEY in FcmService.');
//       return;
//     }

//     const tokenOptions: Record<string, any> = {
//       vapidKey: this.VAPID_PUBLIC_KEY,
//     };

//     if (registration) {
//       tokenOptions['serviceWorkerRegistration'] = registration;
//     }

//     try {
//       const token = await getToken(this.messaging, tokenOptions);
//       if (token) {
//         console.log("✅ [FCM] Web FCM Token obtained:", token);
//         this.registrationTokenSubject.next(token);
//         localStorage.setItem("chms-dms.fcm.mobile.registrationtoken ", token);
//       } else {
//         console.warn("⚠️ [FCM] No FCM token generated. User may have denied notification permission.");
//         await this.requestBrowserNotificationPermission();
//       }
//     } catch (error: any) {
//       const message = error?.message || error;
//       console.error("❌ [FCM] Error getting FCM token:", message);
//       if (message?.includes('InvalidAccessError')) {
//         console.error('❌ [FCM] Invalid VAPID key. Verify the VAPID public key in FcmService.VAPID_PUBLIC_KEY.');
//       }
//       await this.requestBrowserNotificationPermission();
//     }
//   }

//   /**
//    * Request browser notification permission (fallback)
//    */
//   private async requestBrowserNotificationPermission() {
//     if ("Notification" in window && Notification.permission === "default") {
//       try {
//         const permission = await Notification.requestPermission();
//         if (permission === "granted") {
//           console.log("✅ [FCM] Browser notification permission granted");
//           // Retry getting FCM token
//           await this.requestWebNotificationPermission();
//         } else {
//           console.warn("⚠️ [FCM] Browser notification permission denied");
//         }
//       } catch (error) {
//         console.error("❌ [FCM] Error requesting notification permission:", error);
//       }
//     }
//   }

//   initPush() {
//     if (Capacitor.getPlatform() !== "web") {
//       console.log("🔔 [FCM] Running in mobile device. Initializing Capacitor Push Notifications.");
//       this.registerPush();
//     }
//   }

//   async createNotificationChannels() {
//     // Check if we are on Android (Channels are Android-specific)
//     if (Capacitor.getPlatform() !== "web") {
//       // 1. Create a High Priority Channel for Alerts
//       await PushNotifications.createChannel({
//         id: "health_alerts",
//         name: "Health & Heat Alerts",
//         description: "Urgent notifications regarding animal health and heat events",
//         importance: 5, // 5 = Urgent (makes sound and pops up)
//         visibility: 1, // 1 = Public (shows on lock screen)
//         sound: "beep.wav", // Match the sound in your capacitor config
//         vibration: true,
//       });

//       // 2. Create a Default Channel for General Updates
//       await PushNotifications.createChannel({
//         id: "general_updates",
//         name: "General Farm Updates",
//         description: "Standard updates for milk entries and tasks",
//         importance: 3, // 3 = Default (makes sound but doesn't pop up over apps)
//         vibration: true,
//       });

//       console.log("✅ [FCM] Notification channels created!");
//     }
//   }

//   private registerPush() {
//     console.log("🔔 [FCM] Executing mobile push registration...");
//     PushNotifications.requestPermissions().then((result) => {
//       if (result.receive === "granted") {
//         console.log("✅ [FCM] Permission granted. Registering with FCM.");
//         // Register with Apple / Google to receive push via APNS/FCM
//         PushNotifications.register();
//       } else {
//         console.warn("⚠️ [FCM] Push notification permission denied.");
//       }
//     });

//     // On success, we should be able to receive notifications
//     PushNotifications.addListener("registration", (token: Token) => {
//       console.log("✅ [FCM] Registration success, token: " + token.value);
//       this.registrationTokenSubject.next(token.value);
//       localStorage.setItem("fcm-mobile-token", token.value);
//     });

//     // Some issue with our setup and push will not work
//     PushNotifications.addListener("registrationError", (error: any) => {
//       console.error("❌ [FCM] Registration error: " + JSON.stringify(error));
//     });

//     // Show us the notification payload if the app is open on our device
//     PushNotifications.addListener(
//       "pushNotificationReceived",
//       (notification: PushNotificationSchema) => {
//         console.log("🔔 [FCM] Push received (app in foreground):", JSON.stringify(notification));
//       }
//     );

//     // Method called when tapping on a notification
//     PushNotifications.addListener(
//       "pushNotificationActionPerformed",
//       (notification: ActionPerformed) => {
//         console.log("👆 [FCM] Notification tapped:", notification);

//         // Handle notification action (e.g., navigate to relevant page)
//         // Example:
//         // if (notification.notification.data?.page === 'animals') {
//         //   this.router.navigate(['/animals', notification.notification.data.id]);
//         // }
//       }
//     );
//   }

//   /**
//    * Expose a method to subscribe to the registration token
//    * Works for both web and mobile platforms
//    */
//   getRegistrationToken(): Observable<string> {
//     return this.registrationTokenSubject.asObservable();
//   }

//   /**
//    * Get current token value (for immediate use)
//    */
//   getCurrentToken(): string {
//     return this.registrationTokenSubject.value || 
//            localStorage.getItem("chms-dms.fcm.mobile.registrationtoken ") || 
//            localStorage.getItem("fcm-mobile-token") || 
//            "";
//   }

//   /**
//    * Get token as a promise (useful for sequential operations after login)
//    */
//   async getTokenAsync(): Promise<string> {
//     await this.waitForFCMInitialization();
//     return new Promise((resolve) => {
//       const token = this.getCurrentToken();
//       if (token) {
//         resolve(token);
//       } else {
//         // Subscribe and wait for token
//         const subscription = this.getRegistrationToken().subscribe((token) => {
//           if (token) {
//             subscription.unsubscribe();
//             resolve(token);
//           }
//         });
//         // Timeout after 5 seconds
//         setTimeout(() => {
//           subscription.unsubscribe();
//           resolve("");
//         }, 5000);
//       }
//     });
//   }
// }



// import { Injectable } from "@angular/core";
// import { Capacitor } from "@capacitor/core";
// import {
//   ActionPerformed,
//   PushNotifications,
//   PushNotificationSchema,
//   Token,
// } from "@capacitor/push-notifications";
// import { BehaviorSubject, Observable } from "rxjs";
// import { initializeApp } from "firebase/app";
// import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";
// import { environment } from "src/environments/environment";

// @Injectable({
//   providedIn: "root",
// })
// export class FcmService {
//   private registrationTokenSubject: BehaviorSubject<string> = new BehaviorSubject<string>("");
//   private messaging: Messaging | null = null;
//   private VAPID_PUBLIC_KEY = "BL7m8QRW2yo_BM_iLGdw7WAiqxBYFG70fQy13h2FpAgY-sg5A0YirSvgp2BL2eUN-vaZxAiQltYPo6GQI7jeTw8";
//   private listenersAttached = false;

//   constructor() {}

//   /**
//    * 🔑 Public entrypoint called explicitly by Onboarding or Settings pages
//    */
//   public async requestPermissionAndGetToken(): Promise<string> {
//     if (Capacitor.getPlatform() === "web") {
//       return await this.handleWebRegistration();
//     } else {
//       return await this.handleNativeRegistration();
//     }
//   }

//   private async handleNativeRegistration(): Promise<string> {
//     try {
//       this.attachNativeListeners();

//       let permStatus = await PushNotifications.checkPermissions();

//       if (permStatus.receive === 'prompt') {
//         permStatus = await PushNotifications.requestPermissions();
//       }

//       if (permStatus.receive !== 'granted') {
//         console.warn("⚠️ [FCM] Native push permission denied or not granted:", permStatus.receive);
//         return "";
//       }

//       await this.createNotificationChannels();

//       return new Promise<string>((resolve) => {
//         const existingToken = this.getCurrentToken();
//         if (existingToken) {
//           return resolve(existingToken);
//         }

//         const tokenSub = this.getRegistrationToken().subscribe((token) => {
//           if (token) {
//             tokenSub.unsubscribe();
//             resolve(token);
//           }
//         });

//         PushNotifications.register();

//         setTimeout(() => {
//           tokenSub.unsubscribe();
//           resolve(this.getCurrentToken());
//         }, 10000);
//       });
//     } catch (error) {
//       console.error("❌ [FCM] Native push setup failed:", error);
//       return "";
//     }
//   }

//   private attachNativeListeners() {
//     if (this.listenersAttached || Capacitor.getPlatform() === 'web') return;

//     PushNotifications.addListener("registration", (token: Token) => {
//       console.log("✅ [FCM] Native registration success:", token.value);
//       this.registrationTokenSubject.next(token.value);
//       localStorage.setItem("fcm-mobile-token", token.value);
//     });

//     PushNotifications.addListener("registrationError", (error: any) => {
//       console.error("❌ [FCM] Native registration error:", JSON.stringify(error));
//     });

//     PushNotifications.addListener("pushNotificationReceived", (notification: PushNotificationSchema) => {
//       console.log("🔔 [FCM] Foreground push received:", notification);
//     });

//     PushNotifications.addListener("pushNotificationActionPerformed", (notification: ActionPerformed) => {
//       console.log("👆 [FCM] Push tapped:", notification);
//     });

//     this.listenersAttached = true;
//   }

//   public async createNotificationChannels() {
//     if (Capacitor.getPlatform() === "android") {
//       await PushNotifications.createChannel({
//         id: "health_alerts",
//         name: "Health & Heat Alerts",
//         description: "Urgent notifications regarding animal health and heat events",
//         importance: 5,
//         visibility: 1,
//         sound: "beep.wav",
//         vibration: true,
//       });

//       await PushNotifications.createChannel({
//         id: "general_updates",
//         name: "General Farm Updates",
//         description: "Standard updates for milk entries and tasks",
//         importance: 3,
//         vibration: true,
//       });
//     }
//   }

//   private async handleWebRegistration(): Promise<string> {
//     try {
//       if (!("serviceWorker" in navigator)) {
//         console.warn("⚠️ [FCM] Service workers not supported in this browser.");
//         return "";
//       }

//       if (!this.messaging) {
//         const app = initializeApp(environment.firebaseConfig);
//         this.messaging = getMessaging(app);

//         onMessage(this.messaging, (payload) => {
//           if (payload.notification) {
//             new Notification(payload.notification.title || "CHMS Notification", {
//               body: payload.notification.body,
//               icon: "/assets/icons/app-icon.png",
//               badge: "/assets/icons/badge-icon.png",
//               tag: "chms-notification",
//               data: payload.data
//             });
//           }
//         });
//       }

//       const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

//       if (Notification.permission === 'default') {
//         const permission = await Notification.requestPermission();
//         if (permission !== 'granted') {
//           console.warn("⚠️ [FCM] Web notification permission denied.");
//           return "";
//         }
//       } else if (Notification.permission === 'denied') {
//         return "";
//       }

//       const token = await getToken(this.messaging, {
//         vapidKey: this.VAPID_PUBLIC_KEY,
//         serviceWorkerRegistration: registration,
//       });

//       if (token) {
//         console.log("✅ [FCM] Web FCM Token obtained:", token);
//         this.registrationTokenSubject.next(token);
//         localStorage.setItem("chms-dms.fcm.mobile.registrationtoken", token);
//         return token;
//       }
//       return "";
//     } catch (error) {
//       console.error("❌ [FCM] Web token acquisition failed:", error);
//       return "";
//     }
//   }

//   getRegistrationToken(): Observable<string> {
//     return this.registrationTokenSubject.asObservable();
//   }

//   getCurrentToken(): string {
//     return (
//       this.registrationTokenSubject.value ||
//       localStorage.getItem("chms-dms.fcm.mobile.registrationtoken") ||
//       localStorage.getItem("fcm-mobile-token") ||
//       ""
//     );
//   }

//   async getTokenAsync(): Promise<string> {
//     return await this.requestPermissionAndGetToken();
//   }
// }





import { Injectable } from "@angular/core";
import { Capacitor } from "@capacitor/core";
import {
  ActionPerformed,
  PushNotifications,
  PushNotificationSchema,
  Token,
} from "@capacitor/push-notifications";
import { BehaviorSubject, Observable } from "rxjs";
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, deleteToken, onMessage, Messaging } from "firebase/messaging";
import { environment } from "src/environments/environment";
import { deleteToken as deleteWebToken } from 'firebase/messaging';

@Injectable({
  providedIn: "root",
})
export class FcmService {
  private registrationTokenSubject: BehaviorSubject<string> = new BehaviorSubject<string>("");
  private messaging: Messaging | null = null;
  private VAPID_PUBLIC_KEY = "BL7m8QRW2yo_BM_iLGdw7WAiqxBYFG70fQy13h2FpAgY-sg5A0YirSvgp2BL2eUN-vaZxAiQltYPo6GQI7jeTw8";
  private listenersAttached = false;

  private readonly NOTIFICATION_PREF_KEY = "user_push_notifications_enabled";

  public readonly TOKEN_STORAGE_KEY = "chms-dms.fcm.registrationtoken";

  constructor() {}

  // ==========================================
  // ⚙️ PREFERENCE TOGGLE MANAGEMENT
  // ==========================================

  /**
   * Check if push notifications are enabled in user settings
   */
  public isNotificationEnabled(): boolean {
    const pref = localStorage.getItem(this.NOTIFICATION_PREF_KEY);
    return pref !== null ? JSON.parse(pref) : true; // Default to true
  }

  /**
   * Enable notifications: Request permissions and get token
   */
  public async enableNotifications(): Promise<string> {
    localStorage.setItem(this.NOTIFICATION_PREF_KEY, JSON.stringify(true));
    return await this.requestPermissionAndGetToken();
  }

  /**
   * Disable notifications: Unregister tokens and update local state
   */
  public async disableNotifications(): Promise<boolean> {
    try {
      localStorage.setItem(this.NOTIFICATION_PREF_KEY, JSON.stringify(false));

      if (Capacitor.getPlatform() === "web") {
        if (this.messaging) {
          await deleteToken(this.messaging);
        }
      } else {
        // Native Capacitor Push unregister
        await PushNotifications.unregister();
      }

      // Clear internal state & cache keys
      this.registrationTokenSubject.next("");
      localStorage.removeItem("fcm-mobile-token");
      localStorage.removeItem("chms-dms.fcm.mobile.registrationtoken");

      console.log("🚫 [FCM] Push notifications disabled and token cleared.");
      return true;
    } catch (error) {
      console.error("❌ [FCM] Failed to disable push notifications:", error);
      return false;
    }
  }

  // ==========================================
  // 🔑 REGISTRATION FLOWS
  // ==========================================

  public async requestPermissionAndGetToken(): Promise<string> {
    if (!this.isNotificationEnabled()) {
      console.log("ℹ️ [FCM] Push notifications are disabled in user settings.");
      return "";
    }

    if (Capacitor.getPlatform() === "web") {
      return await this.handleWebRegistration();
    } else {
      return await this.handleNativeRegistration();
    }
  }

  private async handleNativeRegistration(): Promise<string> {
    try {
      this.attachNativeListeners();

      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.warn("⚠️ [FCM] Native push permission denied:", permStatus.receive);
        return "";
      }

      await this.createNotificationChannels();

      return new Promise<string>((resolve) => {
        const existingToken = this.getCurrentToken();
        if (existingToken) {
          return resolve(existingToken);
        }

        const tokenSub = this.getRegistrationToken().subscribe((token) => {
          if (token) {
            tokenSub.unsubscribe();
            resolve(token);
          }
        });

        PushNotifications.register();

        setTimeout(() => {
          tokenSub.unsubscribe();
          resolve(this.getCurrentToken());
        }, 10000);
      });
    } catch (error) {
      console.error("❌ [FCM] Native push setup failed:", error);
      return "";
    }
  }

  private attachNativeListeners() {
    if (this.listenersAttached || Capacitor.getPlatform() === 'web') return;

    PushNotifications.addListener("registration", (token: Token) => {
      console.log("✅ [FCM] Native registration success:", token.value);
      this.registrationTokenSubject.next(token.value);
      localStorage.setItem("fcm-mobile-token", token.value);
    });

    PushNotifications.addListener("registrationError", (error: any) => {
      console.error("❌ [FCM] Native registration error:", JSON.stringify(error));
    });

    PushNotifications.addListener("pushNotificationReceived", (notification: PushNotificationSchema) => {
      console.log("🔔 [FCM] Foreground push received:", notification);
    });

    PushNotifications.addListener("pushNotificationActionPerformed", (notification: ActionPerformed) => {
      console.log("👆 [FCM] Push tapped:", notification);
    });

    this.listenersAttached = true;
  }

  public async createNotificationChannels() {
    if (Capacitor.getPlatform() === "android") {
      await PushNotifications.createChannel({
        id: "health_alerts",
        name: "Health & Heat Alerts",
        description: "Urgent notifications regarding animal health and heat events",
        importance: 5,
        visibility: 1,
        sound: "beep.wav",
        vibration: true,
      });

      await PushNotifications.createChannel({
        id: "general_updates",
        name: "General Farm Updates",
        description: "Standard updates for milk entries and tasks",
        importance: 3,
        vibration: true,
      });
    }
  }

  private async handleWebRegistration(): Promise<string> {
    try {
      if (!("serviceWorker" in navigator)) {
        console.warn("⚠️ [FCM] Service workers not supported in this browser.");
        return "";
      }

      if (!this.messaging) {
        const app = initializeApp(environment.firebaseConfig);
        this.messaging = getMessaging(app);

        onMessage(this.messaging, (payload) => {
          if (payload.notification) {
            new Notification(payload.notification.title || "CHMS Notification", {
              body: payload.notification.body,
              icon: "/assets/icons/fd.png",
              badge: "/assets/icons/favicon.png",
              tag: "chms-notification",
              data: payload.data
            });
          }
        });
      }

      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.warn("⚠️ [FCM] Web notification permission denied.");
          return "";
        }
      } else if (Notification.permission === 'denied') {
        return "";
      }

      const token = await getToken(this.messaging, {
        vapidKey: this.VAPID_PUBLIC_KEY,
        serviceWorkerRegistration: registration,
      });

      if (token) {
        console.log("✅ [FCM] Web FCM Token obtained:", token);
        this.registrationTokenSubject.next(token);
        localStorage.setItem("chms-dms.fcm.mobile.registrationtoken", token);
        return token;
      }
      return "";
    } catch (error) {
      console.error("❌ [FCM] Web token acquisition failed:", error);
      return "";
    }
  }

  getRegistrationToken(): Observable<string> {
    return this.registrationTokenSubject.asObservable();
  }

  getCurrentToken(): string {
    return (
      this.registrationTokenSubject.value ||
      localStorage.getItem("chms-dms.fcm.mobile.registrationtoken") ||
      localStorage.getItem("fcm-mobile-token") ||
      ""
    );
  }

  async getTokenAsync(): Promise<string> {
    return await this.requestPermissionAndGetToken();
  }

/**
 * Completely revokes/clears the FCM token on client-side
 */
public async deleteToken(): Promise<boolean> {
  try {
    // 1. Web Platform Clean Up
    if (Capacitor.getPlatform() === 'web') {
      if (this.messaging) {
        // Firebase Web SDK method to revoke token from Google servers
        await deleteWebToken(this.messaging);
        console.log('✅ [FCM] Web Push token deleted from Firebase.');
      }
    } else {
      // 2. Mobile Native Clean Up (Capacitor)
      // On mobile native, do NOT call deprecated PushNotifications.unregister().
      // Simply remove listeners so foreground events stop firing.
      await PushNotifications.removeAllListeners();
      this.listenersAttached = false;
      console.log('✅ [FCM] Native push listeners cleared.');
    }

    // 3. Wipe internal reactive state
    this.registrationTokenSubject.next('');

    // 4. Wipe cached token from browser storage
    localStorage.removeItem(this.TOKEN_STORAGE_KEY);
    localStorage.removeItem('fcm-mobile-token');

    return true;
  } catch (error) {
    console.error('❌ [FCM] Failed to delete FCM token:', error);
    return false;
  }
}
}