import { Injectable, Logger } from '@nestjs/common';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly vapidReady: boolean;

  constructor(private readonly prisma: PrismaService) {
    const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
    const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
    const email = process.env.VAPID_EMAIL?.trim();

    if (!publicKey || !privateKey) {
      this.logger.warn(
        'VAPID keys no configuradas. Push notifications deshabilitadas.',
      );
      this.vapidReady = false;
      return;
    }

    this.vapidReady = true;
    webpush.setVapidDetails(
      email ?? 'mailto:bigboysdevs@gmail.com',
      publicKey,
      privateKey,
    );
    this.logger.log('Web Push (VAPID) configurado');
  }

  isEnabled(): boolean {
    return this.vapidReady;
  }

  async saveSubscription(
    userId: string,
    subscription: {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    },
    userAgent?: string,
  ) {
    return this.prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: userAgent ?? null,
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: userAgent ?? null,
      },
    });
  }

  async removeSubscription(userId: string, endpoint: string) {
    return this.prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
  }

  async sendToUser(
    userId: string,
    payload: {
      title: string;
      body: string;
      icon?: string;
      badge?: string;
      url?: string;
      tag?: string;
      notifType?: string;
    },
  ): Promise<void> {
    if (!this.vapidReady) return;

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (!subscriptions.length) return;

    const notification = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon ?? '/brand/logo-bigboys.jpg',
      badge: '/brand/logo-bigboys.jpg',
      url: payload.url ?? '/',
      tag: payload.tag ?? `bigboys-${Date.now()}`,
      notifType: payload.notifType ?? 'SYSTEM',
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            notification,
          );
        } catch (err: unknown) {
          const code = (err as { statusCode?: number }).statusCode;
          if (code === 410 || code === 404) {
            await this.prisma.pushSubscription.delete({ where: { id: sub.id } });
            this.logger.warn(`Suscripción expirada eliminada: ${sub.id}`);
          } else {
            this.logger.warn(`Push falló (${sub.id}): ${String(err)}`);
          }
        }
      }),
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    this.logger.log(
      `Push enviado a ${sent}/${subscriptions.length} dispositivos → usuario ${userId}`,
    );
  }

  async sendToAll(payload: {
    title: string;
    body: string;
    url?: string;
    tag?: string;
    notifType?: string;
  }): Promise<void> {
    if (!this.vapidReady) {
      this.logger.warn('VAPID no configurado: broadcast omitido');
      return;
    }

    const subscriptions = await this.prisma.pushSubscription.findMany();

    if (!subscriptions.length) {
      this.logger.warn('No hay suscripciones activas');
      return;
    }

    const notification = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: '/brand/logo-bigboys.jpg',
      badge: '/brand/logo-bigboys.jpg',
      url: payload.url ?? '/tienda',
      tag: payload.tag ?? `bigboys-promo-${Date.now()}`,
      notifType: payload.notifType ?? 'PROMO',
    });

    let sent = 0;
    let expired = 0;

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            notification,
          );
          sent += 1;
        } catch (err: unknown) {
          const code = (err as { statusCode?: number }).statusCode;
          if (code === 410 || code === 404) {
            await this.prisma.pushSubscription.delete({ where: { id: sub.id } });
            expired += 1;
          } else {
            this.logger.warn(`Push masivo falló (${sub.id}): ${String(err)}`);
          }
        }
      }),
    );

    this.logger.log(
      `Push masivo: ${sent} enviados, ${expired} expirados eliminados`,
    );
  }

  async notifyOrderStatus(
    userId: string,
    orderId: string,
    status: string,
    frontendUrl: string,
  ): Promise<void> {
    if (!this.vapidReady) return;

    const statusConfig: Record<
      string,
      { title: string; body: string; tag: string }
    > = {
      PAID: {
        title: '✅ ¡Pago confirmado!',
        body: 'Tu pedido fue pagado. Estamos preparando tu envío.',
        tag: `order-paid-${orderId}`,
      },
      SHIPPED: {
        title: '🚚 ¡Tu pedido va en camino!',
        body: 'Tu pedido fue despachado. Pronto lo recibirás.',
        tag: `order-shipped-${orderId}`,
      },
      DELIVERED: {
        title: '📦 ¡Pedido entregado!',
        body: '¡Tu pedido llegó! Esperamos que disfrutes tus productos. 💪',
        tag: `order-delivered-${orderId}`,
      },
      CANCELLED: {
        title: '❌ Pedido cancelado',
        body: 'Tu pedido fue cancelado. Contactanos si tenés dudas.',
        tag: `order-cancelled-${orderId}`,
      },
    };

    const config = statusConfig[status];
    if (!config) return;

    const notifTypeMap: Record<string, 'ORDER' | 'SYSTEM'> = {
      PAID: 'ORDER',
      SHIPPED: 'ORDER',
      DELIVERED: 'ORDER',
      CANCELLED: 'ORDER',
    };

    await this.sendToUser(userId, {
      ...config,
      url: `${frontendUrl.replace(/\/$/, '')}/mis-pedidos`,
      notifType: notifTypeMap[status] ?? 'SYSTEM',
    });
  }

  async getStats() {
    const totalSubscriptions = await this.prisma.pushSubscription.count();
    const byUser = await this.prisma.pushSubscription.groupBy({
      by: ['userId'],
      _count: { _all: true },
    });
    return {
      totalSubscriptions,
      totalUsers: byUser.length,
    };
  }
}
