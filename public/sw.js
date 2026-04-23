// DNexus minimal notification-only service worker.
// No caching is performed here — Lovable previews must always serve fresh
// assets. This SW exists solely to allow `Notification.showNotification()`
// from background contexts (PWA installed, screen off, app backgrounded).

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Forward push events (server-pushed) → notification.
self.addEventListener("push", (event) => {
  let data = { title: "DNexus", body: "Trading update", icon: "/icon-192.png" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || "/icon-192.png",
      badge: "/icon-192.png",
      vibrate: [100],
    })
  );
});

// Focus or open the app when a notification is clicked.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const target = allClients.find((c) => c.url.includes("/trading")) || allClients[0];
      if (target) {
        await target.focus();
      } else {
        await self.clients.openWindow("/trading");
      }
    })()
  );
});
