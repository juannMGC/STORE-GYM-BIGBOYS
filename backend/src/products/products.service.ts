import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddProductImageDto } from './dto/add-product-image.dto';
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

  async findManyPublic(filters?: {
    search?: string;
    categoryId?: string;
    sizeId?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    orderBy?: string;
  }) {
    const where: Prisma.ProductWhereInput = {};

    const catId = filters?.categoryId?.trim();
    if (catId) {
      where.categoryId = catId;
    }

    const sizeId = filters?.sizeId?.trim();
    if (sizeId) {
      where.sizes = { some: { sizeId } };
    }

    const q = filters?.search?.trim();
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { category: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const priceFilter: Prisma.FloatFilter = {};
    if (filters?.minPrice !== undefined && Number.isFinite(filters.minPrice)) {
      priceFilter.gte = filters.minPrice;
    }
    if (filters?.maxPrice !== undefined && Number.isFinite(filters.maxPrice)) {
      priceFilter.lte = filters.maxPrice;
    }
    if (Object.keys(priceFilter).length > 0) {
      where.price = priceFilter;
    }

    if (filters?.inStock) {
      where.stock = { gt: 0 };
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = {
      createdAt: 'desc',
    };
    switch (filters?.orderBy) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'name_asc':
        orderBy = { title: 'asc' };
        break;
      default:
        break;
    }

    return this.prisma.product.findMany({
      where,
      orderBy,
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

  async getPriceRange(): Promise<{ min: number; max: number }> {
    const result = await this.prisma.product.aggregate({
      _min: { price: true },
      _max: { price: true },
    });
    const min = result._min.price ?? 0;
    const max = result._max.price ?? 1_000_000;
    if (min > max) {
      return { min: 0, max: 1_000_000 };
    }
    return { min, max };
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

  /** Misma categoría, excluye el producto actual; solo con stock (catálogo). */
  async getRelated(productId: string, categoryId: string, limit = 4) {
    const take = Math.min(Math.max(1, Math.floor(limit)), 24);
    return this.prisma.product.findMany({
      where: {
        categoryId,
        id: { not: productId },
        stock: { gt: 0 },
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take,
    });
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
          stock: dto.stock ?? 0,
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
          ...(dto.stock !== undefined && { stock: dto.stock }),
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

  async addProductImage(productId: string, dto: AddProductImageDto) {
    const p = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!p) throw new NotFoundException('Producto no encontrado');
    const url = dto.url?.trim();
    if (!url) throw new BadRequestException('url vacía');
    const count = await this.prisma.productImage.count({ where: { productId } });
    const sortOrder = dto.order !== undefined && Number.isFinite(dto.order) ? dto.order : count;
    return this.prisma.productImage.create({
      data: {
        productId,
        url,
        sortOrder,
      },
    });
  }

  async removeProductImage(productId: string, imageId: string) {
    const r = await this.prisma.productImage.deleteMany({
      where: { id: imageId, productId },
    });
    if (r.count === 0) throw new NotFoundException('Imagen no encontrada');
    return { deleted: true };
  }

  async reorderProductImages(productId: string, imageIds: string[]) {
    const p = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!p) throw new NotFoundException('Producto no encontrado');
    const existing = await this.prisma.productImage.findMany({
      where: { productId },
      select: { id: true },
    });
    const set = new Set(existing.map((e) => e.id));
    if (imageIds.length !== existing.length || !imageIds.every((id) => set.has(id))) {
      throw new BadRequestException(
        'La lista de IDs debe incluir todas las imágenes del producto, sin duplicados',
      );
    }
    await this.prisma.$transaction(
      imageIds.map((imageId, index) =>
        this.prisma.productImage.update({
          where: { id: imageId },
          data: { sortOrder: index },
        }),
      ),
    );
    return this.prisma.product.findUniqueOrThrow({
      where: { id: productId },
      include: productPublicInclude,
    });
  }
}
