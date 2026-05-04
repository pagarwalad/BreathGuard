// BreathGuard Service Worker
const CACHE_NAME = 'breathguard-v3';

// Cache app shell on install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(['./index.html', './manifest.json'])
    ).then(() => self.skipWaiting())
  );
});

// Clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(r => r || fetch(event.request))
  );
});

// Handle notification actions from the main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'APNEA_ALERT') {
    self.registration.showNotification('🚨 BreathGuard Alert', {
      body: event.data.body || 'Apnea detected — no breathing for 10+ seconds!',
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="%23ff4d6a"/><text x="32" y="45" font-size="36" text-anchor="middle">🚨</text></svg>',
      badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="%23ff4d6a"/><text x="32" y="45" font-size="36" text-anchor="middle">🫁</text></svg>',
      vibrate: [500, 150, 500, 150, 500, 300, 200, 100, 200, 100, 200, 300, 500, 150, 500, 150, 500],
      tag: 'apnea-alert',
      renotify: true,
      requireInteraction: true,  // stays visible until user taps
      actions: [
        { action: 'open', title: 'Open BreathGuard' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    });
  }
});

// Handle notification click — open or focus the app
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes('index.html') && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow('./index.html');
    })
  );
});
