import { IsIn, IsNotEmpty } from 'class-validator';
import {
  OrderStatus,
  type OrderStatusValue,
} from '../../common/constants/order-status';

export class AdminUpdateOrderStatusDto {
  /**
   * Nuevo estado del pedido (solo transiciones admin documentadas en
   * `order-transitions.assertAdminStatusTransition`).
   *
   * No incluye DRAFT ni PENDING (el cliente crea PENDING al confirmar el carrito).
   *
   * Ejemplos permitidos según estado actual:
   * - Desde PENDING: PAID, CANCELLED
   * - Desde PAID: SHIPPED, CANCELLED
   */
  @IsIn([OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.CANCELLED])
  @IsNotEmpty({ message: 'campo necesario' })
  status: OrderStatusValue;
}
