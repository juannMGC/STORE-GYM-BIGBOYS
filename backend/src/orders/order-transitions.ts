import { BadRequestException } from '@nestjs/common';
import {
  ADMIN_TRANSITIONS,
  OrderStatus,
  type OrderStatusValue,
} from '../common/constants/order-status';

/**
 * Transiciones que el **cliente** puede disparar (API propia de carrito/checkout).
 *
 * - DRAFT → PAID: confirmar pedido una vez elegida la forma de pago y con ítems (o Wompi APPROVED).
 */
export function assertClientConfirm(from: OrderStatusValue): void {
  if (from !== OrderStatus.DRAFT) {
    throw new BadRequestException(
      `Solo se puede confirmar un pedido en ${OrderStatus.DRAFT}. Estado actual: ${from}`,
    );
  }
}

const TRANSITION_DENIED = 'Transición de estado no permitida';

/** Filas antiguas podían tener PENDING (migración → PAID). */
export function coerceOrderStatusFromDb(raw: string): OrderStatusValue {
  if (raw === 'PENDING' || raw === 'CONFIRMED') {
    return OrderStatus.PAID;
  }
  return raw as OrderStatusValue;
}

/**
 * Transiciones admin / PATCH estado.
 *
 * - PAID → SHIPPED | CANCELLED
 * - SHIPPED → DELIVERED | CANCELLED
 * - DELIVERED / CANCELLED / DRAFT → sin salidas vía PATCH de admin
 */
export function assertPatchOrderStatusTransition(
  fromRaw: string,
  to: OrderStatusValue,
): void {
  const from = coerceOrderStatusFromDb(fromRaw);
  if (from === to) {
    throw new BadRequestException(TRANSITION_DENIED);
  }
  const nexts = ADMIN_TRANSITIONS[from] ?? [];
  if (!nexts.includes(to)) {
    throw new BadRequestException(
      `No se puede cambiar de ${from} a ${to}. Transiciones válidas: ${
        nexts.join(', ') || 'ninguna'
      }`,
    );
  }
}
