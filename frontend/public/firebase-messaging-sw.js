importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCWwLBxLh9AKUMXSD8ggNmMnJ37BAwCquk",
  authDomain: "tournament-a877c.firebaseapp.com",
  projectId: "tournament-a877c",
  storageBucket: "tournament-a877c.firebasestorage.app",
  messagingSenderId: "585409221109",
  appId: "1:585409221109:web:7c77fc5283238f439550bc"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const title = payload.notification?.title || 'Tournament Guru 🏆';
  const body = payload.notification?.body || '';

  self.registration.showNotification(title, {
    body,
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    vibrate: [300, 100, 300],
    requireInteraction: true,
    tag: 'tg-notification-' + Date.now(),
    data: { url: payload.data?.url || '/' }
  });
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
