import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  OrderStatus,
  type OrderStatusValue,
} from '../common/constants/order-status';
import { assertAdminStatusTransition, assertClientConfirm } from './order-transitions';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { PatchCartItemDto } from './dto/patch-cart-item.dto';
import { PatchPaymentDto } from './dto/patch-payment.dto';
import { AdminUpdateOrderStatusDto } from './dto/admin-update-order-status.dto';

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

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { userId, status: OrderStatus.DRAFT },
      orderBy: { updatedAt: 'desc' },
      include: orderInclude,
    });
    return order;
  }

  private async getOrCreateDraftOrder(userId: string) {
    let order = await this.prisma.order.findFirst({
      where: { userId, status: OrderStatus.DRAFT },
      orderBy: { updatedAt: 'desc' },
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
      orderBy: { updatedAt: 'desc' },
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

  async confirmCart(userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { userId, status: OrderStatus.DRAFT },
      orderBy: { updatedAt: 'desc' },
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
    return this.prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PENDING },
      include: orderInclude,
    });
  }

  findAllAdmin(status?: string) {
    return this.prisma.order.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, title: true } },
            size: true,
          },
        },
      },
    });
  }

  async findOneAdmin(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, role: true } },
        items: {
          include: {
            product: true,
            size: true,
          },
        },
      },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    return order;
  }

  async adminUpdateStatus(id: string, dto: AdminUpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    const from = order.status as Parameters<typeof assertAdminStatusTransition>[0];
    assertAdminStatusTransition(from, dto.status);
    return this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
      include: {
        user: { select: { id: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, title: true } },
            size: true,
          },
        },
      },
    });
  }
}
