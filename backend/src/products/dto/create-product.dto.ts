import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'campo necesario' })
  @MaxLength(300)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  description?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsUUID()
  categoryId: string;

  /** URLs de imagen (orden = orden de aparición). */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  /** IDs de tallas aplicables al producto (vacío = sin tallas). */
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  sizeIds?: string[];
}
