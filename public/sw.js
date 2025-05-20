self.addEventListener('install', () => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  console.log('Service Worker activating...');
  return self.clients.claim();
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
}); 