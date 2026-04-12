import * as nodemailer from 'nodemailer';
import { Injectable, Logger } from '@nestjs/common';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import type { Transporter } from 'nodemailer';
import type { Order, OrderItem, Product, Size, User } from '@prisma/client';

/** Pedido cargado para plantillas (include de `orderIncludeMail` en orders.service). */
export type OrderMailPayload = Order & {
  user: Pick<User, 'email' | 'name'>;
  items: (OrderItem & {
    product: Pick<Product, 'title'>;
    size: Size | null;
  })[];
};

@Injectable()
export class MailService {
  private transporter: Transporter | null = null;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    const user = process.env.MAIL_USER?.trim();
    const pass = process.env.MAIL_PASS?.trim();

    if (!user || !pass) {
      this.logger.warn(
        'MAIL_USER o MAIL_PASS no configurados. Emails deshabilitados.',
      );
      return;
    }

    const smtpOptions: SMTPTransport.Options & { family?: number } = {
      host: process.env.MAIL_HOST?.trim() ?? 'smtp.gmail.com',
      port: Number(process.env.MAIL_PORT ?? 587),
      secure: false,
      requireTLS: true,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2',
      },
      /** Render (plan gratuito) no enruta IPv6; Gmail puede resolver a IPv6. */
      family: 4,
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    };
    this.transporter = nodemailer.createTransport(smtpOptions);

    void this.transporter
      .verify()
      .then(() => this.logger.log('✅ SMTP Gmail conectado'))
      .catch((err: Error) =>
        this.logger.error(`❌ SMTP error: ${err.message}`),
      );
  }

  private async send(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Transporter no inicializado');
      return false;
    }
    const from =
      process.env.MAIL_FROM?.trim() ??
      'Big Boys Gym <bigboysdevs@gmail.com>';
    try {
      const result = await this.transporter.sendMail({
        from,
        ...options,
      });
      this.logger.log(`Email enviado a ${options.to}: ${result.messageId}`);
      return true;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error al enviar email a ${options.to}: ${msg}`);
      return false;
    }
  }

  private escapeHtml(s: string): string {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private shortOrderId(orderId: string): string {
    return orderId.replace(/-/g, '').slice(0, 8).toUpperCase();
  }

  private formatCOP(valor: number): string {
    return `$${valor.toLocaleString('es-CO')} COP`;
  }

  private formatFecha(fecha: Date | string): string {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private itemUnitPrice(item: {
    unitPrice?: number;
    priceSnapshot: number;
  }): number {
    if (typeof item.unitPrice === 'number' && Number.isFinite(item.unitPrice)) {
      return item.unitPrice;
    }
    return item.priceSnapshot;
  }

  private calcularTotal(
    items: Array<{
      unitPrice?: number;
      priceSnapshot: number;
      quantity: number;
    }>,
  ): number {
    return (
      items?.reduce(
        (sum, item) => sum + this.itemUnitPrice(item) * item.quantity,
        0,
      ) ?? 0
    );
  }

  private productLineLabel(item: {
    product?: { title?: string; name?: string };
  }): string {
    const p = item.product as { title?: string; name?: string } | undefined;
    return p?.title ?? p?.name ?? 'Producto';
  }

  private buildItemsTable(
    items: OrderMailPayload['items'],
  ): string {
    const filas =
      items
        ?.map((item) => {
          const unit = this.itemUnitPrice(item);
          const name = this.escapeHtml(this.productLineLabel(item));
          const sizeName = item.size?.name
            ? this.escapeHtml(item.size.name)
            : '';
          return `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #2a2a2a;color:#e4e4e7">
          <strong>${name}</strong>
          ${
            sizeName
              ? `<br/><span style="color:#71717a;font-size:12px">Talla: ${sizeName}</span>`
              : ''
          }
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #2a2a2a;color:#a1a1aa;text-align:center">
          ${item.quantity}
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #2a2a2a;color:#a1a1aa;text-align:right">
          ${this.formatCOP(unit)}
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid #2a2a2a;color:#f7e047;text-align:right;font-weight:bold">
          ${this.formatCOP(unit * item.quantity)}
        </td>
      </tr>`;
        })
        .join('') ?? '';

    return `
      <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <thead>
          <tr style="background:#1a1a1a">
            <th style="padding:10px 14px;text-align:left;color:#f7e047;font-size:11px;letter-spacing:2px;text-transform:uppercase">Producto</th>
            <th style="padding:10px 14px;text-align:center;color:#f7e047;font-size:11px;letter-spacing:2px;text-transform:uppercase">Cant.</th>
            <th style="padding:10px 14px;text-align:right;color:#f7e047;font-size:11px;letter-spacing:2px;text-transform:uppercase">P. Unit.</th>
            <th style="padding:10px 14px;text-align:right;color:#f7e047;font-size:11px;letter-spacing:2px;text-transform:uppercase">Subtotal</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>
    `;
  }

  private baseTemplate(contenido: string): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
      </head>
      <body style="margin:0;padding:0;background:#0a0a0a;font-family:sans-serif">
        <div style="max-width:600px;margin:0 auto;background:#111111;border:1px solid #2a2a2a">
          <div style="background:#050505;padding:24px 32px;border-bottom:3px solid #d91920">
            <h1 style="margin:0;font-size:24px;color:#f7e047;letter-spacing:6px;text-transform:uppercase;font-weight:900">BIG BOYS GYM</h1>
            <p style="margin:4px 0 0;font-size:11px;color:#52525b;letter-spacing:3px;text-transform:uppercase">TIENDA OFICIAL · MANIZALES, COLOMBIA</p>
          </div>
          <div style="padding:32px">${contenido}</div>
          <div style="background:#050505;padding:20px 32px;border-top:1px solid #2a2a2a;text-align:center">
            <p style="margin:0;font-size:11px;color:#3f3f46;letter-spacing:2px;text-transform:uppercase">BIG BOYS GYM · Manizales, Colombia</p>
            <p style="margin:8px 0 0;font-size:11px;color:#27272a">Este es un mensaje automático, no respondas este correo.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private frontendUrl(): string {
    return (
      process.env.FRONTEND_URL?.trim() ??
      'https://store-gym-bigboys.vercel.app'
    ).replace(/\/$/, '');
  }

  async sendOrderConfirmation(order: OrderMailPayload): Promise<void> {
    const emailDestino =
      order.shippingEmail?.trim() || order.user?.email?.trim();
    if (!emailDestino) return;

    const total = this.calcularTotal(order.items);
    const base = this.frontendUrl();
    const sid = this.shortOrderId(order.id);
    const nombre = this.escapeHtml(order.user?.name ?? 'cliente');

    const contenido = `
      <h2 style="color:#ffffff;margin:0 0 8px;font-size:20px">¡Tu pedido está confirmado! 💪</h2>
      <p style="color:#a1a1aa;margin:0 0 24px;font-size:14px">Hola ${nombre}, recibimos tu pedido y lo estamos procesando.</p>
      <div style="background:#1a1a1a;border-left:3px solid #d91920;padding:12px 16px;margin-bottom:24px">
        <p style="margin:0;font-size:11px;color:#71717a;letter-spacing:2px;text-transform:uppercase">Número de pedido</p>
        <p style="margin:4px 0 0;font-size:18px;color:#f7e047;font-weight:bold;letter-spacing:2px">#${sid}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#52525b">${this.formatFecha(order.createdAt)}</p>
      </div>
      ${this.buildItemsTable(order.items)}
      <div style="text-align:right;background:#1a1a1a;padding:16px;border-top:2px solid #d91920">
        <p style="margin:0;font-size:11px;color:#71717a;letter-spacing:2px;text-transform:uppercase">Total a pagar</p>
        <p style="margin:4px 0 0;font-size:24px;color:#f7e047;font-weight:bold;letter-spacing:2px">${this.formatCOP(total)}</p>
      </div>
      <div style="margin-top:24px;padding:16px;background:#1a1a1a;border:1px solid #2a2a2a">
        <p style="margin:0 0 8px;font-size:11px;color:#f7e047;letter-spacing:2px;text-transform:uppercase;font-weight:bold">Próximos pasos</p>
        <p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.6">Nos contactaremos pronto para coordinar la entrega. Si tenés dudas escribinos.</p>
      </div>
      <div style="text-align:center;margin-top:28px">
        <a href="${this.escapeHtml(base)}/mis-pedidos" style="display:inline-block;background:#d91920;color:#ffffff;padding:14px 32px;text-decoration:none;font-weight:bold;font-size:13px;letter-spacing:2px;text-transform:uppercase">VER MIS PEDIDOS →</a>
      </div>
    `;

    await this.send({
      to: emailDestino,
      subject: `✅ Pedido #${sid} confirmado · Big Boys Gym`,
      html: this.baseTemplate(contenido),
    });
  }

  async sendNewOrderToAdmin(order: OrderMailPayload): Promise<void> {
    const adminEmail =
      process.env.MAIL_ADMIN_TO?.trim() ??
      process.env.MAIL_USER?.trim() ??
      process.env.ADMIN_EMAIL?.trim();
    if (!adminEmail) {
      this.logger.warn('MAIL_ADMIN_TO / MAIL_USER no definido; email admin omitido.');
      return;
    }

    const total = this.calcularTotal(order.items);
    const base = this.frontendUrl();
    const sid = this.shortOrderId(order.id);
    const shipRow = order.shippingCity?.trim()
      ? `<tr>
        <td style="padding:6px 0;color:#71717a;font-size:12px">Envío a:</td>
        <td style="padding:6px 0;color:#e4e4e7;font-size:13px">
          ${this.escapeHtml(order.shippingAddress?.trim() ?? '—')}, ${this.escapeHtml(order.shippingCity.trim())}
        </td>
      </tr>`
      : '';

    const contenido = `
      <h2 style="color:#ffffff;margin:0 0 8px;font-size:20px">🛒 Nuevo pedido recibido</h2>
      <p style="color:#a1a1aa;margin:0 0 24px;font-size:14px">Se acaba de confirmar un nuevo pedido en la tienda.</p>
      <div style="background:#1a1a1a;border:1px solid #2a2a2a;padding:16px;margin-bottom:20px">
        <p style="margin:0 0 12px;font-size:11px;color:#f7e047;letter-spacing:2px;text-transform:uppercase;font-weight:bold">Datos del cliente</p>
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:6px 0;color:#71717a;font-size:12px;width:120px">Nombre:</td>
            <td style="padding:6px 0;color:#e4e4e7;font-size:13px">${this.escapeHtml(order.user?.name ?? '—')}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#71717a;font-size:12px">Email:</td>
            <td style="padding:6px 0;color:#e4e4e7;font-size:13px">${this.escapeHtml(order.user?.email ?? '—')}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#71717a;font-size:12px">Pedido:</td>
            <td style="padding:6px 0;color:#f7e047;font-size:13px;font-weight:bold">#${sid}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#71717a;font-size:12px">Total:</td>
            <td style="padding:6px 0;color:#f7e047;font-size:16px;font-weight:bold">${this.formatCOP(total)}</td>
          </tr>
          ${shipRow}
        </table>
      </div>
      ${this.buildItemsTable(order.items)}
      <div style="text-align:center;margin-top:24px">
        <a href="${this.escapeHtml(base)}/admin/pedidos/${this.escapeHtml(order.id)}" style="display:inline-block;background:#d91920;color:#ffffff;padding:14px 32px;text-decoration:none;font-weight:bold;font-size:13px;letter-spacing:2px;text-transform:uppercase">VER PEDIDO EN ADMIN →</a>
      </div>
    `;

    await this.send({
      to: adminEmail,
      subject: `🛒 Nuevo pedido #${sid} · $${total.toLocaleString('es-CO')}`,
      html: this.baseTemplate(contenido),
    });
  }

  async sendStatusUpdate(
    order: OrderMailPayload,
    newStatus: string,
  ): Promise<void> {
    const emailDestino =
      order.shippingEmail?.trim() || order.user?.email?.trim();
    if (!emailDestino) return;

    const statusConfig: Record<
      string,
      { emoji: string; titulo: string; mensaje: string; color: string }
    > = {
      PAID: {
        emoji: '✅',
        titulo: '¡Pedido confirmado!',
        mensaje:
          'Tu pedido fue confirmado y está siendo preparado. Pronto nos contactamos para coordinar la entrega.',
        color: '#22c55e',
      },
      SHIPPED: {
        emoji: '🚚',
        titulo: '¡Tu pedido va en camino!',
        mensaje:
          'Tu pedido fue despachado y está en camino. Pronto lo recibirás.',
        color: '#f97316',
      },
      DELIVERED: {
        emoji: '📦',
        titulo: '¡Pedido entregado!',
        mensaje:
          '¡Tu pedido fue entregado exitosamente! Esperamos que disfrutes tus productos. 💪',
        color: '#22c55e',
      },
      CANCELLED: {
        emoji: '❌',
        titulo: 'Pedido cancelado',
        mensaje:
          'Tu pedido fue cancelado. Si tenés dudas o necesitás ayuda, contactanos.',
        color: '#d91920',
      },
    };

    const config = statusConfig[newStatus];
    if (!config) return;

    const total = this.calcularTotal(order.items);
    const base = this.frontendUrl();
    const sid = this.shortOrderId(order.id);
    const items = order.items ?? [];
    const head = items.slice(0, 3);
    const rest = items.length > 3 ? items.length - 3 : 0;

    const lines =
      head
        .map((item) => {
          const unit = this.itemUnitPrice(item);
          const pl = this.escapeHtml(this.productLineLabel(item));
          const sz = item.size?.name
            ? ` · Talla ${this.escapeHtml(item.size.name)}`
            : '';
          return `
          <div style="padding:10px 0;border-bottom:1px solid #1a1a1a">
            <p style="margin:0;font-size:13px;color:#e4e4e7">${pl}</p>
            <p style="margin:2px 0 0;font-size:11px;color:#52525b">× ${item.quantity}${sz}</p>
            <p style="margin:4px 0 0;font-size:13px;color:#f7e047;font-weight:bold;text-align:right">${this.formatCOP(unit * item.quantity)}</p>
          </div>`;
        })
        .join('') ?? '';
    const more =
      rest > 0
        ? `<p style="margin:8px 0 0;font-size:12px;color:#52525b;text-align:center">+ ${rest} producto(s) más</p>`
        : '';

    const contenido = `
      <div style="text-align:center;margin-bottom:28px">
        <div style="font-size:48px;margin-bottom:12px">${config.emoji}</div>
        <h2 style="color:#ffffff;margin:0 0 8px;font-size:22px">${this.escapeHtml(config.titulo)}</h2>
        <p style="color:#a1a1aa;margin:0;font-size:14px;line-height:1.6;max-width:400px;margin-left:auto;margin-right:auto">${this.escapeHtml(config.mensaje)}</p>
      </div>
      <div style="background:#1a1a1a;border-left:3px solid ${config.color};padding:16px;margin-bottom:24px">
        <table style="width:100%;border-collapse:collapse"><tr>
          <td style="vertical-align:top">
            <p style="margin:0;font-size:11px;color:#71717a;letter-spacing:2px;text-transform:uppercase">Pedido</p>
            <p style="margin:4px 0 0;font-size:16px;color:#f7e047;font-weight:bold;letter-spacing:2px">#${sid}</p>
          </td>
          <td style="vertical-align:top;text-align:right">
            <p style="margin:0;font-size:11px;color:#71717a;letter-spacing:2px;text-transform:uppercase">Total</p>
            <p style="margin:4px 0 0;font-size:16px;color:#f7e047;font-weight:bold">${this.formatCOP(total)}</p>
          </td>
        </tr></table>
      </div>
      <div style="margin-bottom:24px">${lines}${more}</div>
      <div style="text-align:center">
        <a href="${this.escapeHtml(base)}/mis-pedidos" style="display:inline-block;background:#d91920;color:#ffffff;padding:14px 32px;text-decoration:none;font-weight:bold;font-size:13px;letter-spacing:2px;text-transform:uppercase">VER MIS PEDIDOS →</a>
      </div>
    `;

    await this.send({
      to: emailDestino,
      subject: `${config.emoji} Pedido #${sid} · ${config.titulo} · Big Boys Gym`,
      html: this.baseTemplate(contenido),
    });
  }
}
