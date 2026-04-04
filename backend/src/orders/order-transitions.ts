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

/**
 * Transiciones que el **administrador** puede aplicar (seguimiento del PDF:
 * marcar pagado, cancelar, marcar enviado).
 *
 * - PENDING → PAID | CANCELLED (recibir/cancelar antes de pagar)
 * - PAID → SHIPPED | CANCELLED (enviar o anular tras pago; “canceló” del PDF)
 *
 * Estados terminales: SHIPPED y CANCELLED (no salen hacia otros en esta API).
 */
export function assertAdminStatusTransition(
  from: OrderStatusValue,
  to: OrderStatusValue,
): void {
  if (from === to) {
    throw new BadRequestException('El estado es el mismo');
  }
  const allowed: Partial<Record<OrderStatusValue, OrderStatusValue[]>> = {
    [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
    [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  };
  const nexts = allowed[from];
  if (!nexts?.includes(to)) {
    throw new BadRequestException(
      `Transición no permitida: ${from} → ${to}. Permitidas desde ${from}: ${nexts?.join(', ') ?? 'ninguna'}`,
    );
  }
}
