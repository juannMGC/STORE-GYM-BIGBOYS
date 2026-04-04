import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class AddCartItemDto {
  @IsUUID()
  productId: string;

  /** Obligatorio si el producto tiene tallas configuradas. */
  @IsOptional()
  @IsUUID()
  sizeId?: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}
