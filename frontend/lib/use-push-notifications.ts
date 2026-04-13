"use client";

import { useCallback, useEffect, useState } from "react";

const PUBLIC_VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

type ApiFetchLike = <T = unknown>(
  path: string,
  options?: { method?: string; body?: string; skipAuth?: boolean; headers?: HeadersInit },
) => Promise<T>;

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);

    void navigator.serviceWorker.ready.then((reg) => {
      void reg.pushManager.getSubscription().then((sub) => {
        setSubscribed(!!sub);
      });
    });
  }, []);

  const subscribe = useCallback(async (fetcher: ApiFetchLike): Promise<boolean> => {
    if (!PUBLIC_VAPID_KEY) {
      console.warn("NEXT_PUBLIC_VAPID_PUBLIC_KEY no configurada");
      return false;
    }

    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        return false;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
      });

      const subJson = subscription.toJSON();
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        return false;
      }

      await fetcher("/notifications/subscribe", {
        method: "POST",
        body: JSON.stringify({
          subscription: {
            endpoint: subJson.endpoint,
            keys: {
              p256dh: subJson.keys.p256dh,
              auth: subJson.keys.auth,
            },
          },
        }),
      });

      setSubscribed(true);
      return true;
    } catch (err) {
      console.error("Error suscribiendo push:", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async (fetcher: ApiFetchLike) => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetcher("/notifications/unsubscribe", {
          method: "DELETE",
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }

      setSubscribed(false);
    } catch (err) {
      console.error("Error desuscribiendo:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    permission,
    subscribed,
    loading,
    subscribe,
    unsubscribe,
    isSupported: permission !== "unsupported",
  };
}
