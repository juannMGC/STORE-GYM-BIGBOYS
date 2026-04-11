import { IsIn, IsNotEmpty } from 'class-validator';
import {
  OrderStatus,
  type OrderStatusValue,
} from '../../common/constants/order-status';

export class AdminUpdateOrderStatusDto {
  /**
   * Nuevo estado del pedido (solo transiciones admin documentadas en
   * `order-transitions.assertAdminStatusTransition`).
   */
  @IsIn([
    OrderStatus.PENDING,
    OrderStatus.PAID,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
  ])
  @IsNotEmpty({ message: 'campo necesario' })
  status: OrderStatusValue;
}
