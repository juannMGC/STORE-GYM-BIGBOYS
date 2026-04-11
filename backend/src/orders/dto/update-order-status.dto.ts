import { IsIn, IsNotEmpty } from 'class-validator';

/**
 * Cuerpo PATCH estado pedido. `CONFIRMED` se persiste como `PAID` en DB.
 * `PAID` se acepta por compatibilidad con clientes que ya envían el valor Prisma.
 */
export const UPDATE_ORDER_STATUS_API_VALUES = [
  'DRAFT',
  'PENDING',
  'CONFIRMED',
  'PAID',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;

export type UpdateOrderStatusApiValue =
  (typeof UPDATE_ORDER_STATUS_API_VALUES)[number];

export class UpdateOrderStatusDto {
  @IsIn([...UPDATE_ORDER_STATUS_API_VALUES], {
    message: 'Estado inválido',
  })
  @IsNotEmpty({ message: 'campo necesario' })
  status: string;
}
