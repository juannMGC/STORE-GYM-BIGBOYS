import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSizeDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'campo necesario' })
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'campo necesario' })
  @MaxLength(64)
  code?: string;
}
