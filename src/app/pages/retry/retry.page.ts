import { Component, OnInit } from "@angular/core";
import { Network } from "@capacitor/network";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { IonContent, IonToolbar, IonItem, IonLabel, IonIcon, IonNote, IonButtons, IonButton, LoadingController } from "@ionic/angular/standalone";

@Component({
  standalone: true,
  imports: [CommonModule, IonContent, IonToolbar, IonItem, IonLabel, IonIcon, IonNote, IonButtons, IonButton],
  selector: "app-retry",
  templateUrl: "./retry.page.html",
  styleUrls: ["./retry.page.scss"],
})
export class RetryPage implements OnInit {
  networkStatus: any;

  constructor(private loadingCtrl: LoadingController, private router: Router) {}

  ngOnInit() {}

  ionViewWillEnter() {
    this.initializeApp();
  }

  initializeApp() {
    StatusBar.setOverlaysWebView({ overlay: false });
    StatusBar.setBackgroundColor({ color: "#ffffff" }).catch((error) =>
      console.log("Set Status Bar in Retry Page"),
    );
    StatusBar.setStyle({ style: Style.Light }).catch((error) =>
      console.log("Set Status Bar in Retry Page"),
    );
  }

  logCurrentNetworkStatus = async () => {
    const status = await Network.getStatus();
    this.networkStatus = status;
  };

  retryConnecting() {
    this.loadingCtrl
      .create({
        translucent: true,
        animated: true,
        message: "Re-trying to Connect ..",
        duration: 5000,
      })
      .then((loadingEl) => {
        loadingEl.present();
        this.logCurrentNetworkStatus();

        console.log(
          "Network Status at Retry Page: ",
          this.networkStatus["connected"],
        );

        if (!this.networkStatus["connected"]) {
          loadingEl.dismiss();
        } else if (this.networkStatus["connected"] === false) {
          loadingEl.dismiss();
        } else if (this.networkStatus["connected"] === true) {
          this.router.navigateByUrl("/");
        }
        loadingEl.dismiss();
      });
    this.loadingCtrl.dismiss();
  }
}
