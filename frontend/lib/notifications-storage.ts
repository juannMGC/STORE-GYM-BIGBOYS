/** Claves y tipo compartido entre campana y AuthProvider (bienvenida). */
export const NOTIFICATIONS_LS_KEY = "bigboys-notifications";
export const NOTIF_WELCOME_LS_KEY = "bigboys-notif-welcome";

export type StoredNotificationType = "ORDER" | "PROMO" | "SYSTEM";

export type StoredNotification = {
  id: string;
  title: string;
  body: string;
  url?: string;
  read: boolean;
  createdAt: string;
  type: StoredNotificationType;
};
