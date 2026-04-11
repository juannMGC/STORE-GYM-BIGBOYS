import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class UpdateOrderItemDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}
