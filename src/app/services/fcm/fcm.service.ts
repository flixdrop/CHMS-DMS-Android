
// import { Injectable, inject } from "@angular/core";
// import { Router } from "@angular/router";
// import { Capacitor } from "@capacitor/core";
// import {
//   ActionPerformed,
//   PushNotifications,
//   PushNotificationSchema,
//   Token,
// } from "@capacitor/push-notifications";
// import { BehaviorSubject, Observable, firstValueFrom } from "rxjs";
// import { filter } from "rxjs/operators";
// import { initializeApp } from "firebase/app";
// import {
//   getMessaging,
//   getToken,
//   deleteToken as deleteWebToken,
//   onMessage,
//   Messaging,
// } from "firebase/messaging";
// import { environment } from "src/environments/environment";

// @Injectable({
//   providedIn: "root",
// })
// export class FcmService {
//   private router = inject(Router);

//   private registrationTokenSubject = new BehaviorSubject<string>("");
//   private messaging: Messaging | null = null;
//   private VAPID_PUBLIC_KEY =
//     environment.vapidKey ||
//     "BL7m8QRW2yo_BM_iLGdw7WAiqxBYFG70fQy13h2FpAgY-sg5A0YirSvgp2BL2eUN-vaZxAiQltYPo6GQI7jeTw8";
//   private listenersAttached = false;

//   private readonly NOTIFICATION_PREF_KEY = "user_push_notifications_enabled";
//   public readonly TOKEN_STORAGE_KEY = "chms-dms.fcm.registrationtoken";

//   constructor() {
//     const savedToken = this.getStoredToken();
//     if (savedToken) {
//       this.registrationTokenSubject.next(savedToken);
//     }
//   }

//   // ==========================================
//   // ⚙️ PREFERENCE TOGGLE MANAGEMENT
//   // ==========================================

//   public isNotificationEnabled(): boolean {
//     const pref = localStorage.getItem(this.NOTIFICATION_PREF_KEY);
//     return pref !== null ? JSON.parse(pref) : true;
//   }

//   public async enableNotifications(): Promise<string> {
//     localStorage.setItem(this.NOTIFICATION_PREF_KEY, JSON.stringify(true));
//     return await this.requestPermissionAndGetToken();
//   }

//   public async disableNotifications(): Promise<boolean> {
//     try {
//       localStorage.setItem(this.NOTIFICATION_PREF_KEY, JSON.stringify(false));
//       return await this.deleteToken();
//     } catch (error) {
//       console.error("❌ [FCM] Failed to disable push notifications:", error);
//       return false;
//     }
//   }

//   // ==========================================
//   // 🔑 REGISTRATION FLOWS
//   // ==========================================

//   public async requestPermissionAndGetToken(): Promise<string> {
//     if (!this.isNotificationEnabled()) {
//       console.log("ℹ️ [FCM] Push notifications are disabled in user settings.");
//       return "";
//     }

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

//       if (permStatus.receive === "prompt") {
//         permStatus = await PushNotifications.requestPermissions();
//       }

//       if (permStatus.receive !== "granted") {
//         console.warn("⚠️ [FCM] Native push permission denied:", permStatus.receive);
//         return "";
//       }

//       await this.createNotificationChannels();

//       // Reset local subject prior to native registration to prevent stale token reuse
//       this.registrationTokenSubject.next("");

//       const tokenPromise = firstValueFrom(
//         this.registrationTokenSubject.pipe(filter((token) => !!token))
//       );

//       // Trigger native FCM registration
//       await PushNotifications.register();

//       const timeoutPromise = new Promise<string>((resolve) =>
//         setTimeout(() => {
//           // Fallback to stored token if registration listener times out
//           const stored = this.getStoredToken();
//           if (stored) {
//             this.registrationTokenSubject.next(stored);
//           }
//           resolve(stored || "");
//         }, 5000)
//       );

//       return await Promise.race([tokenPromise, timeoutPromise]);
//     } catch (error) {
//       console.error("❌ [FCM] Native push setup failed:", error);
//       return "";
//     }
//   }

//   private attachNativeListeners() {
//     if (this.listenersAttached || Capacitor.getPlatform() === "web") return;

//     PushNotifications.addListener("registration", (token: Token) => {
//       console.log("✅ [FCM] Native registration success:", token.value);
//       this.storeToken(token.value);
//     });

