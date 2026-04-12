import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AddProductImageDto {
  @IsString()
  url: string;

  /** Orden en galería (usa `sortOrder` en BD). */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  order?: number;
}
