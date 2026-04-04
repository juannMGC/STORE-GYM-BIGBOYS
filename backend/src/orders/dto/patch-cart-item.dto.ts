import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class PatchCartItemDto {
  @IsInt()
  @Min(0)
  @Type(() => Number)
  /** Use 0 para eliminar la línea (equivalente a DELETE). */
  quantity: number;
}
