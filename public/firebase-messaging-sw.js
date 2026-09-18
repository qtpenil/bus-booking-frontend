importScripts(
  'https://www.gstatic.com/firebasejs/12.2.1/firebase-app-compat.js'
);

importScripts(
  'https://www.gstatic.com/firebasejs/12.2.1/firebase-messaging-compat.js'
);

// Service Worker Lifecycle Handling
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker installing, calling skipWaiting()');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activating, calling clients.claim()');
  event.waitUntil(clients.claim());
});

firebase.initializeApp({
  apiKey: "AIzaSyBWxDddCrvr6qDS_r0EHnNDrmWX1Gj6lwk",
  authDomain: "bus-booking-system-cdf64.firebaseapp.com",
  projectId: "bus-booking-system-cdf64",
  storageBucket: "bus-booking-system-cdf64.firebasestorage.app",
  messagingSenderId: "551651400064",
  appId: "1:551651400064:web:2c26bb23fa0c1331234965"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    '[firebase-messaging-sw.js] Received background message:',
    payload
  );

  const notificationTitle =
    payload.notification?.title || payload.data?.title || 'Bus Booking';

  const rawClickAction =
    payload.data?.clickActionUrl ||
    payload.data?.click_action ||
    payload.fcmOptions?.link ||
    '/my-bookings';

  const clickAction = new URL(rawClickAction, self.location.origin).href;

  const notificationOptions = {
    body:
      payload.notification?.body || payload.data?.body ||
      'You have a new notification.',
    icon: '/favicon.ico',
    data: {
      clickActionUrl: clickAction
    }
  };

  self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log(
    '[firebase-messaging-sw.js] Notification clicked:',
    event.notification
  );

  event.notification.close();

  const rawUrl =
    event.notification.data?.clickActionUrl ||
    '/my-bookings';

  const targetUrl = new URL(rawUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {

      // If an Angular tab is already open, focus it and navigate to target URL
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus().then(() => {
            if ('navigate' in client) {
              return client.navigate(targetUrl);
            }
          });
        }
      }

      // Otherwise open a new browser tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});