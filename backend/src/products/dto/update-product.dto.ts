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

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'campo necesario' })
  @MaxLength(300)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  description?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  /** Si se envía, reemplaza todas las imágenes. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  /** Si se envía, reemplaza el conjunto de tallas (vacío = sin tallas). */
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  sizeIds?: string[];
}
