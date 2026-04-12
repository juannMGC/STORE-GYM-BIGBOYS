import { Test } from '@nestjs/testing';
import { OrdersService, orderTotalAmountInCents } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CouponsService } from '../coupons/coupons.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '../common/constants/order-status';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: {
    order: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    orderItem: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    product: {
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let mailService: { sendOrderConfirmation: jest.Mock; sendNewOrderToAdmin: jest.Mock };

  const mockItem = {
    id: 'item-1',
    productId: 'prod-1',
    quantity: 2,
    priceSnapshot: 189900,
    orderId: 'order-1',
  };

  const mockOrderDraft = {
    id: 'order-1',
    userId: 'user-1',
    status: OrderStatus.DRAFT,
    paymentMethod: 'CASH',
    createdAt: new Date(),
    items: [mockItem],
    user: { id: 'user-1', name: 'Test', email: 'test@test.com' },
    shippingEmail: null,
    shippingDepartment: null,
    shippingCity: null,
    shippingNeighborhood: null,
    shippingAddress: null,
    shippingComplement: null,
  };

  const orderDetailViewerShape = {
    ...mockOrderDraft,
    status: OrderStatus.PAID,
    items: [
      {
        id: 'item-1',
        quantity: 2,
        priceSnapshot: 189900,
        product: {
          id: 'prod-1',
          title: 'Proteína',
          price: 189900,
          images: [{ url: 'https://example.com/i.jpg' }],
        },
        size: null,
      },
    ],
    user: { id: 'user-1', name: 'Test', email: 'test@test.com' },
  };

  beforeEach(async () => {
    mailService = {
      sendOrderConfirmation: jest.fn().mockResolvedValue(true),
      sendNewOrderToAdmin: jest.fn().mockResolvedValue(true),
    };

    prisma = {
      order: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      orderItem: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      product: {
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: MailService,
          useValue: {
            ...mailService,
            sendStatusUpdateToClient: jest.fn().mockResolvedValue(true),
            sendStatusUpdateToAdmin: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: CouponsService,
          useValue: {
            validateCoupon: jest.fn().mockResolvedValue({ discountAmount: 0 }),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(OrdersService);
  });

  describe('getCartPayload', () => {
    it('retorna carrito DRAFT activo del usuario', async () => {
      prisma.order.findFirst.mockResolvedValue(mockOrderDraft);

      const result = await service.getCartPayload('user-1');

      expect(prisma.order.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', status: OrderStatus.DRAFT },
        }),
      );
      expect(result).toEqual(mockOrderDraft);
    });

    it('retorna items vacíos si no hay borrador', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      const result = await service.getCartPayload('user-1');

      expect(result).toEqual({ items: [], total: 0 });
    });
  });

  describe('confirmOrderById', () => {
    it('confirma pedido DRAFT y pasa a PAID', async () => {
      const order = {
        ...mockOrderDraft,
        paymentMethod: 'BANK_TRANSFER',
        items: [mockItem],
      };
      const mailRow = {
        user: { email: 'test@test.com', name: 'Test' },
        items: [
          {
            product: { title: 'Proteína' },
            size: null,
            quantity: 2,
            priceSnapshot: 189900,
          },
        ],
      };
      prisma.order.findUnique.mockResolvedValueOnce(order).mockResolvedValueOnce(mailRow);
      prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) =>
        fn({
          ...prisma,
          product: {
            ...prisma.product,
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          order: {
            ...prisma.order,
            update: jest.fn().mockResolvedValue({ ...order, status: OrderStatus.PAID }),
          },
          coupon: { update: jest.fn().mockResolvedValue({}) },
        } as never),
      );

      await service.confirmOrderById('order-1', 'user-1');

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(mailService.sendOrderConfirmation).toHaveBeenCalled();
    });

    it('lanza si el pedido no es DRAFT', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...mockOrderDraft,
        status: OrderStatus.PAID,
      });

      await expect(service.confirmOrderById('order-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lanza Forbidden si otro usuario confirma', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrderDraft);

      await expect(service.confirmOrderById('order-1', 'user-otro')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('lanza si el carrito está vacío', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...mockOrderDraft,
        items: [],
        paymentMethod: 'CASH',
      });

      await expect(service.confirmOrderById('order-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lanza si falta método de pago', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...mockOrderDraft,
        paymentMethod: null,
      });

      await expect(service.confirmOrderById('order-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateStatus (admin)', () => {
    const mailForStatus = {
      user: { email: 'test@test.com', name: 'Test' },
      items: [{ product: { title: 'Proteína' }, size: null, quantity: 1, priceSnapshot: 100 }],
    };

    it('cambia PAID → SHIPPED', async () => {
      const orderPaid = {
        id: 'order-1',
        userId: 'user-1',
        status: OrderStatus.PAID,
        items: [mockItem],
      };
      prisma.order.findUnique
        .mockResolvedValueOnce(orderPaid)
        .mockResolvedValueOnce(mailForStatus)
        .mockResolvedValueOnce(orderDetailViewerShape);
      prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) =>
        fn(prisma as never),
      );
      prisma.order.update.mockResolvedValue({ ...orderPaid, status: OrderStatus.SHIPPED });

      await service.updateStatus('order-1', { status: 'SHIPPED' });

      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: OrderStatus.SHIPPED },
        }),
      );
    });

    it('rechaza transición inválida PAID → DELIVERED', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.PAID,
        items: [mockItem],
      });

      await expect(service.updateStatus('order-1', { status: 'DELIVERED' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('usa transacción al cancelar pedido pagado (restock)', async () => {
      const orderPaid = {
        id: 'order-1',
        userId: 'user-1',
        status: OrderStatus.PAID,
        items: [mockItem],
      };
      prisma.order.findUnique
        .mockResolvedValueOnce(orderPaid)
        .mockResolvedValueOnce(mailForStatus)
        .mockResolvedValueOnce(orderDetailViewerShape);
      prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) =>
        fn(prisma as never),
      );
      prisma.product.update.mockResolvedValue({});
      prisma.order.update.mockResolvedValue({ ...orderPaid, status: OrderStatus.CANCELLED });

      await service.updateStatus('order-1', { status: 'CANCELLED' });

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('orderTotalAmountInCents', () => {
    it('calcula centavos desde snapshots', () => {
      expect(
        orderTotalAmountInCents({
          items: [{ priceSnapshot: 100, quantity: 2 }],
        }),
      ).toBe(20000);
    });
  });

  describe('getOrderDetailDtoById', () => {
    it('lanza NotFoundException si no existe', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(service.getOrderDetailDtoById('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
