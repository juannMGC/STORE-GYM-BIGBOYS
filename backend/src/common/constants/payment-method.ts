/** Valores persistidos en Order.paymentMethod. */
export const PaymentMethod = {
  CASH: 'CASH',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CARD: 'CARD',
} as const;

export type PaymentMethodValue =
  (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PAYMENT_METHOD_VALUES: PaymentMethodValue[] = [
  PaymentMethod.CASH,
  PaymentMethod.BANK_TRANSFER,
  PaymentMethod.CARD,
];
