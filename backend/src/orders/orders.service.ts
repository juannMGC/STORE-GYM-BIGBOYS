import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  OrderStatus,
  ORDER_STATUS_VALUES,
  type OrderStatusValue,
} from '../common/constants/order-status';
import {
  assertClientConfirm,
  assertPatchOrderStatusTransition,
  coerceOrderStatusFromDb,
} from './order-transitions';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { AddOrderItemDto } from './dto/add-order-item.dto';
import { PatchCartItemDto } from './dto/patch-cart-item.dto';
import { PatchPaymentDto } from './dto/patch-payment.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { UpdateShippingDto } from './dto/update-shipping.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Role } from '../common/constants/roles';
import { verifyWompiEventChecksum } from '../wompi/wompi-event-verify';
import { MailService, type OrderMailPayload } from '../mail/mail.service';
import { CouponsService } from '../coupons/coupons.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { OrderItem, Prisma } from '@prisma/client';

export function orderTotalAmountInCents(order: {
  items: { priceSnapshot: number; quantity: number }[];
  discountAmount?: number | null;
}): number {
  const gross = order.items.reduce((s, i) => s + i.priceSnapshot * i.quantity, 0);
  const disc = Math.max(0, Number(order.discountAmount ?? 0));
  return Math.round(Math.max(0, gross - disc) * 100);
}

const orderInclude = {
  items: {
    include: {
      product: {
        include: {
          images: { orderBy: { sortOrder: 'asc' as const }, take: 1 },
        },
      },
      size: true,
    },
  },
  coupon: { select: { id: true, code: true, type: true, value: true } },
} as const;

/** Incluye envío y pago para plantillas HTML (MailService). */
const orderIncludeMail = {
  user: { select: { email: true, name: true } },
  items: {
    include: {
      product: { select: { title: true } },
      size: true,
    },
  },
} as const;

/** Detalle admin / listado enriquecido (cliente + ítems con imagen). */
const orderAdminDetailInclude = {
  user: { select: { id: true, email: true, name: true } },
  items: {
    include: {
      product: {
        select: {
          id: true,
          title: true,
          images: {
            orderBy: { sortOrder: 'asc' as const },
            take: 1,
            select: { url: true },
          },
        },
      },
      size: true,
    },
  },
} as const;

/** Snapshot completo antes de archivar (DELETE admin). */
const orderArchiveInclude = {
  user: true,
  items: {
    include: {
      product: true,
      size: true,
    },
  },
} as const;

/** Detalle unificado GET /orders/:id (dueño o ADMIN): ítems con precio catálogo + snapshot. */
const orderDetailViewerInclude = {
  user: { select: { id: true, name: true, email: true } },
  items: {
    include: {
      product: {
        select: {
          id: true,
          title: true,
          price: true,
          images: {
            orderBy: { sortOrder: 'asc' as const },
            take: 1,
            select: { url: true },
          },
        },
      },
      size: { select: { id: true, name: true } },
    },
  },
} as const;

