import { IsIn, IsNotEmpty } from 'class-validator';

/**
 * Cuerpo PATCH estado pedido (admin).
 * `CONFIRMED` / `PENDING` se normalizan a `PAID` en servicio (legacy).
 */
export const UPDATE_ORDER_STATUS_API_VALUES = [
  'PAID',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;

export type UpdateOrderStatusApiValue =
  (typeof UPDATE_ORDER_STATUS_API_VALUES)[number];

export class UpdateOrderStatusDto {
  @IsIn([...UPDATE_ORDER_STATUS_API_VALUES, 'CONFIRMED', 'PENDING'], {
    message: 'Estado inválido',
  })
  @IsNotEmpty({ message: 'campo necesario' })
  status: string;
}
