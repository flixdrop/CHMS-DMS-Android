// importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
// importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// // Initialize the Firebase app in the service worker
// firebase.initializeApp({
//   apiKey: "AIzaSyDqHSFbWN-YL7FmPepnyuIcbBbWo7Z7r7k",
//   authDomain: "flixdropchms.firebaseapp.com",
//   databaseURL: "https://flixdropchms-default-rtdb.asia-southeast1.firebasedatabase.app",
//   projectId: "flixdropchms",
//   storageBucket: "flixdropchms.firebasestorage.app",
//   messagingSenderId: "549813245391",
//   appId: "1:549813245391:web:04ad370f70ccbb396e6eba",
//   measurementId: "G-LLH8C1Q5KJ"
// });

// const messaging = firebase.messaging();

// // 1. Handle background data payload processing
// messaging.onBackgroundMessage((payload) => {
//   console.log('[firebase-messaging-sw.js] Received background message', payload);

//   // Guard: If payload.notification exists, Firebase's SDK handles it automatically.
//   // We only manually show the notification if the backend sent a "data-only" push.
//   if (!payload.notification) {
//     const notificationTitle = payload.data?.title || 'CHMS Alert';
//     const notificationOptions = {
//       body: payload.data?.body || 'You have a new update.',
//       icon: '/assets/icons/fd.png',
//       badge: '/assets/icons/favicon.png',
//       data: payload.data // Pass the data payload so the click handler can read it
//     };

//     self.registration.showNotification(notificationTitle, notificationOptions);
//   }
// });

// // 2. Web Push Click Handler: Focus tab or open app
// self.addEventListener('notificationclick', (event) => {
//   console.log('[firebase-messaging-sw.js] Notification click received.', event);
  
//   // Close the notification immediately upon click
//   event.notification.close();

//   // Extract navigation route if your backend provided one (e.g., '/animals/123')
//   const targetPath = event.notification.data?.path || event.notification.data?.url || '/';
//   const targetUrl = new URL(targetPath, self.location.origin).href;

//   event.waitUntil(
//     clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
//       // Check if there is already a window/tab open with the app
//       for (const client of windowClients) {
//         if (client.url === targetUrl && 'focus' in client) {
//           return client.focus();
//         }
//         if ('focus' in client && 'navigate' in client) {
//           client.focus();
//           return client.navigate(targetUrl);
//         }
//       }
      
//       // If no window is open, open a new one
//       if (clients.openWindow) {
//         return clients.openWindow(targetUrl);
//       }
//     })
//   );
// });



importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyDqHSFbWN-YL7FmPepnyuIcbBbWo7Z7r7k",
  authDomain: "flixdropchms.firebaseapp.com",
  databaseURL: "https://flixdropchms-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "flixdropchms",
  storageBucket: "flixdropchms.firebasestorage.app",
  messagingSenderId: "549813245391",
  appId: "1:549813245391:web:04ad370f70ccbb396e6eba",
  measurementId: "G-LLH8C1Q5KJ"
});

const messaging = firebase.messaging();

// 1. Handle background data payload processing
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message', payload);

  // Guard: If payload.notification exists, Firebase's Web SDK handles displaying it natively.
  // We manually show notifications ONLY for "data-only" pushes to avoid duplicate banners.
  if (!payload.notification) {
    const notificationTitle = payload.data?.title || 'CHMS Alert';
    const notificationOptions = {
      body: payload.data?.body || 'You have a new update.',
      icon: '/assets/icons/fd.png',
      badge: '/assets/icons/favicon.png',
      // Pass large banner image if sent from Node.js backend payload
      image: payload.data?.image || undefined,
      // Retain data payload so the click handler can navigate to the route
      data: payload.data,
      // Require interaction for critical health alerts so the banner doesn't auto-dismiss
      requireInteraction: payload.data?.type === 'HEALTH' || payload.data?.type === 'HEAT',
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  }
});

// 2. Web Push Click Handler: Focus existing tab or open new window
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.', event);
  
  // Close the notification immediately upon click
  event.notification.close();

  // Extract navigation route provided by backend (e.g., '/animals/123')
  const targetPath = event.notification.data?.path || event.notification.data?.url || '/';
  const targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. If a matching tab is already open on this exact URL, focus it
      for (const client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          // Notify the active Angular app via message channel about the click event
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            payload: event.notification.data,
          });
          return client.focus();
        }
      }

      // 2. If an app tab is open on a DIFFERENT page, focus it and navigate to target URL
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client && 'navigate' in client) {
          client.focus();
          return client.navigate(targetUrl);
        }
      }
      
      // 3. If no window is open, open a new browser window/tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});