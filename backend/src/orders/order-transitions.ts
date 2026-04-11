import { BadRequestException } from '@nestjs/common';
import { OrderStatus, type OrderStatusValue } from '../common/constants/order-status';

/**
 * Transiciones que el **cliente** puede disparar (API propia de carrito/checkout).
 *
 * - DRAFT → PENDING: confirmar pedido una vez elegida la forma de pago y con ítems.
 */
export function assertClientConfirm(from: OrderStatusValue): void {
  if (from !== OrderStatus.DRAFT) {
    throw new BadRequestException(
      `Solo se puede confirmar un pedido en ${OrderStatus.DRAFT}. Estado actual: ${from}`,
    );
  }
}

const TRANSITION_DENIED = 'Transición de estado no permitida';

/**
 * Transiciones admin / PATCH estado (valores persistidos: PAID, no CONFIRMED).
 *
 * - DRAFT → PENDING | CANCELLED
 * - PENDING → PAID | CANCELLED
 * - PAID → SHIPPED | CANCELLED
 * - SHIPPED → DELIVERED
 * - DELIVERED / CANCELLED → sin salidas
 */
export function assertPatchOrderStatusTransition(
  from: OrderStatusValue,
  to: OrderStatusValue,
): void {
  if (from === to) {
    throw new BadRequestException(TRANSITION_DENIED);
  }
  const allowed: Record<OrderStatusValue, OrderStatusValue[]> = {
    [OrderStatus.DRAFT]: [OrderStatus.PENDING, OrderStatus.CANCELLED],
    [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
    [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
    [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELLED]: [],
  };
  const nexts = allowed[from];
  if (!nexts?.includes(to)) {
    throw new BadRequestException(TRANSITION_DENIED);
  }
}