//     PushNotifications.addListener("registrationError", (error: any) => {
//       console.error("❌ [FCM] Native registration error:", JSON.stringify(error));
//     });

//     PushNotifications.addListener(
//       "pushNotificationReceived",
//       (notification: PushNotificationSchema) => {
//         console.log("🔔 [FCM] Foreground push received:", notification);
//       }
//     );

//     PushNotifications.addListener(
//       "pushNotificationActionPerformed",
//       (action: ActionPerformed) => {
//         console.log("👆 [FCM] Push tapped:", action);
//         const data = action.notification.data;
//         const targetPath = data?.path || data?.deepLink;

//         if (targetPath) {
//           console.log(`🔗 [FCM Directing Navigation] -> ${targetPath}`);
//           this.router.navigateByUrl(targetPath);
//         }
//       }
//     );

//     this.listenersAttached = true;
//   }

//   public async createNotificationChannels() {
//     if (Capacitor.getPlatform() === "android") {
//       try {
//         await PushNotifications.createChannel({
//           id: "health_alerts",
//           name: "Health & Heat Alerts",
//           description: "Urgent notifications regarding animal health and heat events",
//           importance: 5,
//           visibility: 1,
//           vibration: true,
//         });

//         await PushNotifications.createChannel({
//           id: "device_alerts",
//           name: "Device & Telemetry Alerts",
//           description: "Notifications regarding IoT device status and connection drops",
//           importance: 4,
//           visibility: 1,
//           vibration: true,
//         });

//         await PushNotifications.createChannel({
//           id: "milking_alerts",
//           name: "Milking & Routine Tasks",
//           description: "Scheduled reminders for farm operations and milking",
//           importance: 3,
//           visibility: 1,
//           vibration: true,
//         });

//         await PushNotifications.createChannel({
//           id: "general_updates",
//           name: "General Farm Updates",
//           description: "Standard updates for milk entries and tasks",
//           importance: 3,
//           vibration: true,
//         });
//       } catch (err) {
//         console.warn("⚠️ [FCM] Could not create notification channels:", err);
//       }
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
//               icon: "/assets/icons/fd.png",
//               badge: "/assets/icons/favicon.png",
//               tag: "chms-notification",
//               data: payload.data,
//             });
//           }
//         });
//       }

//       const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

//       if (Notification.permission === "default") {
//         const permission = await Notification.requestPermission();
//         if (permission !== "granted") {
//           console.warn("⚠️ [FCM] Web notification permission denied.");
//           return "";
//         }
//       } else if (Notification.permission === "denied") {
//         return "";
//       }

//       const token = await getToken(this.messaging, {
//         vapidKey: this.VAPID_PUBLIC_KEY,
//         serviceWorkerRegistration: registration,
//       });

//       if (token) {
//         console.log("✅ [FCM] Web FCM Token obtained:", token);
//         this.storeToken(token);
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
//     return this.registrationTokenSubject.value || this.getStoredToken();
//   }

//   // async getTokenAsync(): Promise<string> {
//   //   const existing = this.getCurrentToken();
//   //   if (existing) return existing;
//   //   return await this.requestPermissionAndGetToken();
//   // }

//   async getTokenAsync(): Promise<string> {
//     const existing = this.getCurrentToken();
//     if (existing) return existing;
//     return await this.requestPermissionAndGetToken();
//   }

// private async isPushPermissionGranted(): Promise<boolean> {
//   if (Capacitor.getPlatform() === 'web') {
//     return typeof Notification !== 'undefined' && Notification.permission === 'granted';
//   } else {
//     const permStatus = await PushNotifications.checkPermissions();
//     return permStatus.receive === 'granted';
//   }
// }

//   /**
//    * Complete Teardown and Unregistration on Logout
//    */
//   public async deleteToken(): Promise<boolean> {
//     try {
//       if (Capacitor.getPlatform() === "web") {
//         if (this.messaging) {
//           await deleteWebToken(this.messaging);
//           console.log("✅ [FCM] Web Push token deleted from Firebase.");
//         }
//       } else {
//         // 1. Remove native listeners
//         await PushNotifications.removeAllListeners();
//         this.listenersAttached = false;

