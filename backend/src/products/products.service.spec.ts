import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: jest.Mocked<Pick<PrismaService, 'product' | 'category' | 'size' | '$transaction'>>;

  const mockProduct = {
    id: 'prod-1',
    title: 'Proteína Premium',
    slug: 'proteina-premium',
    price: 189900,
    stock: 10,
    description: 'La mejor proteína',
    categoryId: 'cat-1',
    createdAt: new Date(),
    category: { id: 'cat-1', name: 'Suplementación', slug: 'suplementacion' },
    sizes: [],
    images: [],
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              aggregate: jest.fn(),
            },
            category: { findUnique: jest.fn() },
            size: { findMany: jest.fn() },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(ProductsService);
    prisma = moduleRef.get(PrismaService);
  });

  describe('findManyPublic', () => {
    it('retorna todos los productos', async () => {
      jest.spyOn(prisma.product, 'findMany').mockResolvedValue([mockProduct] as never);

      const result = await service.findManyPublic();

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Proteína Premium');
    });

    it('filtra por búsqueda de texto (title / description / categoría)', async () => {
      jest.spyOn(prisma.product, 'findMany').mockResolvedValue([mockProduct] as never);

      await service.findManyPublic({ search: 'proteína' });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                title: expect.objectContaining({
                  contains: 'proteína',
                  mode: 'insensitive',
                }),
              }),
            ]),
          }),
        }),
      );
    });

    it('filtra por stock disponible', async () => {
      jest.spyOn(prisma.product, 'findMany').mockResolvedValue([mockProduct] as never);

      await service.findManyPublic({ inStock: true });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            stock: { gt: 0 },
          }),
        }),
      );
    });
  });

  describe('findOnePublicBySlug', () => {
    it('retorna producto por slug', async () => {
      jest.spyOn(prisma.product, 'findFirst').mockResolvedValue(mockProduct as never);

      const result = await service.findOnePublicBySlug('proteina-premium');

      expect(result.title).toBe('Proteína Premium');
    });

    it('lanza NotFoundException si no existe', async () => {
      jest.spyOn(prisma.product, 'findFirst').mockResolvedValue(null);

      await expect(service.findOnePublicBySlug('no-existe')).rejects.toThrow(NotFoundException);
    });
  });
});
