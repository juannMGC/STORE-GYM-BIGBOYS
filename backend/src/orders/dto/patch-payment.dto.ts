import { IsIn, IsNotEmpty } from 'class-validator';
import {
  PAYMENT_METHOD_VALUES,
  type PaymentMethodValue,
} from '../../common/constants/payment-method';

export class PatchPaymentDto {
  /**
   * Forma de pago elegida antes de confirmar.
   * Valores: CASH | BANK_TRANSFER | CARD
   */
  @IsIn(PAYMENT_METHOD_VALUES)
  @IsNotEmpty({ message: 'campo necesario' })
  paymentMethod: PaymentMethodValue;
}
