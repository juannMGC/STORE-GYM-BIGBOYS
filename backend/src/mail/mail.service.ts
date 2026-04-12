import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { Order, OrderItem, Product, Size, User } from '@prisma/client';

const BRAND_RED = '#d91920';
const BRAND_YELLOW = '#f7e047';
const BG = '#050505';
const TEXT = '#e4e4e7';

export type OrderMailPayload = Order & {
  user: Pick<User, 'email' | 'name'>;
  items: (OrderItem & {
    product: Pick<Product, 'title'>;
    size: Size | null;
  })[];
};

export type InvoiceMailOrder = {
  id: string;
  status: string;
  createdAt: Date;
  paymentMethod: string | null;
  user: { name: string | null; email: string };
  items: {
    quantity: number;
    unitPrice: number;
    product: { name: string; imageUrl: string | null };
    size: { name: string } | null;
  }[];
  total: number;
};

type SmtpError = Error & { code?: string; command?: string; responseCode?: number };

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | undefined;

  constructor() {
    const user = process.env.MAIL_USER?.trim();
    const pass = process.env.MAIL_PASS?.trim();
    const host = process.env.MAIL_HOST?.trim() ?? 'smtp.gmail.com';
    const port = Number(process.env.MAIL_PORT ?? 587);

    this.logger.log(
      `[MailService] Configuración: ${JSON.stringify({
        host,
        port,
        user: user ? `${user.slice(0, 5)}...` : 'NO DEFINIDO',
        pass: pass ? `${pass.length} chars` : 'NO DEFINIDO',
        from: process.env.MAIL_FROM?.trim() ?? 'NO DEFINIDO',
      })}`,
    );

    if (!user || !pass) {
      this.logger.warn('[MailService] Sin credenciales, emails deshabilitados');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: false,
      requireTLS: true,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2',
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    void this.transporter
      .verify()
      .then(() => this.logger.log('[MailService] Conexión SMTP OK ✓'))
      .catch((err: Error) =>
        this.logger.error(`[MailService] Error de conexión SMTP: ${err.message}`),
      );
  }

  /**
   * Envío SMTP unificado. Si throwOnFailure es false, solo registra el error (emails opcionales).
   */
  private async deliverMail(
    to: string,
    subject: string,
    html: string,
    throwOnFailure: boolean,
  ): Promise<void> {
    if (!this.transporter) {
      const msg =
        'Transporter no inicializado. Verificar MAIL_USER y MAIL_PASS en Render.';
      this.logger.warn(`[MailService] ${msg}`);
      if (throwOnFailure) {
        throw new BadRequestException(msg);
      }
      return;
    }
    const from = process.env.MAIL_FROM?.trim();
    if (!from) {
      const msg = 'MAIL_FROM no definido';
      if (throwOnFailure) {
        throw new BadRequestException(`Envío de correo no configurado (${msg})`);
      }
      this.logger.warn(`[MailService] ${msg}; email omitido.`);
      return;
    }
    try {
      const result = await this.transporter.sendMail({ from, to, subject, html });
      this.logger.log(`[MailService] Email enviado: ${result.messageId ?? '(sin id)'}`);
    } catch (e: unknown) {
      const err = e as SmtpError;
      this.logger.error(
        `[MailService] Error al enviar: ${JSON.stringify({
          message: err.message,
          code: err.code,
          command: err.command,
          responseCode: err.responseCode,
        })}`,
      );
      if (throwOnFailure) {
        throw new BadRequestException(`Error SMTP: ${err.message ?? String(e)}`);
      }
    }
  }

  private wrapHtml(inner: string): string {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:0;background:${BG};font-family:system-ui,Segoe UI,sans-serif;color:${TEXT};">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BG};padding:24px 12px;">
<tr><td align="center">
<table width="560" cellspacing="0" cellpadding="0" style="max-width:560px;border:2px solid ${BRAND_RED};background:#0a0a0a;">
<tr><td style="padding:20px 24px;border-bottom:4px solid ${BRAND_RED};">
<span style="font-size:20px;font-weight:800;letter-spacing:0.06em;color:${BRAND_YELLOW};text-transform:uppercase;">BIG BOYS GYM</span>
</td></tr>
<tr><td style="padding:24px;">${inner}</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #27272a;font-size:12px;color:#71717a;">
Tienda oficial · Este es un mensaje automático, no respondas a este correo.
</td></tr>
</table>
</td></tr></table></body></html>`;
  }

  private formatCop(n: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(n);
  }

  private orderTotal(order: OrderMailPayload): number {
    return order.items.reduce((s, i) => s + i.priceSnapshot * i.quantity, 0);
  }

  private itemsTable(order: OrderMailPayload): string {
    const rows = order.items
      .map((line) => {
        const size = line.size ? ` · ${line.size.name}` : '';
        const lineTotal = line.priceSnapshot * line.quantity;
        return `<tr>
<td style="padding:10px 8px;border-bottom:1px solid #27272a;">${this.escape(line.product.title)}${size}</td>
<td style="padding:10px 8px;border-bottom:1px solid #27272a;text-align:center;">${line.quantity}</td>
<td style="padding:10px 8px;border-bottom:1px solid #27272a;text-align:right;">${this.formatCop(lineTotal)}</td>
</tr>`;
      })
      .join('');
    return `<table width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;">
<tr style="color:#a1a1aa;font-size:11px;text-transform:uppercase;">
<th align="left" style="padding:8px;">Producto</th><th style="padding:8px;">Cant.</th><th align="right" style="padding:8px;">Subtotal</th></tr>
${rows}
</table>`;
  }

  private escape(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private safeHttpUrl(url: string | null | undefined): url is string {
    if (!url || !url.trim()) return false;
    try {
      const u = new URL(url.trim());
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private invoiceStatusLabel(status: string): string {
    const m: Record<string, string> = {
      DRAFT: 'Borrador',
      PENDING: 'Pendiente',
      PAID: 'Confirmado',
      SHIPPED: 'Enviado',
      DELIVERED: 'Entregado',
      CANCELLED: 'Cancelado',
    };
    return m[status] ?? status;
  }

  private invoiceItemsTable(order: InvoiceMailOrder): string {
    const rows = order.items
      .map((line) => {
        const sub = line.unitPrice * line.quantity;
        const sizeCell = line.size ? this.escape(line.size.name) : '—';
        const imgCell = this.safeHttpUrl(line.product.imageUrl)
          ? `<img src="${this.escape(line.product.imageUrl!)}" width="56" height="56" alt="" style="display:block;border-radius:4px;object-fit:cover;border:1px solid #27272a;"/>`
          : `<div style="width:56px;height:56px;background:#1a1a1a;border:1px solid #27272a;border-radius:4px;display:flex;align-items:center;justify-content:center;color:${BRAND_RED};font-weight:800;font-size:20px;">${this.escape((line.product.name.charAt(0) || '?').toUpperCase())}</div>`;
        return `<tr>
<td style="padding:12px 8px;border-bottom:1px solid #27272a;vertical-align:middle;width:64px;">${imgCell}</td>
<td style="padding:12px 8px;border-bottom:1px solid #27272a;vertical-align:middle;">
  <div style="font-weight:700;color:${BRAND_YELLOW};font-size:15px;">${this.escape(line.product.name)}</div>
  <div style="font-size:12px;color:#a1a1aa;margin-top:4px;">Talla: ${sizeCell}</div>
</td>
<td style="padding:12px 8px;border-bottom:1px solid #27272a;vertical-align:middle;text-align:center;">${line.quantity}</td>
<td style="padding:12px 8px;border-bottom:1px solid #27272a;vertical-align:middle;text-align:right;white-space:nowrap;">${this.formatCop(line.unitPrice)}</td>
<td style="padding:12px 8px;border-bottom:1px solid #27272a;vertical-align:middle;text-align:right;white-space:nowrap;font-weight:700;color:${BRAND_YELLOW};">${this.formatCop(sub)}</td>
</tr>`;
      })
      .join('');
    return `<table width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;">
<tr style="color:#a1a1aa;font-size:11px;text-transform:uppercase;">
<th align="left" style="padding:8px;border-bottom:2px solid ${BRAND_RED};"></th>
<th align="left" style="padding:8px;border-bottom:2px solid ${BRAND_RED};">Producto</th>
<th style="padding:8px;border-bottom:2px solid ${BRAND_RED};">Cant.</th>
<th align="right" style="padding:8px;border-bottom:2px solid ${BRAND_RED};">P. unit.</th>
<th align="right" style="padding:8px;border-bottom:2px solid ${BRAND_RED};">Subtotal</th>
</tr>
${rows}
</table>`;
  }

  private paymentLabel(method: string | null): string {
    const m = method ?? '';
    if (m === 'CASH') return 'Efectivo';
    if (m === 'BANK_TRANSFER') return 'Transferencia bancaria';
    if (m === 'CARD') return 'Tarjeta';
    return m || '—';
  }

  private frontendBase(): string {
    const raw =
      process.env.FRONTEND_URL?.trim() ||
      process.env.CORS_ORIGIN?.trim()?.split(',')[0]?.trim() ||
      'http://localhost:3000';
    return raw.replace(/\/$/, '');
  }

  /**
   * @param requireConfigured si true, propaga BadRequestException con mensaje SMTP (p. ej. factura).
   */
  private async sendHtml(
    to: string,
    subject: string,
    html: string,
    requireConfigured = false,
  ): Promise<void> {
    await this.deliverMail(to, subject, html, requireConfigured);
  }

  /** Pedido confirmado / pagado (PAID): cliente + admin. */
  async sendPedidoConfirmado(order: OrderMailPayload): Promise<void> {
    const idShort = order.id.slice(0, 8);
    const total = this.orderTotal(order);
    const clientEmail = order.user.email;
    if (!clientEmail) {
      this.logger.warn(`Pedido ${order.id}: usuario sin email`);
      return;
    }

    const clientInner = `
<p style="margin:0 0 16px;font-size:18px;font-weight:700;color:${BRAND_YELLOW};">¡Tu pedido está confirmado! 💪</p>
<p style="margin:0 0 12px;line-height:1.5;">Hola${order.user.name ? ` <strong>${this.escape(order.user.name)}</strong>` : ''}, recibimos tu pedido <strong style="color:${BRAND_YELLOW};">#${idShort}</strong>.</p>
${this.itemsTable(order)}
<p style="margin:16px 0 0;font-size:18px;font-weight:700;color:${BRAND_YELLOW};">Total: ${this.formatCop(total)}</p>
<p style="margin:16px 0 0;line-height:1.5;color:#a1a1aa;">Próximos pasos: revisamos el pago y preparamos tu envío. Te avisaremos cuando el pedido salga o si necesitamos algún dato extra.</p>
`;

    await this.sendHtml(
      clientEmail,
      `¡Tu pedido #${idShort} está confirmado! 💪`,
      this.wrapHtml(clientInner),
      false,
    );

    const adminTo =
      process.env.MAIL_ADMIN_TO?.trim() ||
      process.env.MAIL_USER?.trim() ||
      process.env.ADMIN_EMAIL?.trim() ||
      process.env.ADMIN_ORDER_EMAIL?.trim();
    if (!adminTo) {
      this.logger.warn('MAIL_ADMIN_TO / MAIL_USER / ADMIN_EMAIL no definido; email admin omitido.');
      return;
    }

    const adminUrl = `${this.frontendBase()}/admin/pedidos/${encodeURIComponent(order.id)}`;
    const adminInner = `
<p style="margin:0 0 16px;font-size:18px;font-weight:700;color:${BRAND_YELLOW};">Nuevo pedido #${idShort}</p>
<p style="margin:0 0 8px;"><strong>Cliente:</strong> ${this.escape(order.user.email)}${order.user.name ? ` · ${this.escape(order.user.name)}` : ''}</p>
<p style="margin:0 0 16px;"><strong>Método de pago:</strong> ${this.escape(this.paymentLabel(order.paymentMethod))}</p>
<p style="margin:0 0 8px;font-size:12px;color:#a1a1aa;">ID: ${this.escape(order.id)}</p>
${this.itemsTable(order)}
<p style="margin:16px 0 0;font-size:16px;font-weight:700;">Total: ${this.formatCop(total)}</p>
<p style="margin:20px 0 0;"><a href="${this.escape(adminUrl)}" style="display:inline-block;padding:12px 24px;background:${BRAND_RED};color:#fff;text-decoration:none;font-weight:700;border-radius:4px;">Ver pedido en admin →</a></p>
`;

    await this.sendHtml(
      adminTo,
      `Nuevo pedido #${idShort} — Big Boys Gym`,
      this.wrapHtml(adminInner),
      false,
    );
  }

  /** Admin o sistema actualiza estado: enviado, entregado o cancelado. */
  async sendEstadoActualizadoCliente(
    order: OrderMailPayload,
    status: 'SHIPPED' | 'DELIVERED' | 'CANCELLED',
  ): Promise<void> {
    const clientEmail = order.user.email;
    if (!clientEmail) return;

    const idShort = order.id.slice(0, 8);
    const base = this.frontendBase();
    const misPedidosUrl = `${base}/mis-pedidos`;

    if (status === 'CANCELLED') {
      const inner = `
<p style="margin:0 0 16px;font-size:18px;font-weight:700;color:${BRAND_RED};">Tu pedido fue cancelado</p>
<p style="margin:0 0 12px;line-height:1.5;">Hola${order.user.name ? ` ${this.escape(order.user.name)}` : ''},</p>
<p style="margin:0 0 12px;line-height:1.5;">El pedido <strong style="color:${BRAND_YELLOW};">#${idShort}</strong> quedó registrado como <strong>cancelado</strong>. Si no reconocés esta acción, contactanos.</p>
<p style="margin:0;font-size:13px;color:#a1a1aa;">Total referido: ${this.formatCop(this.orderTotal(order))}</p>
<p style="margin:20px 0 0;"><a href="${this.escape(misPedidosUrl)}" style="display:inline-block;padding:12px 24px;background:${BRAND_RED};color:#fff;text-decoration:none;font-weight:700;border-radius:4px;">Ver mis pedidos →</a></p>
`;
      await this.sendHtml(
        clientEmail,
        `Pedido #${idShort} cancelado — Big Boys Gym`,
        this.wrapHtml(inner),
        false,
      );
      return;
    }

    const isShipped = status === 'SHIPPED';
    const subject = isShipped
      ? `Tu pedido #${idShort} fue enviado 📦`
      : `Tu pedido #${idShort} fue entregado ✅`;
    const title = isShipped ? 'Tu pedido va en camino' : 'Tu pedido fue entregado';
    const body = isShipped
      ? 'Ya despachamos tu pedido. Pronto deberías recibirlo según el método de envío acordado.'
      : 'Registramos la entrega de tu pedido. ¡Gracias por comprar en Big Boys Gym!';

    const inner = `
<p style="margin:0 0 16px;font-size:18px;font-weight:700;color:${BRAND_YELLOW};">${this.escape(title)}</p>
<p style="margin:0 0 12px;line-height:1.5;">Hola${order.user.name ? ` ${this.escape(order.user.name)}` : ''},</p>
<p style="margin:0 0 12px;line-height:1.5;">${this.escape(body)}</p>
<p style="margin:0;font-size:13px;color:#a1a1aa;">Pedido <strong style="color:${BRAND_YELLOW};">#${idShort}</strong> · Total ${this.formatCop(this.orderTotal(order))}</p>
<p style="margin:20px 0 0;"><a href="${this.escape(misPedidosUrl)}" style="display:inline-block;padding:12px 24px;background:${BRAND_RED};color:#fff;text-decoration:none;font-weight:700;border-radius:4px;">Ver mis pedidos →</a></p>
`;

    await this.sendHtml(clientEmail, subject, this.wrapHtml(inner), false);
  }

  /** Factura detallada al correo del cliente (to = user.email del payload, ya resuelto en OrdersService). */
  async sendInvoice(order: InvoiceMailOrder): Promise<void> {
    const clientEmail = order.user.email?.trim();
    if (!clientEmail) {
      throw new BadRequestException('El pedido no tiene email destino');
    }

    const idShort = order.id.replace(/-/g, '').slice(0, 8);
    const subject = `Factura de tu pedido #${idShort} - Big Boys Gym`;
    const fecha = new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(order.createdAt);

    const inner = `
<p style="margin:0 0 8px;font-size:22px;font-weight:800;letter-spacing:0.08em;color:${BRAND_YELLOW};text-transform:uppercase;">FACTURA</p>
<p style="margin:0 0 20px;font-size:13px;color:#a1a1aa;">Tienda oficial · Manizales</p>
<p style="margin:0 0 6px;"><strong style="color:${BRAND_YELLOW};">Pedido:</strong> <span style="color:${TEXT};">#${this.escape(idShort)}</span></p>
<p style="margin:0 0 6px;"><strong style="color:${BRAND_YELLOW};">Fecha:</strong> <span style="color:${TEXT};">${this.escape(fecha)}</span></p>
<p style="margin:0 0 6px;"><strong style="color:${BRAND_YELLOW};">Estado:</strong> <span style="color:${TEXT};">${this.escape(this.invoiceStatusLabel(order.status))}</span></p>
<p style="margin:0 0 6px;"><strong style="color:${BRAND_YELLOW};">Cliente:</strong> <span style="color:${TEXT};">${this.escape(order.user.name || '—')}</span></p>
<p style="margin:0 0 20px;"><strong style="color:${BRAND_YELLOW};">Email:</strong> <span style="color:${TEXT};">${this.escape(clientEmail)}</span></p>
<p style="margin:0 0 12px;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;color:${BRAND_YELLOW};">Productos</p>
${this.invoiceItemsTable(order)}
<p style="margin:20px 0 0;font-size:16px;font-weight:700;color:${BRAND_YELLOW};text-align:right;">Total: ${this.formatCop(order.total)}</p>
<p style="margin:12px 0 0;font-size:13px;color:#a1a1aa;text-align:right;">Método de pago: ${this.escape(this.paymentLabel(order.paymentMethod))}</p>
`;

    const html = this.wrapHtml(inner);
    await this.sendHtml(clientEmail, subject, html, true);
  }
}
