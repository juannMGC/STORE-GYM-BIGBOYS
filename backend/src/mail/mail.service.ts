import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
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

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null;

  constructor() {
    const key = process.env.RESEND_API_KEY?.trim();
    this.resend = key ? new Resend(key) : null;
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

  private async sendHtml(to: string, subject: string, html: string): Promise<void> {
    const from = process.env.MAIL_FROM?.trim();
    if (!from) {
      this.logger.warn('MAIL_FROM no definido; email omitido.');
      return;
    }
    if (!this.resend) {
      this.logger.warn('RESEND_API_KEY no definido; email omitido.');
      return;
    }
    const { error } = await this.resend.emails.send({ from, to, subject, html });
    if (error) {
      this.logger.error(`Resend error (${to}): ${JSON.stringify(error)}`);
    }
  }

  /** Pedido confirmado (PENDING manual o PAID): cliente + admin. */
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
    );

    const adminTo =
      process.env.MAIL_ADMIN_TO?.trim() ||
      process.env.ADMIN_EMAIL?.trim() ||
      process.env.ADMIN_ORDER_EMAIL?.trim();
    if (!adminTo) {
      this.logger.warn('MAIL_ADMIN_TO / ADMIN_EMAIL no definido; email admin omitido.');
      return;
    }

    const adminInner = `
<p style="margin:0 0 16px;font-size:18px;font-weight:700;color:${BRAND_YELLOW};">Nuevo pedido #${idShort}</p>
<p style="margin:0 0 8px;"><strong>Cliente:</strong> ${this.escape(order.user.email)}${order.user.name ? ` · ${this.escape(order.user.name)}` : ''}</p>
<p style="margin:0 0 16px;"><strong>Método de pago:</strong> ${this.escape(this.paymentLabel(order.paymentMethod))}</p>
<p style="margin:0 0 8px;font-size:12px;color:#a1a1aa;">ID: ${this.escape(order.id)}</p>
${this.itemsTable(order)}
<p style="margin:16px 0 0;font-size:16px;font-weight:700;">Total: ${this.formatCop(total)}</p>
`;

    await this.sendHtml(
      adminTo,
      `Nuevo pedido #${idShort} — Big Boys Gym`,
      this.wrapHtml(adminInner),
    );
  }

  /** Admin cambió estado a enviado o entregado. */
  async sendEstadoActualizadoCliente(
    order: OrderMailPayload,
    status: 'SHIPPED' | 'DELIVERED',
  ): Promise<void> {
    const clientEmail = order.user.email;
    if (!clientEmail) return;

    const idShort = order.id.slice(0, 8);
    const isShipped = status === 'SHIPPED';
    const subject = isShipped
      ? `Tu pedido #${idShort} fue enviado 📦`
      : `Tu pedido #${idShort} fue entregado ✅`;
    const title = isShipped
      ? 'Tu pedido va en camino'
      : 'Tu pedido fue entregado';
    const body = isShipped
      ? 'Ya despachamos tu pedido. Pronto deberías recibirlo según el método de envío acordado.'
      : 'Registramos la entrega de tu pedido. ¡Gracias por comprar en Big Boys Gym!';

    const inner = `
<p style="margin:0 0 16px;font-size:18px;font-weight:700;color:${BRAND_YELLOW};">${this.escape(title)}</p>
<p style="margin:0 0 12px;line-height:1.5;">Hola${order.user.name ? ` ${this.escape(order.user.name)}` : ''},</p>
<p style="margin:0 0 12px;line-height:1.5;">${this.escape(body)}</p>
<p style="margin:0;font-size:13px;color:#a1a1aa;">Pedido <strong style="color:${BRAND_YELLOW};">#${idShort}</strong> · Total ${this.formatCop(this.orderTotal(order))}</p>
`;

    await this.sendHtml(clientEmail, subject, this.wrapHtml(inner));
  }

  /** Factura detallada al correo del cliente. */
  async sendInvoice(order: InvoiceMailOrder): Promise<void> {
    const from = process.env.MAIL_FROM?.trim();
    if (!from) {
      throw new BadRequestException('Envío de correo no configurado (MAIL_FROM)');
    }
    if (!this.resend) {
      throw new BadRequestException('Envío de correo no configurado (RESEND_API_KEY)');
    }
    const clientEmail = order.user.email?.trim();
    if (!clientEmail) {
      throw new BadRequestException('El pedido no tiene email de cliente');
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
    const { error } = await this.resend.emails.send({
      from,
      to: clientEmail,
      subject,
      html,
    });
    if (error) {
      this.logger.error(`Resend invoice (${clientEmail}): ${JSON.stringify(error)}`);
      throw new BadRequestException('No se pudo enviar la factura por correo');
    }
  }
}
