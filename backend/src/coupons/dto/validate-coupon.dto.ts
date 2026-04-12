import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Min, MinLength } from 'class-validator';

export class ValidateCouponDto {
  @IsString()
  @MinLength(1)
  code!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  orderTotal!: number;
}
