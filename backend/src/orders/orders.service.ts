import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  OrderStatus,
  ORDER_STATUS_VALUES,
  type OrderStatusValue,
} from '../common/constants/order-status';
import { assertClientConfirm, assertPatchOrderStatusTransition } from './order-transitions';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { AddOrderItemDto } from './dto/add-order-item.dto';
import { PatchCartItemDto } from './dto/patch-cart-item.dto';
import { PatchPaymentDto } from './dto/patch-payment.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { UpdateShippingDto } from './dto/update-shipping.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { WompiSignatureDto } from './dto/wompi-signature.dto';
import { Role } from '../common/constants/roles';
import { MailService, type InvoiceMailOrder, type OrderMailPayload } from '../mail/mail.service';

export function orderTotalAmountInCents(order: {
  items: { priceSnapshot: number; quantity: number }[];
}): number {
  const total = order.items.reduce((s, i) => s + i.priceSnapshot * i.quantity, 0);
  return Math.round(total * 100);
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
} as const;

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
  ) {}

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

  /**
   * Carrito activo: el borrador DRAFT más reciente del usuario, o uno nuevo vacío.
   * Tras confirmar/pagar, el pedido deja de ser DRAFT y la siguiente operación obtiene un borrador nuevo.
   */
  async getOrCreateCart(userId: string) {
    const existing = await this.prisma.order.findFirst({
      where: { userId, status: OrderStatus.DRAFT },
      orderBy: { createdAt: 'desc' },
      include: orderInclude,
    });
    if (existing) return existing;
    return this.prisma.order.create({
      data: { userId, status: OrderStatus.DRAFT },
      include: orderInclude,
    });
  }

  async getCart(userId: string) {
    return this.getOrCreateCart(userId);
  }

  private async getOrCreateDraftOrder(userId: string) {
    let order = await this.prisma.order.findFirst({
      where: { userId, status: OrderStatus.DRAFT },
      orderBy: { createdAt: 'desc' },
    });
    if (!order) {
      order = await this.prisma.order.create({
        data: { userId, status: OrderStatus.DRAFT },
      });
    }
    return order;
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

    return this.getCart(userId);
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
      return this.getCart(userId);
    }
    await this.prisma.orderItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });
    return this.getCart(userId);
  }

  async removeCartItem(userId: string, itemId: string) {
    const item = await this.prisma.orderItem.findUnique({
      where: { id: itemId },
      include: { order: true },
    });
    if (!item) throw new NotFoundException('Línea no encontrada');
    await this.assertDraftOwned(item.orderId, userId);
    await this.prisma.orderItem.delete({ where: { id: itemId } });
    return this.getCart(userId);
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

    return this.prisma.order.update({
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
      include: orderInclude,
    });
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

  async buildWompiSignature(
    userId: string,
    orderId: string,
    dto: WompiSignatureDto,
  ): Promise<{
    signature: string;
    publicKey: string;
    reference: string;
    amountInCents: number;
    currency: 'COP';
  }> {
    if (dto.reference !== orderId) {
      throw new BadRequestException('reference debe coincidir con el pedido');
    }
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
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
    const expected = orderTotalAmountInCents(order);
    if (dto.amountInCents !== expected) {
      throw new BadRequestException('El monto no coincide con el total del pedido');
    }
    const integrityKey = process.env.WOMPI_INTEGRITY_KEY?.trim();
    const publicKey = process.env.WOMPI_PUBLIC_KEY?.trim();
    if (!integrityKey || !publicKey) {
      throw new BadRequestException('Wompi no está configurado (WOMPI_INTEGRITY_KEY / WOMPI_PUBLIC_KEY)');
    }
    const raw = `${dto.reference}${dto.amountInCents}${dto.currency}${integrityKey}`;
    const signature = createHash('sha256').update(raw, 'utf8').digest('hex');
    return {
      signature,
      publicKey,
      reference: dto.reference,
      amountInCents: dto.amountInCents,
      currency: 'COP',
    };
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
      include: { items: true },
    });
    if (!order) {
      return { ok: false, detail: 'order_not_found' };
    }
    const expected = orderTotalAmountInCents(order);
    if (amountInCents !== expected) {
      return { ok: false, detail: 'amount_mismatch' };
    }
    if (transactionStatus === 'APPROVED') {
      if (order.status !== OrderStatus.DRAFT) {
        return { ok: true, detail: 'already_final' };
      }
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PAID },
      });
      const forMail = await this.loadOrderForMail(order.id);
      if (forMail) {
        void this.mailService.sendPedidoConfirmado(forMail).catch((err: unknown) => {
          this.logger.error(`Email pedido confirmado (Wompi): ${String(err)}`);
        });
      }
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
      return { ok: true };
    }
    return { ok: true, detail: 'ignored_status' };
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
    if (order.items.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }
    if (!order.paymentMethod) {
      throw new BadRequestException(
        'Debe elegir forma de pago antes de confirmar',
      );
    }
    assertClientConfirm(order.status as OrderStatusValue);
    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PENDING },
      include: orderInclude,
    });
    const forMail = await this.loadOrderForMail(order.id);
    if (forMail) {
      void this.mailService.sendPedidoConfirmado(forMail).catch((err: unknown) => {
        this.logger.error(`Email pedido confirmado (carrito): ${String(err)}`);
      });
    }
    return updated;
  }

  findAllAdmin(status?: string) {
    const s = status?.trim();
    return this.prisma.order.findMany({
      where: s ? { status: s } : {},
      orderBy: { createdAt: 'desc' },
      include: orderAdminDetailInclude,
    });
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
   * Normaliza el body del PATCH: CONFIRMED → PAID (valor en Prisma).
   */
  private normalizePatchStatusToPrisma(status: string): OrderStatusValue {
    if (status === 'CONFIRMED') {
      return OrderStatus.PAID;
    }
    const v = status as OrderStatusValue;
    if (!ORDER_STATUS_VALUES.includes(v)) {
      throw new BadRequestException('Estado inválido');
    }
    return v;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }
    const from = order.status as OrderStatusValue;
    const to = this.normalizePatchStatusToPrisma(dto.status);
    assertPatchOrderStatusTransition(from, to);
    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: to },
      include: orderAdminDetailInclude,
    });
    if (to === OrderStatus.SHIPPED || to === OrderStatus.DELIVERED) {
      void this.mailService
        .sendEstadoActualizadoCliente(updated as OrderMailPayload, to)
        .catch((err: unknown) => {
          this.logger.error(`Email estado pedido: ${String(err)}`);
        });
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
      user: {
        name: order.user.name,
        email: order.user.email,
      },
      items,
      total,
    };
  }

  /** Envía factura por email al cliente (dueño o ADMIN). */
  async sendInvoiceEmail(
    orderId: string,
    requesterUserId: string,
    requesterRole: string,
  ): Promise<{ ok: true; email: string }> {
    const detail = await this.getInvoiceDetail(
      orderId,
      requesterUserId,
      requesterRole,
    );
    const payload: InvoiceMailOrder = {
      id: detail.id,
      status: detail.status,
      createdAt: new Date(detail.createdAt),
      paymentMethod: detail.paymentMethod,
      user: {
        name: detail.user.name,
        email: detail.user.email,
      },
      items: detail.items.map((i) => ({
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        product: {
          name: i.product.name,
          imageUrl: i.product.imageUrl,
        },
        size: i.size,
      })),
      total: detail.total,
    };
    await this.mailService.sendInvoice(payload);
    return { ok: true, email: detail.user.email };
  }
}
