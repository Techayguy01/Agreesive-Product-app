self.addEventListener('push', (event) => {
  let payload = {};

  if (event.data) {
    try {
      payload = event.data.json();
    } catch (error) {
      payload = {
        title: 'GRIND CHECK-IN',
        body: event.data.text(),
      };
    }
  }

  const title = payload.title || 'GRIND CHECK-IN';
  const options = {
    body: payload.body || 'LOG YOUR HOUR. No excuses. Account for your time.',
    icon: payload.icon || '/pwa-192x192.png',
    badge: payload.badge || '/pwa-192x192.png',
    tag: payload.tag || 'grind-hourly-check-in',
    renotify: true,
    requireInteraction: true,
    data: {
      url: payload.url || '/',
    },
    actions: [
      {
        action: 'open',
        title: 'Log now',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil((async () => {
    const windowClients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });

    for (const client of windowClients) {
      if (client.url === targetUrl && 'focus' in client) {
        return client.focus();
      }
    }

    if (self.clients.openWindow) {
      return self.clients.openWindow(targetUrl);
    }
  })());
});