//         // 2. Unregister from native FCM/APNs hardware layer
//         await PushNotifications.unregister();
//         console.log("✅ [FCM] Native push unregistered.");
//       }
//       return true;
//     } catch (error) {
//       console.error("❌ [FCM] Exception during token cleanup:", error);
//       return false;
//     } finally {
//       // Always purge local storage and state even if native call throws
//       this.clearStoredTokens();
//     }
//   }

//   // ==========================================
//   // 🧹 INTERNAL STORAGE HELPERS
//   // ==========================================

//   private storeToken(token: string) {
//     this.registrationTokenSubject.next(token);
//     localStorage.setItem(this.TOKEN_STORAGE_KEY, token);
//   }

//   private getStoredToken(): string {
//     return (
//       localStorage.getItem(this.TOKEN_STORAGE_KEY) ||
//       localStorage.getItem("chms-dms.fcm.mobile.registrationtoken") ||
//       localStorage.getItem("fcm-mobile-token") ||
//       ""
//     );
//   }

//   private clearStoredTokens() {
//     this.registrationTokenSubject.next("");
//     localStorage.removeItem(this.TOKEN_STORAGE_KEY);
//     localStorage.removeItem("chms-dms.fcm.mobile.registrationtoken");
//     localStorage.removeItem("fcm-mobile-token");
//   }
// }


// import { Injectable, inject } from "@angular/core";
// import { Router } from "@angular/router";
// import { Capacitor } from "@capacitor/core";
// import {
//   ActionPerformed,
//   PushNotifications,
//   PushNotificationSchema,
//   Token,
// } from "@capacitor/push-notifications";
// import { BehaviorSubject, Observable, firstValueFrom, timeout, catchError, of } from "rxjs";
// import { filter } from "rxjs/operators";
// import { initializeApp } from "firebase/app";
// import {
//   getMessaging,
//   getToken,
//   deleteToken as deleteWebToken,
//   onMessage,
//   Messaging,
// } from "firebase/messaging";
// import { environment } from "src/environments/environment";

// @Injectable({
//   providedIn: "root",
// })
// export class FcmService {
//   private router = inject(Router);

//   private registrationTokenSubject = new BehaviorSubject<string>("");
//   private messaging: Messaging | null = null;
//   private VAPID_PUBLIC_KEY =
//     environment.vapidKey ||
//     "BL7m8QRW2yo_BM_iLGdw7WAiqxBYFG70fQy13h2FpAgY-sg5A0YirSvgp2BL2eUN-vaZxAiQltYPo6GQI7jeTw8";
//   private listenersAttached = false;

//   private readonly NOTIFICATION_PREF_KEY = "user_push_notifications_enabled";
//   public readonly TOKEN_STORAGE_KEY = "chms-dms.fcm.registrationtoken";

//   constructor() {
//     const savedToken = this.getStoredToken();
//     if (savedToken) {
//       this.registrationTokenSubject.next(savedToken);
//     }
//   }

//   // ==========================================
//   // ⚙️ PREFERENCE TOGGLE MANAGEMENT
//   // ==========================================

//   public isNotificationEnabled(): boolean {
//     const pref = localStorage.getItem(this.NOTIFICATION_PREF_KEY);
//     return pref !== null ? JSON.parse(pref) : true;
//   }

//   public async enableNotifications(): Promise<string> {
//     localStorage.setItem(this.NOTIFICATION_PREF_KEY, JSON.stringify(true));
//     return await this.requestPermissionAndGetToken();
//   }

//   public async disableNotifications(): Promise<boolean> {
//     try {
//       localStorage.setItem(this.NOTIFICATION_PREF_KEY, JSON.stringify(false));
//       return await this.deleteToken();
//     } catch (error) {
//       console.error("❌ [FCM] Failed to disable push notifications:", error);
//       return false;
//     }
//   }

//   public async isPushPermissionGranted(): Promise<boolean> {
//     if (Capacitor.getPlatform() === "web") {
//       return typeof Notification !== "undefined" && Notification.permission === "granted";
//     } else {
//       const permStatus = await PushNotifications.checkPermissions();
//       return permStatus.receive === "granted";
//     }
//   }

//   // ==========================================
//   // 🔑 REGISTRATION FLOWS
//   // ==========================================