const invoiceOrderInclude = {
  user: { select: { id: true, email: true, name: true } },
  items: {
    include: {
      product: {
        select: {
          title: true,
          slug: true,
          images: {
            orderBy: { sortOrder: 'asc' as const },
            take: 1,
            select: { url: true },
          },
        },
      },
      size: { select: { name: true } },
    },
  },
} as const;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly couponsService: CouponsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private getFrontendUrl(): string {
    return (
      process.env.FRONTEND_URL?.trim() ?? 'https://store-gym-bigboys.vercel.app'
    );
  }

  /** Suma cantidades del mismo producto en el pedido (todas las tallas). */
  private async totalQuantityForProductInOrder(
    orderId: string,
    productId: string,
  ): Promise<number> {
    const rows = await this.prisma.orderItem.findMany({
      where: { orderId, productId },
      select: { quantity: true },
    });
    return rows.reduce((s, r) => s + r.quantity, 0);
  }

  private async deductStockForItemsTx(
    tx: Prisma.TransactionClient,
    items: Pick<OrderItem, 'productId' | 'quantity'>[],
  ): Promise<void> {
    for (const item of items) {
      const result = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (result.count !== 1) {
        const p = await tx.product.findUnique({ where: { id: item.productId } });
        throw new BadRequestException(
          `Stock insuficiente para "${p?.title ?? 'el producto'}". Disponible: ${p?.stock ?? 0}`,
        );
      }
    }
  }

  private async restoreStockForItemsTx(
    tx: Prisma.TransactionClient,
    items: Pick<OrderItem, 'productId' | 'quantity'>[],
  ): Promise<void> {
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
  }

  private mapToOrderDetailDto(order: {
    id: string;
    status: string;
    paymentMethod: string | null;
    createdAt: Date;
    shippingEmail: string | null;
    shippingDepartment: string | null;
    shippingCity: string | null;
    shippingNeighborhood: string | null;
    shippingAddress: string | null;
    shippingComplement: string | null;
    user: { id: string; name: string | null; email: string };
    items: Array<{
      id: string;
      quantity: number;
      priceSnapshot: number;
      product: {
        id: string;
        title: string;
        price: number;
        images: { url: string }[];
      };
      size: { id: string; name: string } | null;
    }>;
  }) {
    return {
      id: order.id,
      status: order.status,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt.toISOString(),
      shippingEmail: order.shippingEmail,
      shippingDepartment: order.shippingDepartment,
      shippingCity: order.shippingCity,
      shippingNeighborhood: order.shippingNeighborhood,
      shippingAddress: order.shippingAddress,
      shippingComplement: order.shippingComplement,
      user: {
        id: order.user.id,
        name: order.user.name,
        email: order.user.email,
      },
      items: order.items.map((i) => ({
        id: i.id,
        quantity: i.quantity,
        unitPrice: i.priceSnapshot,
        product: {
          id: i.product.id,
          name: i.product.title,
          imageUrl: i.product.images[0]?.url?.trim() ?? null,
          price: i.product.price,
        },
        size: i.size ? { id: i.size.id, name: i.size.name } : null,
      })),
    };
  }

  async getOrderDetailDtoById(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: orderDetailViewerInclude,
    });
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }
    return this.mapToOrderDetailDto(order);
  }

  /** Dueño del pedido o ADMIN. */
  async getOrderByIdForViewer(orderId: string, requesterUserId: string, requesterRole: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: orderDetailViewerInclude,
    });
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }
    if (requesterRole !== Role.ADMIN && order.userId !== requesterUserId) {
      throw new ForbiddenException();
    }
    return this.mapToOrderDetailDto(order);
  }

  private async loadOrderForMail(orderId: string): Promise<OrderMailPayload | null> {
    const o = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: orderIncludeMail,
    });
    return o as OrderMailPayload | null;
  }

  /** Borrador DRAFT más reciente del usuario, o null (no crea fila). */
  private async findActiveDraftOrder(userId: string) {
    return this.prisma.order.findFirst({
      where: { userId, status: OrderStatus.DRAFT },
      orderBy: { createdAt: 'desc' },
      include: orderInclude,
    });
  }

  /**
   * GET carrito: solo lectura. Sin DRAFT → { items: [], total: 0 } (no se crea pedido vacío).
   */
  async getCartPayload(userId: string) {
    const draft = await this.findActiveDraftOrder(userId);
    if (!draft) {
      return { items: [], total: 0 } as const;
    }
    return draft;
  }

  /** Crea DRAFT solo al añadir ítems u otras mutaciones que lo requieran. */
  private async getOrCreateDraftOrder(userId: string) {
    let row = await this.prisma.order.findFirst({
      where: { userId, status: OrderStatus.DRAFT },
      orderBy: { createdAt: 'desc' },
    });
    if (!row) {
      row = await this.prisma.order.create({
        data: { userId, status: OrderStatus.DRAFT },
      });
    }
    return row;
  }

  private async assertDraftOwned(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    if (order.userId !== userId) throw new ForbiddenException();
    if (order.status !== OrderStatus.DRAFT) {
      throw new BadRequestException('El carrito ya no es editable');
    }
    return order;
  }

  async addCartItem(userId: string, dto: AddCartItemDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { sizes: true },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    if (product.stock <= 0) {
      throw new BadRequestException('Este producto está agotado');
    }
    const hasSizes = product.sizes.length > 0;
    if (hasSizes && !dto.sizeId) {
      throw new BadRequestException('Debe elegir una talla para este producto');
    }
    if (!hasSizes && dto.sizeId) {
      throw new BadRequestException('Este producto no tiene tallas');
    }
    if (dto.sizeId) {
      const ok = product.sizes.some((ps) => ps.sizeId === dto.sizeId);
      if (!ok) throw new BadRequestException('Talla no válida para este producto');
    }

    const order = await this.getOrCreateDraftOrder(userId);
    await this.assertDraftOwned(order.id, userId);

    const sizeKey = dto.sizeId ?? null;
    const existing = await this.prisma.orderItem.findFirst({
      where: {
        orderId: order.id,
        productId: dto.productId,
        sizeId: sizeKey,
      },
    });

    const qtyTotalSameProduct = await this.totalQuantityForProductInOrder(
      order.id,
      dto.productId,
    );
    const qtyAfter = qtyTotalSameProduct + dto.quantity;
    if (qtyAfter > product.stock) {
      throw new BadRequestException(
        `Stock insuficiente. Solo quedan ${product.stock} unidades.`,
      );
    }

    const priceSnapshot = product.price;
    if (existing) {
      await this.prisma.orderItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + dto.quantity },
      });
    } else {
      await this.prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: dto.productId,
          sizeId: sizeKey,
          quantity: dto.quantity,
          priceSnapshot,
        },
      });
    }

    return this.findActiveDraftOrder(userId)!;
  }

  async patchCartItem(
    userId: string,
    itemId: string,
    dto: PatchCartItemDto,
  ) {
    const item = await this.prisma.orderItem.findUnique({
      where: { id: itemId },
      include: { order: true },
    });
    if (!item) throw new NotFoundException('Línea no encontrada');
    await this.assertDraftOwned(item.orderId, userId);
    if (dto.quantity === 0) {
      await this.prisma.orderItem.delete({ where: { id: itemId } });
      return this.findActiveDraftOrder(userId)!;
    }
    const product = await this.prisma.product.findUnique({
      where: { id: item.productId },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    if (product.stock <= 0) {
      throw new BadRequestException('Este producto está agotado');
    }
    const totalSameProduct = await this.totalQuantityForProductInOrder(
      item.orderId,
      item.productId,
    );
    const qtyAfter = totalSameProduct - item.quantity + dto.quantity;
    if (qtyAfter > product.stock) {
      throw new BadRequestException(
        `Stock insuficiente. Solo quedan ${product.stock} unidades.`,
      );
    }
    await this.prisma.orderItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });
    return this.findActiveDraftOrder(userId)!;
  }

  async removeCartItem(userId: string, itemId: string) {
    const item = await this.prisma.orderItem.findUnique({
      where: { id: itemId },
      include: { order: true },
    });
    if (!item) throw new NotFoundException('Línea no encontrada');
    await this.assertDraftOwned(item.orderId, userId);
    await this.prisma.orderItem.delete({ where: { id: itemId } });
    return this.findActiveDraftOrder(userId)!;
  }

  async patchPayment(userId: string, dto: PatchPaymentDto) {
    const order = await this.prisma.order.findFirst({
      where: { userId, status: OrderStatus.DRAFT },
      orderBy: { createdAt: 'desc' },
    });
    if (!order) {
      throw new BadRequestException('No hay carrito activo');
    }
    await this.assertDraftOwned(order.id, userId);
    return this.prisma.order.update({
      where: { id: order.id },
      data: { paymentMethod: dto.paymentMethod },
      include: orderInclude,
    });
  }

  /** Datos de envío del carrito (DRAFT); solo el dueño del pedido. */
  async updateShipping(
    orderId: string,
    userId: string,
    role: string,
    dto: UpdateShippingDto,
  ) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    const isAdmin = role === Role.ADMIN;
    if (!isAdmin && order.userId !== userId) throw new ForbiddenException();
    if (!isAdmin && order.status !== OrderStatus.DRAFT) {
      throw new BadRequestException('Solo podés actualizar envío del carrito abierto');
    }

    const trimOrNull = (v: string | undefined): string | null | undefined => {
      if (v === undefined) return undefined;
      const t = v.trim();
      return t === '' ? null : t;
    };

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        ...(dto.shippingEmail !== undefined
          ? { shippingEmail: trimOrNull(dto.shippingEmail) }
          : {}),
        ...(dto.shippingDepartment !== undefined
          ? { shippingDepartment: trimOrNull(dto.shippingDepartment) }
          : {}),
        ...(dto.shippingCity !== undefined
          ? { shippingCity: trimOrNull(dto.shippingCity) }
          : {}),
        ...(dto.shippingNeighborhood !== undefined
          ? { shippingNeighborhood: trimOrNull(dto.shippingNeighborhood) }
          : {}),
        ...(dto.shippingAddress !== undefined
          ? { shippingAddress: trimOrNull(dto.shippingAddress) }
          : {}),
        ...(dto.shippingComplement !== undefined
          ? { shippingComplement: trimOrNull(dto.shippingComplement) }
          : {}),
      },
    });
    return this.getOrderDetailDtoById(orderId);
  }

  /** Pedidos del usuario (excluye carrito DRAFT), más recientes primero. */
  async getOrdersByUser(userId: string) {
    return this.prisma.order.findMany({
      where: {
        userId,
        status: { not: OrderStatus.DRAFT },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
                images: {
                  orderBy: { sortOrder: 'asc' as const },
                  take: 1,
                  select: { url: true },
                },
              },
            },
            size: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Firma de integridad y datos para checkout Wompi (sandbox/prod).
   * El monto se calcula solo en servidor (items × priceSnapshot).
   */
  async generateWompiSignature(orderId: string, userId: string): Promise<{
    signature: string;
    publicKey: string;
    reference: string;
    amountInCents: number;
    currency: 'COP';
    redirectUrl: string;
  }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, coupon: { select: { code: true } } },
    });
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }
    if (order.userId !== userId) {
      throw new ForbiddenException();
    }
    if (order.status !== OrderStatus.DRAFT) {
      throw new BadRequestException('Solo se puede pagar un pedido en borrador');
    }
    if (order.items.length === 0) {
      throw new BadRequestException('El pedido no tiene ítems');
    }
    if (order.couponId && order.coupon) {
      const gross = order.items.reduce((s, i) => s + i.priceSnapshot * i.quantity, 0);
      const v = await this.couponsService.validateCoupon(order.coupon.code, gross);
      if (v.discountAmount !== Math.round(order.discountAmount ?? 0)) {
        throw new BadRequestException(
          'El descuento no coincide con el total actual. Volvé a aplicar el cupón.',
        );
      }
    }
    const amountInCents = orderTotalAmountInCents(order);
    if (amountInCents < 1) {
      throw new BadRequestException('El total debe ser mayor a 0.');
    }
    const currency = 'COP' as const;
    const reference = orderId;
    const integrityKey = process.env.WOMPI_INTEGRITY_KEY?.trim();
    const publicKey = process.env.WOMPI_PUBLIC_KEY?.trim();
    if (!integrityKey || !publicKey) {
      throw new BadRequestException('Wompi no está configurado (WOMPI_INTEGRITY_KEY / WOMPI_PUBLIC_KEY)');
    }
    const raw = `${reference}${amountInCents}${currency}${integrityKey}`;
    const signature = createHash('sha256').update(raw, 'utf8').digest('hex');
    const base =
      process.env.FRONTEND_URL?.trim() ||
      process.env.CORS_ORIGIN?.trim()?.split(',')[0]?.trim() ||
      'http://localhost:3000';
    const origin = base.replace(/\/$/, '');
    const redirectUrl = `${origin}/pedido/confirmado?reference=${encodeURIComponent(reference)}`;
    return {
      signature,
      publicKey,
      reference,
      amountInCents,
      currency,
      redirectUrl,
    };
  }

  /**
   * Webhook Wompi (eventos firmados según docs: signature.properties + timestamp + events key).
   */
  async handleWompiWebhook(body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const secret = process.env.WOMPI_EVENTS_KEY?.trim();
    if (!secret) {
      throw new ServiceUnavailableException('WOMPI_EVENTS_KEY no configurada');
    }
    if (!verifyWompiEventChecksum(body, secret)) {
      throw new ForbiddenException('Firma de evento inválida');
    }

    const event = body.event as string | undefined;
    if (event !== 'transaction.updated') {
      return { ok: true, ignored: true };
    }

    const data = body.data as
      | { transaction?: { reference?: string; status?: string; amount_in_cents?: number } }
      | undefined;
    const tx = data?.transaction;
    if (!tx?.reference || tx.status === undefined) {
      return { ok: true };
    }

    const amount = Number(tx.amount_in_cents ?? 0);
    return this.applyWompiTransaction(tx.reference, String(tx.status), amount);
  }

  /**
   * Webhook Wompi: actualiza estado según resultado de la transacción (referencia = order.id).
   */
  async applyWompiTransaction(
    reference: string,
    transactionStatus: string,
    amountInCents: number,
  ): Promise<{ ok: boolean; detail?: string }> {
    const order = await this.prisma.order.findUnique({
      where: { id: reference },
      include: { items: true, coupon: { select: { code: true } } },
    });
    if (!order) {
      return { ok: false, detail: 'order_not_found' };
    }
    if (order.couponId && order.coupon) {
      const gross = order.items.reduce((s, i) => s + i.priceSnapshot * i.quantity, 0);
      const v = await this.couponsService.validateCoupon(order.coupon.code, gross);
      if (v.discountAmount !== Math.round(order.discountAmount ?? 0)) {
        return { ok: false, detail: 'amount_mismatch' };
      }
    }
    const expected = orderTotalAmountInCents(order);
    if (amountInCents !== expected) {
      return { ok: false, detail: 'amount_mismatch' };
    }
    if (transactionStatus === 'APPROVED') {
      if (order.status !== OrderStatus.DRAFT) {
        return { ok: true, detail: 'already_final' };
      }
      // PAID = pago confirmado (UI “Confirmado”; el admin también acepta CONFIRMED→PAID en PATCH).
      await this.prisma.$transaction(async (tx) => {
        await this.deductStockForItemsTx(tx, order.items);
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.PAID },
        });
        if (order.couponId) {
          await tx.coupon.update({
            where: { id: order.couponId },
            data: { usedCount: { increment: 1 } },
          });
        }
      });
      const forMail = await this.loadOrderForMail(order.id);
      if (forMail) {
        void Promise.all([
          this.mailService.sendOrderConfirmation(forMail),
          this.mailService.sendNewOrderToAdmin(forMail),
        ]).catch((err: unknown) => {
          this.logger.error(`Email pedido confirmado (Wompi): ${String(err)}`);
        });
      }
      void this.notificationsService
        .notifyOrderStatus(
          order.userId,
          order.id,
          OrderStatus.PAID,
          this.getFrontendUrl(),
        )
        .catch(() => {});
      return { ok: true };
    }
    if (
      transactionStatus === 'DECLINED' ||
      transactionStatus === 'VOIDED' ||
      transactionStatus === 'ERROR'
    ) {
      if (order.status !== OrderStatus.DRAFT) {
        return { ok: true, detail: 'already_final' };
      }
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CANCELLED },
      });
      void this.notificationsService
        .notifyOrderStatus(
          order.userId,
          order.id,
          OrderStatus.CANCELLED,
          this.getFrontendUrl(),
        )
        .catch(() => {});
      return { ok: true };
    }
    return { ok: true, detail: 'ignored_status' };
  }

  async confirmOrderById(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, coupon: { select: { code: true } } },
    });
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }
    if (order.userId !== userId) {
      throw new ForbiddenException();
    }
    if (order.status !== OrderStatus.DRAFT) {
      throw new BadRequestException('Este pedido ya fue confirmado');
    }
    if (order.items.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }
    if (!order.paymentMethod) {
      throw new BadRequestException(
        'Debe elegir forma de pago antes de confirmar',
      );
    }
    assertClientConfirm(order.status as OrderStatusValue);
    if (order.couponId && order.coupon) {
      const gross = order.items.reduce((s, i) => s + i.priceSnapshot * i.quantity, 0);
      const v = await this.couponsService.validateCoupon(order.coupon.code, gross);
      if (v.discountAmount !== Math.round(order.discountAmount ?? 0)) {
        throw new BadRequestException(
          'El descuento no coincide con el total actual. Volvé a aplicar el cupón.',
        );
      }
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      await this.deductStockForItemsTx(tx, order.items);
      const row = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAID },
        include: orderInclude,
      });
      if (order.couponId) {
        await tx.coupon.update({
          where: { id: order.couponId },
          data: { usedCount: { increment: 1 } },
        });
      }
      return row;
    });
    const mailPayload = await this.loadOrderForMail(orderId);
    if (mailPayload) {
      void Promise.all([
        this.mailService.sendOrderConfirmation(mailPayload),
        this.mailService.sendNewOrderToAdmin(mailPayload),
      ]).catch((err: unknown) =>
        this.logger.error(`Error enviando emails de confirmación: ${String(err)}`),
      );
    }
    void this.notificationsService
      .notifyOrderStatus(
        order.userId,
        orderId,
        OrderStatus.PAID,
        this.getFrontendUrl(),
      )
      .catch(() => {});
    return updated;
  }

  async confirmCart(userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { userId, status: OrderStatus.DRAFT },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
    if (!order) {
      throw new BadRequestException('No hay carrito para confirmar');
    }
    return this.confirmOrderById(order.id, userId);
  }

  findAllAdmin(status?: string) {
    const s = status?.trim();
    return this.prisma.order.findMany({
      where: s
        ? { status: s }
        : { status: { not: OrderStatus.DRAFT } },
      orderBy: { createdAt: 'desc' },
      include: orderAdminDetailInclude,
    });
  }

  async listOrderHistory() {
    return this.prisma.orderHistory.findMany({
      orderBy: { deletedAt: 'desc' },
    });
  }

  async archiveOrder(
    orderId: string,
    adminEmail: string,
    reason?: string,
  ): Promise<{ ok: boolean; message: string }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: orderArchiveInclude,
    });
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }
    if (
      order.status !== OrderStatus.DELIVERED &&
      order.status !== OrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Solo se pueden eliminar pedidos entregados o cancelados',
      );
    }

    const orderData = JSON.parse(
      JSON.stringify(order),
    ) as Prisma.InputJsonValue;

    await this.prisma.$transaction([
      this.prisma.orderHistory.create({
        data: {
          orderId: order.id,
          orderData,
          deletedBy: adminEmail,
          reason: reason?.trim() || 'Eliminado por administrador',
        },
      }),
      this.prisma.order.delete({ where: { id: orderId } }),
    ]);

    return {
      ok: true,
      message: 'Pedido archivado y eliminado correctamente',
    };
  }

  async adminUpdatePayment(orderId: string, dto: PatchPaymentDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    await this.prisma.order.update({
      where: { id: orderId },
      data: { paymentMethod: dto.paymentMethod },
    });
    return this.getOrderDetailDtoById(orderId);
  }

  async adminUpdateOrderItem(
    orderId: string,
    itemId: string,
    dto: UpdateOrderItemDto,
  ) {
    const item = await this.prisma.orderItem.findUnique({
      where: { id: itemId },
    });
    if (!item) throw new NotFoundException('Ítem no encontrado');
    if (item.orderId !== orderId) {
      throw new BadRequestException('El ítem no pertenece a este pedido');
    }
    await this.prisma.orderItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });
    return this.getOrderDetailDtoById(orderId);
  }

  async adminRemoveOrderItem(orderId: string, itemId: string) {
    const item = await this.prisma.orderItem.findUnique({
      where: { id: itemId },
    });
    if (!item) throw new NotFoundException('Ítem no encontrado');
    if (item.orderId !== orderId) {
      throw new BadRequestException('El ítem no pertenece a este pedido');
    }
    await this.prisma.orderItem.delete({ where: { id: itemId } });
    return this.getOrderDetailDtoById(orderId);
  }

  async adminAddOrderItem(orderId: string, dto: AddOrderItemDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Pedido no encontrado');

    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { sizes: true },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    const hasSizes = product.sizes.length > 0;
    if (hasSizes && !dto.sizeId) {
      throw new BadRequestException('Debe elegir una talla para este producto');
    }
    if (!hasSizes && dto.sizeId) {
      throw new BadRequestException('Este producto no tiene tallas');
    }
    if (dto.sizeId) {
      const ok = product.sizes.some((ps) => ps.sizeId === dto.sizeId);
      if (!ok) throw new BadRequestException('Talla no válida para este producto');
    }

    const sizeKey = dto.sizeId ?? null;
    const existing = await this.prisma.orderItem.findFirst({
      where: {
        orderId,
        productId: dto.productId,
        sizeId: sizeKey,
      },
    });
    const priceSnapshot = product.price;
    if (existing) {
      await this.prisma.orderItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + dto.quantity },
      });
    } else {
      await this.prisma.orderItem.create({
        data: {
          orderId,
          productId: dto.productId,
          sizeId: sizeKey,
          quantity: dto.quantity,
          priceSnapshot,
        },
      });
    }
    return this.getOrderDetailDtoById(orderId);
  }

  /**
   * Normaliza el body del PATCH: CONFIRMED / PENDING → PAID (valor en Prisma).
   */
  private normalizePatchStatusToPrisma(status: string): OrderStatusValue {
    const s = status.trim();
    if (s === 'CONFIRMED' || s === 'PENDING') {
      return OrderStatus.PAID;
    }
    const v = s as OrderStatusValue;
    if (!ORDER_STATUS_VALUES.includes(v)) {
      throw new BadRequestException('Estado inválido');
    }
    return v;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }
    const to = this.normalizePatchStatusToPrisma(dto.status);
    assertPatchOrderStatusTransition(order.status, to);
    const fromNorm = coerceOrderStatusFromDb(order.status);
    await this.prisma.$transaction(async (tx) => {
      if (
        to === OrderStatus.CANCELLED &&
        fromNorm !== OrderStatus.DRAFT &&
        fromNorm !== OrderStatus.CANCELLED
      ) {
        await this.restoreStockForItemsTx(tx, order.items);
      }
      await tx.order.update({
        where: { id },
        data: { status: to },
        include: orderAdminDetailInclude,
      });
    });

    const estadosNotificacionEstado: OrderStatusValue[] = [
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
    ];
    if (estadosNotificacionEstado.includes(to)) {
      const forMail = await this.loadOrderForMail(id);
      if (forMail) {
        void Promise.all([
          this.mailService.sendStatusUpdateToClient(forMail, to),
          this.mailService.sendStatusUpdateToAdmin(forMail, to),
        ]).catch((err: unknown) => {
          this.logger.error(`Error emails estado: ${String(err)}`);
        });
      }
    }

    const pushStatuses: OrderStatusValue[] = [
      OrderStatus.PAID,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
    ];
    if (pushStatuses.includes(to)) {
      void this.notificationsService
        .notifyOrderStatus(order.userId, id, to, this.getFrontendUrl())
        .catch(() => {});
    }

    return this.getOrderDetailDtoById(id);
  }

  private assertOrderInvoiceAccess(
    order: { userId: string },
    requesterUserId: string,
    requesterRole: string,
  ): void {
    if (order.userId !== requesterUserId && requesterRole !== Role.ADMIN) {
      throw new ForbiddenException();
    }
  }

  /** Factura JSON: dueño del pedido o ADMIN. */
  async getInvoiceDetail(
    orderId: string,
    requesterUserId: string,
    requesterRole: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: invoiceOrderInclude,
    });
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }
    this.assertOrderInvoiceAccess(order, requesterUserId, requesterRole);

    const items = order.items.map((i) => {
      const imageUrl = i.product.images[0]?.url?.trim() || null;
      return {
        id: i.id,
        quantity: i.quantity,
        unitPrice: i.priceSnapshot,
        product: {
          name: i.product.title,
          imageUrl,
          slug: i.product.slug,
        },
        size: i.size ? { name: i.size.name } : null,
      };
    });
    const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

    return {
      id: order.id,
      status: order.status,
      createdAt: order.createdAt,
      paymentMethod: order.paymentMethod,
      shippingEmail: order.shippingEmail,
      user: {
        name: order.user.name,
        email: order.user.email,
      },
      items,
      total,
    };
  }
}
