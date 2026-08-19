// import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
// import { CommonModule, DatePipe } from '@angular/common';
// import { Router } from '@angular/router';
// import {
//   IonHeader,
//   IonToolbar,
//   IonTitle,
//   IonButtons,
//   IonButton,
//   IonIcon,
//   IonContent,
//   IonRefresher,
//   IonRefresherContent,
//   IonSpinner,
//   IonText,
//   IonList,
//   IonItemSliding,
//   IonItem,
//   IonLabel,
//   IonNote,
//   IonBadge,
//   IonItemOptions,
//   IonItemOption,
//   IonInfiniteScroll,
//   IonInfiniteScrollContent,
//   ToastController, IonSearchbar, IonBackButton, IonProgressBar } from '@ionic/angular/standalone';
// import { addIcons } from 'ionicons';
// import {
//   checkmarkDoneOutline,
//   notificationsOutline,
//   informationCircleOutline,
//   alertCircleOutline,
//   checkmarkCircleOutline,
//   mailUnreadOutline,
// } from 'ionicons/icons';

// import { NotificationService, NotificationItem } from '../../services/notification/notification.service';
// import { CustomHeaderComponent } from 'src/app/components/custom-header/custom-header.component';

// @Component({
//   selector: 'app-notification',
//   templateUrl: './notification.page.html',
//   styleUrls: ['./notification.page.scss'],
//   standalone: true,
//   imports: [IonProgressBar, IonBackButton, IonSearchbar, 
//     CommonModule,
//     DatePipe,
//     IonHeader,
//     IonToolbar,
//     IonTitle,
//     IonButtons,
//     IonButton,
//     IonIcon,
//     IonContent,
//     IonRefresher,
//     IonRefresherContent,
//     IonSpinner,
//     IonText,
//     IonList,
//     IonItemSliding,
//     IonItem,
//     IonLabel,
//     IonNote,
//     IonBadge,
//     IonItemOptions,
//     IonItemOption,
//     IonInfiniteScroll,
//     IonInfiniteScrollContent,
//     CustomHeaderComponent
//   ],
// })
// export class NotificationPage implements OnInit {
//   private readonly notificationService = inject(NotificationService);
//   private readonly router = inject(Router);
//   private readonly toastCtrl = inject(ToastController);
//   private readonly cdr = inject(ChangeDetectorRef);

//   public notifications: NotificationItem[] = [];
//   public unreadCount = 0;
//   public totalCount = 0;
//   public isLoading = false;

//   // Pagination state
//   public limit = 15;
//   public offset = 0;

//   constructor() {
//     // Register custom Ionic icons used in the view
//     addIcons({
//       checkmarkDoneOutline,
//       notificationsOutline,
//       informationCircleOutline,
//       alertCircleOutline,
//       checkmarkCircleOutline,
//       mailUnreadOutline,
//     });
//   }

//   ngOnInit(): void {
//     this.fetchNotifications();
//   }

//   fetchNotifications(event?: any, isRefresh = false): void {
//     if (!event && !isRefresh) {
//       this.isLoading = true;
//     }

//     // 🔴 ADD THIS DECLARATION BEFORE THE SERVICE CALL
//   const options = {
//     limit: this.limit,
//     offset: this.offset,
//   };

//     this.notificationService.getNotificationList({}, options).subscribe({
//       next: (res) => {
//         if (isRefresh) {
//           this.notifications = res.items;
//         } else {
//           this.notifications = [...this.notifications, ...res.items];
//         }

//         this.unreadCount = res.unreadCount;
//         this.totalCount = res.totalCount;

//         // Ensure loader is disabled
//         this.isLoading = false;
//         this.completeAsyncOperation(event);

//         // Force change detection cycle
//         this.cdr.markForCheck();
//       },
//       error: (err) => {
//         this.isLoading = false;
//         this.completeAsyncOperation(event);
//         this.cdr.markForCheck();
//       }
//     });
//   }

//   /**
//    * Pull to Refresh Handler
//    */
//   refreshList(event: any): void {
//     this.offset = 0;
//     this.fetchNotifications(event, true);
//   }

