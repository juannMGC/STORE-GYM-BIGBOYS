/* global self, clients, indexedDB */

function openDB() {
  return new Promise(function (resolve, reject) {
    var request = indexedDB.open("bigboys-notifs", 1);
    request.onupgradeneeded = function (event) {
      var db = event.target.result;
      if (!db.objectStoreNames.contains("notifications")) {
        var store = db.createObjectStore("notifications", { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
      }
    };
    request.onsuccess = function () {
      resolve(request.result);
    };
    request.onerror = function () {
      reject(request.error);
    };
  });
}

function saveNotification(notif) {
  return openDB().then(function (db) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction("notifications", "readwrite");
      var store = tx.objectStore("notifications");
      store.put(notif);
      tx.oncomplete = function () {
        resolve();
      };
      tx.onerror = function () {
        reject(tx.error);
      };
    });
  });
}

self.addEventListener("push", function (event) {
  event.waitUntil(
    (async function () {
      var defaults = {
        title: "Big Boys Gym",
        body: "",
        url: "/tienda",
        tag: "bigboys",
        notifType: "PROMO",
        icon: "/brand/logo-bigboys.jpg",
      };
      var data = defaults;
      if (event.data) {
        try {
          var text = await event.data.text();
          data = Object.assign({}, defaults, JSON.parse(text));
        } catch (_) {
          data = defaults;
        }
      }

      var title = data.title || "Big Boys Gym";
      var body = typeof data.body === "string" ? data.body : "";
      var url = data.url || "/tienda";
      var notifType = data.notifType || "PROMO";
      var notif = {
        id: "push-" + Date.now() + "-" + Math.random().toString(36).slice(2, 11),
        title: title,
        body: body,
        url: url,
        notifType: notifType,
        createdAt: new Date().toISOString(),
        read: false,
      };

      var notificationOptions = {
        body: body,
        icon: data.icon || "/brand/logo-bigboys.jpg",
        badge: "/brand/logo-bigboys.jpg",
        tag: data.tag || notif.id,
        data: { url: url },
        vibrate: [200, 100, 200],
        requireInteraction: false,
      };

      await Promise.all([
        saveNotification(notif),
        self.registration.showNotification(title, notificationOptions),
        clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
          clientList.forEach(function (client) {
            client.postMessage({
              type: "NEW_NOTIFICATION",
              notif: notif,
            });
          });
        }),
      ]);
    })(),
  );
});

self.addEventListener("message", function (event) {
  var t = event.data && event.data.type;
  if (!t) return;

  if (t === "GET_STORED_NOTIFICATIONS") {
    openDB()
      .then(function (db) {
        return new Promise(function (resolve, reject) {
          var tx = db.transaction("notifications", "readonly");
          var store = tx.objectStore("notifications");
          var req = store.getAll();
          req.onsuccess = function () {
            resolve(req.result || []);
          };
          req.onerror = function () {
            reject(req.error);
          };
        });
      })
      .then(function (list) {
        if (event.source && event.source.postMessage) {
          event.source.postMessage({
            type: "STORED_NOTIFICATIONS",
            notifications: list,
          });
        }
      })
      .catch(function () {
        if (event.source && event.source.postMessage) {
          event.source.postMessage({
            type: "STORED_NOTIFICATIONS",
            notifications: [],
          });
        }
      });
    return;
  }

  if (t === "MARK_ALL_READ") {
    openDB()
      .then(function (db) {
        return new Promise(function (resolve, reject) {
          var tx = db.transaction("notifications", "readwrite");
          var store = tx.objectStore("notifications");
          var req = store.getAll();
          req.onsuccess = function () {
            (req.result || []).forEach(function (n) {
              n.read = true;
              store.put(n);
            });
          };
          tx.oncomplete = function () {
            resolve();
          };
          tx.onerror = function () {
            reject(tx.error);
          };
        });
      })
      .catch(function () {});
    return;
  }

  if (t === "MARK_READ") {
    var readId = event.data.id;
    if (!readId) return;
    openDB()
      .then(function (db) {
        return new Promise(function (resolve, reject) {
          var tx = db.transaction("notifications", "readwrite");
          var store = tx.objectStore("notifications");
          var req = store.get(readId);
          req.onsuccess = function () {
            var n = req.result;
            if (n) {
              n.read = true;
              store.put(n);
            }
          };
          tx.oncomplete = function () {
            resolve();
          };
          tx.onerror = function () {
            reject(tx.error);
          };
        });
      })
      .catch(function () {});
    return;
  }

  if (t === "CLEAR_NOTIFICATIONS") {
    openDB()
      .then(function (db) {
        return new Promise(function (resolve, reject) {
          var tx = db.transaction("notifications", "readwrite");
          var store = tx.objectStore("notifications");
          store.clear();
          tx.oncomplete = function () {
            resolve();
          };
          tx.onerror = function () {
            reject(tx.error);
          };
        });
      })
      .catch(function () {});
    return;
  }

  if (t === "DELETE_NOTIFICATION") {
    var delId = event.data.id;
    if (!delId) return;
    openDB()
      .then(function (db) {
        return new Promise(function (resolve, reject) {
          var tx = db.transaction("notifications", "readwrite");
          var store = tx.objectStore("notifications");
          store.delete(delId);
          tx.oncomplete = function () {
            resolve();
          };
          tx.onerror = function () {
            reject(tx.error);
          };
        });
      })
      .catch(function () {});
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  var raw = event.notification.data && event.notification.data.url;
  var url = typeof raw === "string" ? raw : "/";
  var origin = self.location.origin;
  var target =
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
