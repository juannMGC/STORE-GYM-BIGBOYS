/** Valores persistidos en Order.status (string en Prisma). */
export const OrderStatus = {
  DRAFT: 'DRAFT',
  PAID: 'PAID',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderStatusValue = (typeof OrderStatus)[keyof typeof OrderStatus];

export const ORDER_STATUS_VALUES: OrderStatusValue[] = [
  OrderStatus.DRAFT,
  OrderStatus.PAID,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
];

/**
 * Transiciones que el admin puede aplicar vía PATCH (no aplica a DRAFT desde admin).
 */
export const ADMIN_TRANSITIONS: Record<OrderStatusValue, OrderStatusValue[]> = {
  [OrderStatus.DRAFT]: [],
  [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

/** Alias legible para docs / imports nuevos. */
export const ORDER_STATUS = OrderStatus;
