import { Component, computed, inject, OnInit } from '@angular/core';
import { IonContent, IonLabel, IonToolbar, IonButtons, IonBackButton, IonTitle, IonSpinner, IonGrid, IonRow, IonCol, IonIcon, IonList, IonItem, IonButton, IonProgressBar, IonHeader, NavController, IonChip, IonNote, IonFooter, LoadingController, IonThumbnail, IonInput, IonCheckbox, ModalController, IonItemGroup, IonItemDivider, IonToggle } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgxPaginationModule } from 'ngx-pagination';
import { first } from 'rxjs';
import { AuthService } from 'src/app/services/auth/auth.service';
import { DataService } from 'src/app/services/user/user.service';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { UserModalComponent } from './user-modal/user-modal.component';
import { FcmService } from 'src/app/services/fcm/fcm.service';

@Component({
  standalone: true,
  imports: [IonToggle, IonItemDivider, IonItemGroup, IonCheckbox, IonInput,
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    NgxPaginationModule,
    IonContent,
    IonLabel,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonSpinner,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    IonList,
    IonItem,
    IonButton,
    IonProgressBar,
    IonHeader,
    IonChip,
    IonNote,
    IonFooter,
    IonThumbnail
  ],
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  private modalCtrl = inject(ModalController);

  isLoading: boolean = false;
  user: any = {};

  notificationsEnabled: boolean = true;
  isUpdatingToggle: boolean = false;

  private isProcessingToggle: boolean = false;

  public readonly safeLogo = computed(() => {
    const logoUrl = this.user?.logo;
    return logoUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(logoUrl) : null;
  });

  constructor(
    private authService: AuthService,
    private dataService: DataService,
    private navCtrl: NavController,
    private loadingCtrl: LoadingController,
    private sanitizer: DomSanitizer,
    private fcmService: FcmService,
  ) { }

  ngOnInit() {
    this.authService.authenticatedUser$.pipe(
      first(user => !!user)
    ).subscribe(user => {
      console.log('User : ', user);
      this.user = user;
    });

    this.notificationsEnabled = this.fcmService.isNotificationEnabled();
  }

  goBack() {
    this.navCtrl.navigateBack('/home');
  }

  async onToggleChange(event: CustomEvent) {
  const isChecked = event.detail.checked;

  // 1. Skip if state hasn't actually changed or an operation is already running
  if (isChecked === this.notificationsEnabled || this.isProcessingToggle) {
    return;
  }

  this.isProcessingToggle = true;

  try {
    if (isChecked) {
      // 🟢 ENABLE NOTIFICATIONS
      const token = await this.fcmService.enableNotifications();

      if (token) {
        await this.authService.updateDeviceToken(token);
        this.notificationsEnabled = true;
      } else {
        // Permission was denied -> Revert toggle state back safely
        this.notificationsEnabled = false;
        event.detail.checked = false; // Sync UI
      }
    } else {
      // 🔴 DISABLE NOTIFICATIONS
      const existingToken = this.fcmService.getCurrentToken();

      if (existingToken) {
        await this.authService.removeDeviceToken(existingToken);
      }

      await this.fcmService.disableNotifications();
      this.notificationsEnabled = false;
    }
  } catch (error) {
    console.error('Error toggling push notifications:', error);
    // Revert UI in case of unhandled rejection
    this.notificationsEnabled = !isChecked;
    event.detail.checked = !isChecked;
  } finally {
    this.isProcessingToggle = false;
  }
}

  async togglePushNotifications(event: any) {
    const isChecked = event.detail.checked;
    this.isUpdatingToggle = true;

    if (isChecked) {
      // 🟢 ENABLE NOTIFICATIONS
      const token = await this.fcmService.enableNotifications();

      if (token) {
        // Sync token to GraphQL backend
        await this.authService.updateDeviceToken(token);
      } else {
        // Permission was denied -> revert toggle state
        this.notificationsEnabled = false;
      }
    } else {
      // 🔴 DISABLE NOTIFICATIONS
      const existingToken = this.fcmService.getCurrentToken();

      // Tell backend to remove token first
      if (existingToken) {
        await this.authService.removeDeviceToken(existingToken);
      }

      // Clear local FCM tokens and disable listeners
      await this.fcmService.disableNotifications();
    }

    this.isUpdatingToggle = false;
  }

  async onClickLogout(): Promise<void> {
    try {
      // Fetch device token safely if your fcm implementation supports it, otherwise fallback
      const deviceToken = localStorage.getItem('device_push_token') || 'web_browser_session';
      console.log('[UI] Initiating comprehensive application teardown sequence...');
      await this.authService.logout(deviceToken);
    } catch (error) {
      console.error('[UI] Critical intercept during logout lifecycle execution:', error);
      await this.authService.performClientSideLogout();
    }
  }


  async openUserModal(type: string, user?: any) {
    const modal = await this.modalCtrl.create({
      component: UserModalComponent,
      componentProps: {
        type: type,
        user: user
      }
    });

    await modal.present();

    const { data, role } = await modal.onDidDismiss();

    if (role === 'confirm' && data?.updated) {
      console.log('Received updated data from modal:', data);
      // this.refresh(); // Now triggers refresh perfectly!

      this.authService.authenticatedUser$.pipe(
        first(user => !!user)
      ).subscribe(user => {
        console.log('User : ', user);
        this.user = user;
      });

    }
  }

}