//   loadMore(event: any): void {
//   // If no items or reached the total count, complete and disable immediately
//   if (this.notifications.length >= this.totalCount || this.totalCount === 0) {
//     event.target.complete();
//     event.target.disabled = true;
//     return;
//   }

//   this.offset += this.limit;
//   this.fetchNotifications(event, false);
// }

//   /**
//    * Handles clicking an item (marks read + executes deepLink if present)
//    */
//   onNotificationClick(item: NotificationItem): void {
//     if (!item.isRead) {
//       this.markAsRead(item);
//     }

//     if (item.deepLink) {
//       this.router.navigateByUrl(item.deepLink);
//     }
//   }

//   /**
//    * Marks a single notification as read
//    */
//   markAsRead(item: NotificationItem): void {
//     if (item.isRead) return;

//     this.notificationService.markAsRead(item.id).subscribe({
//       next: (success) => {
//         if (success) {
//           item.isRead = true;
//           this.unreadCount = Math.max(0, this.unreadCount - 1);
//         }
//       },
//       error: (err) => console.error('Error marking as read:', err),
//     });
//   }

//   /**
//    * Marks all notifications as read in bulk
//    */
//   markAllAsRead(): void {
//     this.notificationService.markAllAsRead().subscribe({
//       next: (success) => {
//         if (success) {
//           this.notifications.forEach((n) => (n.isRead = true));
//           this.unreadCount = 0;
//           this.showToast('All notifications marked as read');
//         }
//       },
//       error: (err) => {
//         console.error('Error marking all as read:', err);
//         this.showToast('Failed to update notifications');
//       },
//     });
//   }

//   /**
//    * Dynamically resolves icon based on notification type string
//    */
//   getTypeIcon(type: string): string {
//     switch (type?.toUpperCase()) {
//       case 'ALERT':
//       case 'WARNING':
//         return 'alert-circle-outline';
//       case 'SUCCESS':
//         return 'checkmark-circle-outline';
//       case 'INFO':
//         return 'information-circle-outline';
//       default:
//         return 'mail-unread-outline';
//     }
//   }

//   // private completeAsyncOperation(event?: any): void {
//   //   if (event && event.target) {
//   //     event.target.complete();
//   //   }
//   // }

//   private completeAsyncOperation(event?: any): void {
//   if (event?.target?.complete) {
//     event.target.complete();
//   }
// }

//   private async showToast(message: string): Promise<void> {
//     const toast = await this.toastCtrl.create({
//       message,
//       duration: 2000,
//       position: 'bottom',
//     });
//     await toast.present();
//   }
// }


import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonText,
  IonList,
  IonItemSliding,
  IonItem,
  IonLabel,
  IonNote,
  IonBadge,
  IonItemOptions,
  IonItemOption,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonModal,
  ToastController, IonSearchbar, IonBackButton, IonProgressBar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkDoneOutline,
  notificationsOutline,
  informationCircleOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  mailUnreadOutline,
  closeOutline,
  arrowForwardOutline
} from 'ionicons/icons';