//   public async requestPermissionAndGetToken(): Promise<string> {
//     if (!this.isNotificationEnabled()) {
//       console.log("ℹ️ [FCM] Push notifications are disabled in user settings.");
//       return "";
//     }

//     if (Capacitor.getPlatform() === "web") {
//       return await this.handleWebRegistration();
//     } else {
//       return await this.handleNativeRegistration();
//     }
//   }

//   private async handleNativeRegistration(): Promise<string> {
//     try {
//       this.attachNativeListeners();

//       let isGranted = await this.isPushPermissionGranted();
//       if (!isGranted) {
//         const permStatus = await PushNotifications.requestPermissions();
//         isGranted = permStatus.receive === "granted";
//       }

//       if (!isGranted) {
//         console.warn("⚠️ [FCM] Native push permission denied.");
//         return "";
//       }

//       await this.createNotificationChannels();

//       // Clear subject and storage to avoid returning stale tokens during re-auth
//       this.registrationTokenSubject.next("");
      
//       const tokenPromise$ = this.registrationTokenSubject.pipe(
//         filter((token): token is string => !!token && token.trim().length > 0),
//         timeout(6000),
//         catchError(() => {
//           console.warn("⚠️ [FCM] Native token registration timed out.");
//           return of(this.getStoredToken());
//         })
//       );

//       // Trigger native FCM registration call
//       await PushNotifications.register();

//       const token = await firstValueFrom(tokenPromise$);
//       return token || "";
//     } catch (error) {
//       console.error("❌ [FCM] Native push setup failed:", error);
//       return "";
//     }
//   }

//   private attachNativeListeners() {
//     if (this.listenersAttached || Capacitor.getPlatform() === "web") return;

//     PushNotifications.addListener("registration", (token: Token) => {
//       console.log("✅ [FCM] Native registration success:", token.value);
//       this.storeToken(token.value);
//     });

//     PushNotifications.addListener("registrationError", (error: any) => {
//       console.error("❌ [FCM] Native registration error:", JSON.stringify(error));
//     });

//     PushNotifications.addListener(
//       "pushNotificationReceived",
//       (notification: PushNotificationSchema) => {
//         console.log("🔔 [FCM] Foreground push received:", notification);
//       }
//     );

//     PushNotifications.addListener(
//       "pushNotificationActionPerformed",
//       (action: ActionPerformed) => {
//         console.log("👆 [FCM] Push tapped:", action);
//         const data = action.notification.data;
//         const targetPath = data?.path || data?.deepLink;

//         if (targetPath) {
//           console.log(`🔗 [FCM Directing Navigation] -> ${targetPath}`);
//           this.router.navigateByUrl(targetPath);
//         }
//       }
//     );

//     this.listenersAttached = true;
//   }

//   public async createNotificationChannels() {
//     if (Capacitor.getPlatform() === "android") {
//       try {
//         await PushNotifications.createChannel({
//           id: "health_alerts",
//           name: "Health & Heat Alerts",
//           description: "Urgent notifications regarding animal health and heat events",
//           importance: 5,
//           visibility: 1,
//           vibration: true,
//         });

//         await PushNotifications.createChannel({
//           id: "device_alerts",
//           name: "Device & Telemetry Alerts",
//           description: "Notifications regarding IoT device status and connection drops",
//           importance: 4,
//           visibility: 1,
//           vibration: true,
//         });

//         await PushNotifications.createChannel({
//           id: "milking_alerts",
//           name: "Milking & Routine Tasks",
//           description: "Scheduled reminders for farm operations and milking",
//           importance: 3,
//           visibility: 1,
//           vibration: true,
//         });

//         await PushNotifications.createChannel({
//           id: "general_updates",
//           name: "General Farm Updates",
//           description: "Standard updates for milk entries and tasks",
//           importance: 3,
//           vibration: true,
//         });
//       } catch (err) {
//         console.warn("⚠️ [FCM] Could not create notification channels:", err);
//       }
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
//           if (
//             payload.notification &&
//             typeof Notification !== "undefined" &&
//             Notification.permission === "granted"
//           ) {
//             const notificationInstance = new Notification(
//               payload.notification.title || "CHMS Notification",
//               {
//                 body: payload.notification.body,
//                 icon: "/assets/icons/fd.png",
//                 badge: "/assets/icons/favicon.png",
//                 tag: "chms-notification",
//                 data: payload.data,
//               }
//             );

