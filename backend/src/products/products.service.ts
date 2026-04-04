import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { slugify } from './slug.util';

const productPublicInclude = {
  category: true,
  images: { orderBy: { sortOrder: 'asc' as const } },
  sizes: { include: { size: true } },
} as const;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findManyPublic(categoryId?: string) {
    return this.prisma.product.findMany({
      where: categoryId ? { categoryId } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: {
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
        sizes: { include: { size: { select: { id: true, name: true, code: true } } } },
      },
    });
  }

  async findOnePublic(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: productPublicInclude,
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async findOnePublicBySlug(slug: string) {
    const normalized = decodeURIComponent(slug).trim().toLowerCase();
    const product = await this.prisma.product.findFirst({
      where: { slug: normalized },
      include: productPublicInclude,
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  private async ensureUniqueSlug(
    base: string,
    excludeProductId?: string,
  ): Promise<string> {
    let candidate = base;
    let n = 0;
    for (;;) {
      const existing = await this.prisma.product.findFirst({
        where: {
          slug: candidate,
          ...(excludeProductId
            ? { NOT: { id: excludeProductId } }
            : {}),
        },
      });
      if (!existing) return candidate;
      n += 1;
      candidate = `${base}-${n}`;
    }
  }

  private async assertCategoryExists(categoryId: string) {
    const c = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!c) throw new BadRequestException('categoryId no existe');
  }

  private async assertSizesExist(sizeIds: string[]) {
    if (!sizeIds.length) return;
    const found = await this.prisma.size.findMany({
      where: { id: { in: sizeIds } },
      select: { id: true },
    });
    if (found.length !== sizeIds.length) {
      throw new BadRequestException('Algún sizeId no existe');
    }
  }

  async create(dto: CreateProductDto) {
    await this.assertCategoryExists(dto.categoryId);
    if (dto.sizeIds?.length) {
      await this.assertSizesExist(dto.sizeIds);
    }
    const baseSlug = (dto.slug ?? slugify(dto.title)).toLowerCase();
    const uniqueSlug = await this.ensureUniqueSlug(baseSlug);
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          title: dto.title,
          slug: uniqueSlug,
          description: dto.description,
          price: dto.price,
          categoryId: dto.categoryId,
        },
      });
      if (dto.imageUrls?.length) {
        await tx.productImage.createMany({
          data: dto.imageUrls.map((url, i) => ({
            productId: product.id,
            url,
            sortOrder: i,
          })),
        });
      }
      if (dto.sizeIds?.length) {
        await tx.productSize.createMany({
          data: dto.sizeIds.map((sizeId) => ({
            productId: product.id,
            sizeId,
          })),
        });
      }
      return tx.product.findUniqueOrThrow({
        where: { id: product.id },
        include: productPublicInclude,
      });
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Producto no encontrado');
    if (dto.categoryId) {
      await this.assertCategoryExists(dto.categoryId);
    }
    if (dto.sizeIds?.length) {
      await this.assertSizesExist(dto.sizeIds);
    }
    let nextSlug: string | null | undefined = undefined;
    if (dto.slug !== undefined) {
      if (dto.slug === null) {
        nextSlug = null;
      } else {
        nextSlug = await this.ensureUniqueSlug(dto.slug.toLowerCase(), id);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.price !== undefined && { price: dto.price }),
          ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
          ...(nextSlug !== undefined && { slug: nextSlug }),
        },
      });
      if (dto.imageUrls !== undefined) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (dto.imageUrls.length) {
          await tx.productImage.createMany({
            data: dto.imageUrls.map((url, i) => ({
              productId: id,
              url,
              sortOrder: i,
            })),
          });
        }
      }
      if (dto.sizeIds !== undefined) {
        await tx.productSize.deleteMany({ where: { productId: id } });
        if (dto.sizeIds.length) {
          await tx.productSize.createMany({
            data: dto.sizeIds.map((sizeId) => ({
              productId: id,
              sizeId,
            })),
          });
        }
      }
      return tx.product.findUniqueOrThrow({
        where: { id },
        include: productPublicInclude,
      });
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      include: { _count: { select: { orderItems: true } } },
    });
    if (!existing) throw new NotFoundException('Producto no encontrado');
    if (existing._count.orderItems > 0) {
      throw new BadRequestException(
        'No se puede eliminar: figura en líneas de pedido',
      );
    }
    await this.prisma.product.delete({ where: { id } });
    return { deleted: true };
  }
}
