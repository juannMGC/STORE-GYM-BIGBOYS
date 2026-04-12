import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateCouponDto } from './dto/create-coupon.dto';

export type CouponValidationResult = {
  couponId: string;
  code: string;
  type: string;
  value: number;
  discountAmount: number;
  finalTotal: number;
  description: string;
};

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async validateCoupon(code: string, orderTotal: number): Promise<CouponValidationResult> {
    const normalized = code.toUpperCase().trim();
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: normalized },
    });

    if (!coupon) {
      throw new NotFoundException('Cupón no encontrado');
    }
    if (!coupon.active) {
      throw new BadRequestException('Este cupón no está activo');
    }
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new BadRequestException('Este cupón expiró');
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('Este cupón ya alcanzó su límite de usos');
    }
    if (orderTotal < coupon.minPurchase) {
      throw new BadRequestException(
        `Compra mínima para este cupón: $${coupon.minPurchase.toLocaleString('es-CO')}`,
      );
    }

    let discountAmount = 0;
    if (coupon.type === 'PERCENT') {
      discountAmount = (orderTotal * coupon.value) / 100;
    } else {
      discountAmount = Math.min(coupon.value, orderTotal);
    }

    discountAmount = Math.round(discountAmount);
    const finalTotal = Math.round(Math.max(0, orderTotal - discountAmount));

    const description =
      coupon.type === 'PERCENT'
        ? `${coupon.value}% de descuento`
        : `$${coupon.value.toLocaleString('es-CO')} de descuento`;

    return {
      couponId: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discountAmount,
      finalTotal,
      description,
    };
  }

  async applyCoupon(orderId: string, code: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) throw new NotFoundException('Pedido no encontrado');
    if (order.userId !== userId) throw new ForbiddenException();
    if (order.status !== 'DRAFT') {
      throw new BadRequestException('Solo podés aplicar cupones a pedidos en carrito');
    }

    const total = order.items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0);
    const validation = await this.validateCoupon(code, total);

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        couponId: validation.couponId,
        discountAmount: validation.discountAmount,
      },
      include: {
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
      },
    });

    return {
      ...validation,
      order: updated,
    };
  }

  async removeCoupon(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    if (order.userId !== userId) throw new ForbiddenException();

    return this.prisma.order.update({
      where: { id: orderId },
      data: { couponId: null, discountAmount: 0 },
      include: {
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
      },
    });
  }

  async create(dto: CreateCouponDto) {
    return this.prisma.coupon.create({
      data: {
        code: dto.code.toUpperCase().trim(),
        type: dto.type,
        value: dto.value,
        minPurchase: dto.minPurchase ?? 0,
        maxUses: dto.maxUses ?? null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        active: dto.active ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { orders: true } },
      },
    });
  }

  async toggle(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException();
    return this.prisma.coupon.update({
      where: { id },
      data: { active: !coupon.active },
    });
  }

  async remove(id: string) {
    await this.prisma.order.updateMany({
      where: { couponId: id },
      data: { couponId: null, discountAmount: 0 },
    });
    return this.prisma.coupon.delete({ where: { id } });
  }
}