//             notificationInstance.onclick = () => {
//               const targetPath = payload.data?.['path'] || payload.data?.['deepLink'];
//               if (targetPath) {
//                 this.router.navigateByUrl(targetPath);
//               }
//             };
//           }
//         });
//       }

//       const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

//       if (Notification.permission === "default") {
//         const permission = await Notification.requestPermission();
//         if (permission !== "granted") {
//           console.warn("⚠️ [FCM] Web notification permission denied.");
//           return "";
//         }
//       } else if (Notification.permission === "denied") {
//         return "";
//       }

//       const token = await getToken(this.messaging, {
//         vapidKey: this.VAPID_PUBLIC_KEY,
//         serviceWorkerRegistration: registration,
//       });

//       if (token) {
//         console.log("✅ [FCM] Web FCM Token obtained:", token);
//         this.storeToken(token);
//         return token;
//       }
//       return "";
//     } catch (error) {
//       console.error("❌ [FCM] Web token acquisition failed:", error);
//       return "";
//     }
//   }

//   // ==========================================
//   // 📤 TOKEN GETTERS & TEARDOWN
//   // ==========================================

//   getRegistrationToken(): Observable<string> {
//     return this.registrationTokenSubject.asObservable();
//   }

//   getCurrentToken(): string {
//     return this.registrationTokenSubject.value || this.getStoredToken();
//   }

//   async getTokenAsync(): Promise<string> {
//     const existing = this.getCurrentToken();
//     if (existing) return existing;
//     return await this.requestPermissionAndGetToken();
//   }

//   public async deleteToken(): Promise<boolean> {
//     try {
//       if (Capacitor.getPlatform() === "web") {
//         if (this.messaging) {
//           await deleteWebToken(this.messaging);
//           console.log("✅ [FCM] Web Push token deleted from Firebase.");
//         }
//       } else {
//         await PushNotifications.removeAllListeners();
//         this.listenersAttached = false;

//         await PushNotifications.unregister();
//         console.log("✅ [FCM] Native push unregistered.");
//       }
//       return true;
//     } catch (error) {
//       console.error("❌ [FCM] Exception during token cleanup:", error);
//       return false;
//     } finally {
//       this.clearStoredTokens();
//     }
//   }

//   // ==========================================
//   // 🧹 INTERNAL STORAGE HELPERS
//   // ==========================================

//   private storeToken(token: string) {
//     this.registrationTokenSubject.next(token);
//     localStorage.setItem(this.TOKEN_STORAGE_KEY, token);
//   }

//   private getStoredToken(): string {
//     return (
//       localStorage.getItem(this.TOKEN_STORAGE_KEY) ||
//       localStorage.getItem("chms-dms.fcm.mobile.registrationtoken") ||
//       localStorage.getItem("fcm-mobile-token") ||
//       ""
//     );
//   }

//   private clearStoredTokens() {
//     this.registrationTokenSubject.next("");
//     localStorage.removeItem(this.TOKEN_STORAGE_KEY);
//     localStorage.removeItem("chms-dms.fcm.mobile.registrationtoken");
//     localStorage.removeItem("fcm-mobile-token");
//   }
// }





import { Injectable, inject } from "@angular/core";
import { Router } from "@angular/router";
import { Capacitor } from "@capacitor/core";
import {
  ActionPerformed,
  PushNotifications,
  PushNotificationSchema,
  Token,
} from "@capacitor/push-notifications";
import { BehaviorSubject, Observable, firstValueFrom, timeout, catchError, of, filter, take, from } from "rxjs";
import { initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  deleteToken as deleteWebToken,
  onMessage,
  Messaging,
} from "firebase/messaging";
import { Preferences } from "@capacitor/preferences"; // Using Capacitor Preferences
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root",
})
export class FcmService {
  private router = inject(Router);

  private registrationTokenSubject = new BehaviorSubject<string>("");
  private messaging: Messaging | null = null;
  private VAPID_PUBLIC_KEY = environment.vapidKey || "BL7m8QRW2yo_BM_iLGdw7WAiqxBYFG70fQy13h2FpAgY-sg5A0YirSvgp2BL2eUN-vaZxAiQltYPo6GQI7jeTw8";
  
