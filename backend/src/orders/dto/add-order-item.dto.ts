import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class AddOrderItemDto {
  @IsUUID()
  productId: string;

  @IsOptional()
  @IsUUID()
  sizeId?: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}
