// importScripts('https://www.gstatic.com/firebasejs/10.12.1/firebase-app-compat.js');
// importScripts('https://www.gstatic.com/firebasejs/10.12.1/firebase-messaging-compat.js');

// // Initialize the Firebase app in the service worker
// // Replace these with your actual config object fields
// firebase.initializeApp({
//   apiKey: "AIzaSyDqHSFbWN-YL7FmPepnyuIcbBbWo7Z7r7k",
//   authDomain: "flixdropchms.firebaseapp.com",
//   databaseURL: "https://flixdropchms-default-rtdb.asia-southeast1.firebasedatabase.app",
//   projectId: "flixdropchms",
//   storageBucket: "flixdropchms.firebasestorage.app",
//   messagingSenderId: "549813245391",
//   appId: "1:549813245391:web:04ad370f70ccbb396e6eba",
//   measurementId: "G-LLH8C1Q5KJ"
// },);

// const messaging = firebase.messaging();

// // Handle background notifications
// messaging.onBackgroundMessage((payload) => {
//   console.log('[firebase-messaging-sw.js] Received background message ', payload);

//   const notificationTitle = payload.notification.title || 'CHMS Alert';
//   const notificationOptions = {
//     body: payload.notification.body,
//     icon: '/assets/icons/app-icon.png', // Ensure this file exists
//     badge: '/assets/icons/badge-icon.png',
//     data: payload.data
//   };

//   self.registration.showNotification(notificationTitle, notificationOptions);
// });


// Upgrade CDN version from 10.12.1 -> 12.12.1 (matching your package.json)
// importScripts('https://www.gstatic.com/firebasejs/12.12.1/firebase-app-compat.js');
// importScripts('https://www.gstatic.com/firebasejs/12.12.1/firebase-messaging-compat.js');

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

  // Guard: If payload.notification exists, Firebase's SDK handles it automatically.
  // We only manually show the notification if the backend sent a "data-only" push.
  if (!payload.notification) {
    const notificationTitle = payload.data?.title || 'CHMS Alert';
    const notificationOptions = {
      body: payload.data?.body || 'You have a new update.',
      icon: '/assets/icons/fd.png',
      badge: '/assets/icons/favicon.png',
      data: payload.data // Pass the data payload so the click handler can read it
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  }
});

// 2. Web Push Click Handler: Focus tab or open app
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.', event);
  
  // Close the notification immediately upon click
  event.notification.close();

  // Extract navigation route if your backend provided one (e.g., '/animals/123')
  const targetPath = event.notification.data?.path || event.notification.data?.url || '/';
  const targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the app
      for (const client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
        if ('focus' in client && 'navigate' in client) {
          client.focus();
          return client.navigate(targetUrl);
        }
      }
      
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});