  private readonly NOTIFICATION_PREF_KEY = "user_push_notifications_enabled";
  public readonly TOKEN_STORAGE_KEY = "chms-dms.fcm.registrationtoken";

  constructor() {
    this.hydrateTokenFromStorage();
  }

  private async hydrateTokenFromStorage() {
    const savedToken = await this.getStoredToken();
    if (savedToken) {
      this.registrationTokenSubject.next(savedToken);
    }
  }

  // ==========================================
  // ⚙️ PREFERENCE TOGGLE MANAGEMENT
  // ==========================================

  public async isNotificationEnabled(): Promise<boolean> {
    const pref = await Preferences.get({ key: this.NOTIFICATION_PREF_KEY });
    return pref.value !== null ? JSON.parse(pref.value) : true;
  }

  public async enableNotifications(): Promise<string> {
    await Preferences.set({ key: this.NOTIFICATION_PREF_KEY, value: JSON.stringify(true) });
    return await this.requestPermissionAndGetToken();
  }

  public async disableNotifications(): Promise<boolean> {
    try {
      await Preferences.set({ key: this.NOTIFICATION_PREF_KEY, value: JSON.stringify(false) });
      return await this.deleteToken();
    } catch (error) {
      console.error("❌ [FCM] Failed to disable push notifications:", error);
      return false;
    }
  }

  public async isPushPermissionGranted(): Promise<boolean> {
    if (Capacitor.getPlatform() === "web") {
      return typeof Notification !== "undefined" && Notification.permission === "granted";
    } else {
      const permStatus = await PushNotifications.checkPermissions();
      return permStatus.receive === "granted";
    }
  }

  // ==========================================
  // 🔑 REGISTRATION FLOWS
  // ==========================================

  public async requestPermissionAndGetToken(): Promise<string> {
    const isEnabled = await this.isNotificationEnabled();
    if (!isEnabled) {
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
      let isGranted = await this.isPushPermissionGranted();
      if (!isGranted) {
        const permStatus = await PushNotifications.requestPermissions();
        isGranted = permStatus.receive === "granted";
      }

      if (!isGranted) {
        console.warn("⚠️ [FCM] Native push permission denied.");
        return "";
      }

      await this.createNotificationChannels();
      await this.attachNativeListeners(); // Await listener attachment before registering

      // Prepare an observable to listen for the incoming token from Capacitor
      const tokenPromise$ = this.registrationTokenSubject.pipe(
        filter((token): token is string => !!token && token.trim().length > 0),
        take(1),
        timeout(10000), // Increased timeout to 10s for slow networks
        catchError((err) => {
          console.warn("⚠️ [FCM] Native token registration timed out:", err);
          return from(this.getStoredToken()); // Fallback to storage
        })
      );

      // Clear current state to ensure we get a fresh event
      this.registrationTokenSubject.next("");
      
      // Trigger the native OS registration call. This causes OS to hit APNs/FCM
      await PushNotifications.register();

      const token = await firstValueFrom(tokenPromise$);
      return token || "";
    } catch (error) {
      console.error("❌ [FCM] Native push setup failed:", error);
      return "";
    }
  }

  private async attachNativeListeners() {
    if (Capacitor.getPlatform() === "web") return;

    // Clear existing listeners to prevent duplicate events across hot-reloads or re-logins
    await PushNotifications.removeAllListeners();

    PushNotifications.addListener("registration", (token: Token) => {
      console.log("✅ [FCM] Native registration success:", token.value);
      this.storeToken(token.value);
    });

    PushNotifications.addListener("registrationError", (error: any) => {
      console.error("❌ [FCM] Native registration error:", JSON.stringify(error));
      // Emit an empty string to break the tokenPromise$ timeout loop early if it fails immediately
      this.registrationTokenSubject.next(""); 
    });

    PushNotifications.addListener("pushNotificationReceived", (notification: PushNotificationSchema) => {
      console.log("🔔 [FCM] Foreground push received:", notification);
      // Optional: Dispatch to a local notification service or state store here
    });

    PushNotifications.addListener("pushNotificationActionPerformed", (action: ActionPerformed) => {
      console.log("👆 [FCM] Push tapped:", action);
      const data = action.notification.data;
      const targetPath = data?.path || data?.deepLink;

      if (targetPath) {
        console.log(`🔗 [FCM Directing Navigation] -> ${targetPath}`);
        this.router.navigateByUrl(targetPath);
      }
    });
  }

