/* global self, clients */

self.addEventListener("push", function (event) {
  let data = {
    title: "Big Boys Gym",
    body: "",
    icon: "/brand/logo-bigboys.jpg",
    badge: "/brand/logo-bigboys.jpg",
    url: "/",
    tag: "bigboys",
  };
  try {
    if (event.data) {
      const text = event.data.text();
      const parsed = JSON.parse(text);
      data = { ...data, ...parsed };
    }
  } catch (_) {
    /* usar defaults */
  }

  const options = {
    body: data.body,
    icon: data.icon || "/brand/logo-bigboys.jpg",
    badge: data.badge || "/brand/logo-bigboys.jpg",
    tag: data.tag || "bigboys",
    data: { url: data.url || "/" },
    actions: [
      { action: "open", title: "Ver pedido" },
      { action: "close", title: "Cerrar" },
    ],
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  if (event.action === "close") return;

  let url = event.notification.data && event.notification.data.url ? event.notification.data.url : "/";
  if (typeof url !== "string") url = "/";
  const origin = self.location.origin;
  const target =
    url.startsWith("http://") || url.startsWith("https://") ? url : origin + (url.startsWith("/") ? url : "/" + url);

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.indexOf(origin) === 0 && "focus" in client) {
          if ("navigate" in client && typeof client.navigate === "function") {
            return client.navigate(target).then(function () {
              return client.focus();
            });
          }
          client.focus();
          return client;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(target);
      }
    }),
  );
});
