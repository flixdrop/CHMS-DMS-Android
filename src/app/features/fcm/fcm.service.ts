import { Injectable } from "@angular/core";
import { Capacitor } from "@capacitor/core";
import {
  ActionPerformed,
  PushNotifications,
  PushNotificationSchema,
  Token,
} from "@capacitor/push-notifications";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class FcmService {
  private registrationTokenSubject: BehaviorSubject<string> =
    new BehaviorSubject<string>("");

  constructor() {}

  initPush() {
    if (Capacitor.getPlatform() !== "web") {
      console.log('Running in a mobile device.');

      // this.createNotificationChannels();

      this.registerPush();
    }
  }

  async createNotificationChannels() {
  // Check if we are on Android (Channels are Android-specific)
  if (Capacitor.getPlatform() !== 'web') {
    
    // 1. Create a High Priority Channel for Alerts
    await PushNotifications.createChannel({
      id: 'health_alerts',
      name: 'Health & Heat Alerts',
      description: 'Urgent notifications regarding animal health and heat events',
      importance: 5, // 5 = Urgent (makes sound and pops up)
      visibility: 1, // 1 = Public (shows on lock screen)
      sound: 'beep.wav', // Match the sound in your capacitor config
      vibration: true,
    });

    // 2. Create a Default Channel for General Updates
    await PushNotifications.createChannel({
      id: 'general_updates',
      name: 'General Farm Updates',
      description: 'Standard updates for milk entries and tasks',
      importance: 3, // 3 = Default (makes sound but doesn't pop up over apps)
      vibration: true,
    });
    
    console.log('Notification channels created!');
  }
}

  private registerPush() {
    console.log('Executing register push.');
    PushNotifications.requestPermissions().then((result) => {
      if (result.receive === "granted") {
        console.log('Access was granted by user.');
        // Register with Apple / Google to receive push via APNS/FCM
        PushNotifications.register();
      } else {
        // Show some error
      }
    });

    // On success, we should be able to receive notifications
    PushNotifications.addListener("registration", (token: Token) => {
      console.log("Push registration success, token: " + token.value);
      this.registrationTokenSubject.next(token.value);
    });

    // Some issue with our setup and push will not work
    PushNotifications.addListener("registrationError", (error: any) => {
      console.log("Error on registration: " + JSON.stringify(error));
    });

    // Show us the notification payload if the app is open on our device
    PushNotifications.addListener(
      "pushNotificationReceived",
      (notification: PushNotificationSchema) => {
        console.log("Push Received :" + JSON.stringify(notification));
      },
    );

    // Method called when tapping on a notification
    PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (notification: ActionPerformed) => {
        console.log("Action Performed : ", notification);

        // if(notification) {
        //     this.modalControl
        //       .create({
        //         component: HealthsComponent,
        //       })
        //       .then((modalEl) => {
        //         modalEl.present();
        //       });
        //   }

        // else if(notification){
        //    this.modalControl
        //         .create({
        //           component: HeatsComponent,
        //           // cssClass: "card-modal",
        //           // enterAnimation: this.enterAnimation,
        //           // leaveAnimation: this.leaveAnimation,
        //         })
        //         .then((modalEl) => {
        //           modalEl.present();
        //         });
        // }
      },
    );
  }

  // Expose a method to subscribe to the registration token
  getRegistrationToken(): Observable<string> {
    return this.registrationTokenSubject.asObservable();
  }
}
