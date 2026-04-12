import { Test } from '@nestjs/testing';
import { OrdersService, orderTotalAmountInCents } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { OrderStatus } from '../common/constants/order-status';

jest.mock('../wompi/wompi-event-verify', () => ({
  verifyWompiEventChecksum: jest.fn(() => true),
}));

import { verifyWompiEventChecksum } from '../wompi/wompi-event-verify';

describe('Wompi webhook → OrdersService', () => {
  let service: OrdersService;
  const prisma = {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    product: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mailService = {
    sendOrderConfirmation: jest.fn().mockResolvedValue(true),
    sendNewOrderToAdmin: jest.fn().mockResolvedValue(true),
    sendStatusUpdateToClient: jest.fn().mockResolvedValue(true),
    sendStatusUpdateToAdmin: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.WOMPI_EVENTS_KEY = 'test-events-secret';

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = moduleRef.get(OrdersService);
  });

  afterEach(() => {
    delete process.env.WOMPI_EVENTS_KEY;
  });

  describe('applyWompiTransaction', () => {
    const draftOrder = {
      id: 'order-1',
      userId: 'user-1',
      status: OrderStatus.DRAFT,
      items: [{ productId: 'p1', quantity: 1, priceSnapshot: 100 }],
    };

    it('marca PAID y descuenta stock cuando APPROVED y monto coincide', async () => {
      const cents = orderTotalAmountInCents(draftOrder);
      prisma.order.findUnique.mockResolvedValue(draftOrder);
      prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) =>
        fn({
          ...prisma,
          product: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
          order: {
            update: jest.fn().mockResolvedValue({ ...draftOrder, status: OrderStatus.PAID }),
          },
        } as never),
      );
      prisma.order.findUnique.mockResolvedValueOnce(draftOrder).mockResolvedValueOnce({
        user: { email: 'a@b.com', name: 'A' },
        items: [{ product: { title: 'X' }, size: null, quantity: 1, priceSnapshot: 100 }],
      });

      const result = await service.applyWompiTransaction('order-1', 'APPROVED', cents);

      expect(result.ok).toBe(true);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(mailService.sendOrderConfirmation).toHaveBeenCalled();
    });

    it('marca CANCELLED cuando DECLINED en borrador', async () => {
      prisma.order.findUnique.mockResolvedValue(draftOrder);
      prisma.order.update.mockResolvedValue({ ...draftOrder, status: OrderStatus.CANCELLED });

      const cents = orderTotalAmountInCents(draftOrder);
      const result = await service.applyWompiTransaction('order-1', 'DECLINED', cents);

      expect(result.ok).toBe(true);
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: OrderStatus.CANCELLED },
        }),
      );
    });

    it('rechaza si el monto no coincide con el pedido', async () => {
      prisma.order.findUnique.mockResolvedValue(draftOrder);

      const result = await service.applyWompiTransaction('order-1', 'APPROVED', 1);

      expect(result.ok).toBe(false);
      expect(result.detail).toBe('amount_mismatch');
    });
  });

  describe('handleWompiWebhook', () => {
    it('procesa transaction.updated APPROVED vía applyWompiTransaction', async () => {
      const draftOrder = {
        id: 'order-1',
        status: OrderStatus.DRAFT,
        items: [{ productId: 'p1', quantity: 1, priceSnapshot: 50 }],
      };
      const cents = orderTotalAmountInCents(draftOrder);

      prisma.order.findUnique.mockResolvedValueOnce(draftOrder).mockResolvedValueOnce({
        user: { email: 'a@b.com', name: 'A' },
        items: [{ product: { title: 'X' }, size: null, quantity: 1, priceSnapshot: 50 }],
      });
      prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) =>
        fn({
          ...prisma,
          product: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
          order: {
            update: jest.fn().mockResolvedValue({ ...draftOrder, status: OrderStatus.PAID }),
          },
        } as never),
      );

      const body = {
        event: 'transaction.updated',
        timestamp: 1,
        data: {
          transaction: {
            reference: 'order-1',
            status: 'APPROVED',
            amount_in_cents: cents,
          },
        },
        signature: {
          properties: ['transaction.status'],
          checksum: 'X',
        },
      };

      (verifyWompiEventChecksum as jest.Mock).mockReturnValue(true);

      const out = await service.handleWompiWebhook(body as Record<string, unknown>);

      expect(verifyWompiEventChecksum).toHaveBeenCalled();
      expect(out).toEqual(expect.objectContaining({ ok: true }));
    });

    it('ignora eventos que no son transaction.updated', async () => {
      (verifyWompiEventChecksum as jest.Mock).mockReturnValue(true);

      const out = await service.handleWompiWebhook({
        event: 'other',
        timestamp: 1,
        data: {},
        signature: { properties: [], checksum: 'X' },
      } as Record<string, unknown>);

      expect(out).toEqual(expect.objectContaining({ ignored: true }));
    });
  });
});