  public async createNotificationChannels() {
    if (Capacitor.getPlatform() === "android") {
      try {
        await PushNotifications.createChannel({
          id: "health_alerts", name: "Health & Heat Alerts", description: "Urgent notifications", importance: 5, visibility: 1, vibration: true,
        });
        await PushNotifications.createChannel({
          id: "device_alerts", name: "Device & Telemetry Alerts", description: "IoT connection drops", importance: 4, visibility: 1, vibration: true,
        });
        await PushNotifications.createChannel({
          id: "milking_alerts", name: "Milking & Routine Tasks", description: "Scheduled reminders", importance: 3, visibility: 1, vibration: true,
        });
        await PushNotifications.createChannel({
          id: "general_updates", name: "General Farm Updates", description: "Standard updates", importance: 3, vibration: true,
        });
      } catch (err) {
        console.warn("⚠️ [FCM] Could not create notification channels:", err);
      }
    }
  }

  private async handleWebRegistration(): Promise<string> {
    try {
      if (!("serviceWorker" in navigator)) {
        console.warn("⚠️ [FCM] Service workers not supported.");
        return "";
      }

      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

      if (!this.messaging) {
        const app = initializeApp(environment.firebaseConfig);
        this.messaging = getMessaging(app);

        onMessage(this.messaging, (payload) => {
          // You handle background in SW. Foreground handled here.
          console.log("🔔 [FCM] Web Foreground push received:", payload);
        });
      }

      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return "";
      } else if (Notification.permission === "denied") {
        return "";
      }

      const token = await getToken(this.messaging, {
        vapidKey: this.VAPID_PUBLIC_KEY,
        serviceWorkerRegistration: registration,
      });

      if (token) {
        console.log("✅ [FCM] Web FCM Token obtained:", token);
        await this.storeToken(token);
        return token;
      }
      return "";
    } catch (error) {
      console.error("❌ [FCM] Web token acquisition failed:", error);
      return "";
    }
  }

  // ==========================================
  // 📤 TOKEN GETTERS & TEARDOWN
  // ==========================================

  getRegistrationToken(): Observable<string> {
    return this.registrationTokenSubject.asObservable();
  }

  getCurrentToken(): string {
    return this.registrationTokenSubject.value; 
  }

  async getTokenAsync(): Promise<string> {
    const existing = this.getCurrentToken();
    if (existing) return existing;
    return await this.requestPermissionAndGetToken();
  }

  public async deleteToken(): Promise<boolean> {
    try {
      if (Capacitor.getPlatform() === "web") {
        if (this.messaging) {
          await deleteWebToken(this.messaging);
          console.log("✅ [FCM] Web Push token deleted from Firebase.");
        }
      } else {
        await PushNotifications.removeAllListeners();
        // Don't call unregister() - it unregisters the device from APNs entirely.
        // Usually, removing listeners and discarding the token is enough for a "logout".
        console.log("✅ [FCM] Native push listeners detached.");
      }
      return true;
    } catch (error) {
      console.error("❌ [FCM] Exception during token cleanup:", error);
      return false;
    } finally {
      await this.clearStoredTokens();
    }
  }

  // ==========================================
  // 🧹 INTERNAL STORAGE HELPERS
  // ==========================================

  private async storeToken(token: string) {
    this.registrationTokenSubject.next(token);
    await Preferences.set({ key: this.TOKEN_STORAGE_KEY, value: token });
  }

  private async getStoredToken(): Promise<string> {
    const { value } = await Preferences.get({ key: this.TOKEN_STORAGE_KEY });
    if (value) return value;
    
    // Legacy fallback check (can be removed in future versions)
    const legacyValue = localStorage.getItem("chms-dms.fcm.mobile.registrationtoken");
    if (legacyValue) {
      await Preferences.set({ key: this.TOKEN_STORAGE_KEY, value: legacyValue });
      return legacyValue;
    }
    return "";
  }

  private async clearStoredTokens() {
    this.registrationTokenSubject.next("");
    await Preferences.remove({ key: this.TOKEN_STORAGE_KEY });
    localStorage.removeItem("chms-dms.fcm.mobile.registrationtoken");
    localStorage.removeItem("fcm-mobile-token");
  }
}