import { NotificationService, NotificationItem } from '../../services/notification/notification.service';
import { CustomHeaderComponent } from 'src/app/components/custom-header/custom-header.component';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.page.html',
  styleUrls: ['./notification.page.scss'],
  standalone: true,
  imports: [
    IonProgressBar, IonBackButton, IonSearchbar, 
    CommonModule,
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    IonText,
    IonList,
    IonItemSliding,
    IonItem,
    IonLabel,
    IonNote,
    IonBadge,
    IonItemOptions,
    IonItemOption,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonModal,
    CustomHeaderComponent
  ],
})
export class NotificationPage implements OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly toastCtrl = inject(ToastController);
  private readonly cdr = inject(ChangeDetectorRef);

  public notifications: NotificationItem[] = [];
  public unreadCount = 0;
  public totalCount = 0;
  public isLoading = false;

  // Modal State
  public isModalOpen = false;
  public selectedNotification: NotificationItem | null = null;

  // Pagination state
  public limit = 15;
  public offset = 0;

  constructor() {
    addIcons({
      checkmarkDoneOutline,
      notificationsOutline,
      informationCircleOutline,
      alertCircleOutline,
      checkmarkCircleOutline,
      mailUnreadOutline,
      closeOutline,
      arrowForwardOutline
    });
  }

  ngOnInit(): void {
    this.fetchNotifications();
  }

  /**
   * Opens Modal & marks item as read
   */
  openDetailModal(item: NotificationItem): void {
    this.selectedNotification = item;
    this.isModalOpen = true;

    if (!item.isRead) {
      this.markAsRead(item);
    }
  }

  closeDetailModal(): void {
    this.isModalOpen = false;
    this.selectedNotification = null;
  }

  navigateToLink(deepLink: string): void {
    this.closeDetailModal();
    if (deepLink) {
      this.router.navigateByUrl(deepLink);
    }
  }

  fetchNotifications(event?: any, isRefresh = false): void {
    if (!event && !isRefresh) {
      this.isLoading = true;
    }

    const options = {
      limit: this.limit,
      offset: this.offset,
    };

    this.notificationService.getNotificationList({}, options).subscribe({
      next: (res) => {
        if (isRefresh) {
          this.notifications = res.items;
        } else {
          this.notifications = [...this.notifications, ...res.items];
        }

        this.unreadCount = res.unreadCount;
        this.totalCount = res.totalCount;

        this.isLoading = false;
        this.completeAsyncOperation(event);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.completeAsyncOperation(event);
        this.cdr.markForCheck();
      }
    });
  }

  refreshList(event: any): void {
    this.offset = 0;
    this.fetchNotifications(event, true);
  }

  loadMore(event: any): void {
    if (this.notifications.length >= this.totalCount || this.totalCount === 0) {
      event.target.complete();
      event.target.disabled = true;
      return;
    }

    this.offset += this.limit;
    this.fetchNotifications(event, false);
  }

  markAsRead(item: NotificationItem): void {
    if (item.isRead) return;

    this.notificationService.markAsRead(item.id).subscribe({
      next: (success) => {
        if (success) {
          item.isRead = true;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
          this.cdr.markForCheck();
        }
      },
      error: (err) => console.error('Error marking as read:', err),
    });
  }

  // markAllAsRead(): void {
  //   this.notificationService.markAllAsRead().subscribe({
  //     next: (success) => {
  //       if (success) {
  //         this.notifications.forEach((n) => (n.isRead = true));
  //         this.unreadCount = 0;
  //         this.showToast('All notifications marked as read');
  //         this.cdr.markForCheck();

  //          this.offset = 0;
  //   this.fetchNotifications(event, true);

  //       }
  //     },
  //     error: (err) => {
  //       console.error('Error marking all as read:', err);
  //       this.showToast('Failed to update notifications');
  //     },
  //   });
  // }


  markAllAsRead(): void {
  this.notificationService.markAllAsRead().subscribe({
    next: (success) => {
      if (success) {
        // Create new object references instead of mutating frozen ones
        this.notifications = this.notifications.map((n) => ({
          ...n,
          isRead: true,
        }));

        this.unreadCount = 0;
        this.showToast('All notifications marked as read');
        this.cdr.markForCheck();

        this.offset = 0;
        this.fetchNotifications(undefined, true); // Pass undefined or valid event if fetchNotifications expects one
      }
    },
    error: (err) => {
      console.error('Error marking all as read:', err);
      this.showToast('Failed to update notifications');
    },
  });
}

  getTypeIcon(type: string): string {
    switch (type?.toUpperCase()) {
      case 'ALERT':
      case 'WARNING':
        return 'alert-circle-outline';
      case 'SUCCESS':
        return 'checkmark-circle-outline';
      case 'INFO':
        return 'information-circle-outline';
      default:
        return 'mail-unread-outline';
    }
  }

  private completeAsyncOperation(event?: any): void {
    if (event?.target?.complete) {
      event.target.complete();
    }
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom',
    });
    await toast.present();
  }
}