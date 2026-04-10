import { IsIn, IsInt, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class WompiSignatureDto {
  @IsString()
  @IsIn(['COP'])
  currency: 'COP';

  @IsInt()
  @Min(1)
  @Type(() => Number)
  amountInCents: number;

  @IsUUID()
  reference: string;
}
