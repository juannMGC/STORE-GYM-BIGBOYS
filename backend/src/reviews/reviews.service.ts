import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const PURCHASE_ORDER_STATUSES = ['DELIVERED', 'SHIPPED', 'PAID'] as const;

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyPurchase(userId: string, productId: string): Promise<boolean> {
    const purchase = await this.prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId,
          status: { in: [...PURCHASE_ORDER_STATUSES] },
        },
      },
    });
    return !!purchase;
  }

  async create(
    userId: string,
    productId: string,
    dto: { rating: number; title?: string; body: string },
  ) {
    const hasPurchased = await this.verifyPurchase(userId, productId);
    if (!hasPurchased) {
      throw new ForbiddenException('Solo podés reseñar productos que hayas comprado');
    }

    const existing = await this.prisma.review.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (existing) {
      throw new ConflictException('Ya dejaste una reseña para este producto');
    }

    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('La calificación debe ser entre 1 y 5');
    }

    return this.prisma.review.create({
      data: {
        rating: dto.rating,
        title: dto.title,
        body: dto.body,
        status: 'PENDING',
        productId,
        userId,
      },
      include: {
        user: { select: { name: true } },
      },
    });
  }

  async getByProduct(productId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { productId, status: 'APPROVED' },
      include: {
        user: { select: { name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = reviews.length;
    const avgRating = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;

    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((r) => r.rating === star).length,
      percent:
        total > 0
          ? Math.round((reviews.filter((r) => r.rating === star).length / total) * 100)
          : 0,
    }));

    return {
      reviews,
      stats: {
        total,
        avgRating: Math.round(avgRating * 10) / 10,
        distribution,
      },
    };
  }

  async canReview(userId: string, productId: string) {
    const hasPurchased = await this.verifyPurchase(userId, productId);
    const existing = await this.prisma.review.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    return {
      canReview: hasPurchased && !existing,
      hasPurchased,
      hasReviewed: !!existing,
      reviewStatus: existing?.status ?? null,
    };
  }

  async getPending() {
    return this.prisma.review.findMany({
      where: { status: 'PENDING' },
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { title: true, slug: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getAll(status?: string) {
    return this.prisma.review.findMany({
      where: status ? { status } : undefined,
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { title: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException();
    return this.prisma.review.update({
      where: { id },
      data: { status: 'APPROVED' },
    });
  }

  async reject(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException();
    return this.prisma.review.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
  }

  async remove(id: string) {
    return this.prisma.review.delete({ where: { id } });
  }
}
