import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSizeDto {
  @IsString()
  @IsNotEmpty({ message: 'campo necesario' })
  @MaxLength(120)
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'campo necesario' })
  @MaxLength(64)
  code: string;
}
