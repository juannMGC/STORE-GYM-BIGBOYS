/* global self, clients */

self.addEventListener("push", function (event) {
  event.waitUntil(
    (async function () {
      if (!event.data) return;

      const defaults = {
        title: "Big Boys Gym",
        body: "",
        url: "/tienda",
        tag: "bigboys",
        notifType: "PROMO",
      };
      let data = defaults;
      try {
        const text = await event.data.text();
        data = { ...defaults, ...JSON.parse(text) };
      } catch {
        data = defaults;
      }

      const title = data.title || "Big Boys Gym";
      const body = typeof data.body === "string" ? data.body : "";
      const url = data.url || "/tienda";
      const notifType = data.notifType || "PROMO";
      const pushId = "push-" + Date.now();
      const createdAt = new Date().toISOString();

      const notificationOptions = {
        body: body,
        icon: data.icon || "/brand/logo-bigboys.jpg",
        badge: "/brand/logo-bigboys.jpg",
        tag: data.tag || "bigboys-" + Date.now(),
        data: {
          url: url,
          notifType: notifType,
          title: title,
          body: body,
        },
        vibrate: [200, 100, 200],
        requireInteraction: false,
      };

      await Promise.all([
        self.registration.showNotification(title, notificationOptions),
        clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
          clientList.forEach(function (client) {
            client.postMessage({
              type: "NEW_NOTIFICATION",
              id: pushId,
              title: title,
              body: body,
              url: url,
              notifType: notifType,
              createdAt: createdAt,
              read: false,
            });
          });
        }),
      ]);
    })(),
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const raw = event.notification.data && event.notification.data.url;
  let url = typeof raw === "string" ? raw : "/";
  const origin = self.location.origin;
  const target =
    url.startsWith("http://") || url.startsWith("https://")
      ? url
      : origin + (url.startsWith("/") ? url : "/" + url);

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.indexOf(origin) === 0 && "focus" in client) {
          if ("navigate" in client && typeof client.navigate === "function") {
            return client.navigate(target).then(function () {
              return client.focus();
            });
          }
          client.focus();
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(target);
      }
    }),
  );
});
