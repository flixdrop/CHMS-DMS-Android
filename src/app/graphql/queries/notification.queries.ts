import { gql } from 'apollo-angular';

export const GET_NOTIFICATION_LIST = gql`
  query GetNotificationList($filter: NotificationFilterInput, $options: QueryOptionsInput) {
    getNotificationList(filter: $filter, options: $options) {
      totalCount
      unreadCount
      items {
        id
        title
        body
        type
        isRead
        deepLink
        createdAt
      }
    }
  }
`;

export const MARK_NOTIFICATION_AS_READ = gql`
  mutation MarkNotificationAsRead($id: ID!) {
    markNotificationAsRead(id: $id) {
      id
      isRead
      readAt
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_AS_READ = gql`
  mutation MarkAllNotificationsAsRead {
    markAllNotificationsAsRead
  }
`;