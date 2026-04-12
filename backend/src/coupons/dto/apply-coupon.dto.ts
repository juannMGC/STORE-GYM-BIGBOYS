import { IsUUID, IsString, MinLength } from 'class-validator';

export class ApplyCouponDto {
  @IsUUID()
  orderId!: string;

  @IsString()
  @MinLength(1)
  code!: string;
}
