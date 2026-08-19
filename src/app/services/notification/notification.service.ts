// import { Injectable, inject } from '@angular/core';
// import { Apollo } from 'apollo-angular';
// import { Observable, map } from 'rxjs';
// import {
//   GET_NOTIFICATION_LIST,
//   MARK_NOTIFICATION_AS_READ,
//   MARK_ALL_NOTIFICATIONS_AS_READ,
// } from '../../graphql/queries/notification.queries';

// export interface NotificationItem {
//   id: string;
//   title: string;
//   body: string;
//   type: string;
//   isRead: boolean;
//   deepLink?: string;
//   createdAt: string;
// }

// export interface NotificationResponse {
//   totalCount: number;
//   unreadCount: number;
//   items: NotificationItem[];
// }

// @Injectable({
//   providedIn: 'root',
// })
// export class NotificationService {
//   private apollo = inject(Apollo);

//   /**
//    * Fetch paginated list of notifications
//    */
//   getNotifications(
//     filter: any = {},
//     options: { limit: number; offset: number }
//   ): Observable<NotificationResponse> {
//     return this.apollo
//       .watchQuery<{ getNotificationList: NotificationResponse }>({
//         query: GET_NOTIFICATION_LIST,
//         variables: { filter, options },
//         fetchPolicy: 'network-only',
//         errorPolicy: 'all',
//       })
//       .valueChanges.pipe(
//         map((result) => result.data.getNotificationList as NotificationResponse)
//       );
//   }

//   /**
//    * Mark single notification as read
//    */
//   markAsRead(id: string): Observable<boolean> {
//     return this.apollo
//       .mutate({
//         mutation: MARK_NOTIFICATION_AS_READ,
//         variables: { id },
//       })
//       .pipe(map((res) => !!res.data));
//   }

//   /**
//    * Mark all as read
//    */
//   markAllAsRead(): Observable<boolean> {
//     return this.apollo
//       .mutate<{ markAllNotificationsAsRead: boolean }>({
//         mutation: MARK_ALL_NOTIFICATIONS_AS_READ,
//       })
//       .pipe(map((res) => res.data?.markAllNotificationsAsRead ?? false));
//   }
// }


import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Direct named imports to avoid barrel / circular import issues
import {
  GET_NOTIFICATION_LIST,
  MARK_NOTIFICATION_AS_READ,
  MARK_ALL_NOTIFICATIONS_AS_READ,
} from '../../graphql/queries/notification.queries';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  deepLink?: string;
  createdAt: string;
}

export interface NotificationListResponse {
  totalCount: number;
  unreadCount: number;
  items: NotificationItem[];
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly apollo = inject(Apollo);

  getNotificationList(
    filter?: Record<string, any>,
    options?: Record<string, any>
  ): Observable<NotificationListResponse> {
    return this.apollo
      .query<any>({
        query: GET_NOTIFICATION_LIST,
        variables: { filter, options },
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((result) => {
          // Optional chaining prevents reading properties of undefined
          const data = result?.data?.getNotificationList;

          if (!data) {
            return { totalCount: 0, unreadCount: 0, items: [] };
          }

          return {
            totalCount: data.totalCount ?? 0,
            unreadCount: data.unreadCount ?? 0,
            items: data.items ?? [],
          };
        })
      );
  }

  markAsRead(id: string): Observable<boolean> {
    return this.apollo
      .mutate<any>({
        mutation: MARK_NOTIFICATION_AS_READ,
        variables: { id },
      })
      .pipe(
        map((result) => !!result?.data?.markNotificationAsRead?.isRead)
      );
  }

  markAllAsRead(): Observable<boolean> {
    return this.apollo
      .mutate<any>({
        mutation: MARK_ALL_NOTIFICATIONS_AS_READ,
      })
      .pipe(
        map((result) => !!result?.data?.markAllNotificationsAsRead)
      );
  }
}