import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateShippingDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  shippingEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  shippingDepartment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  shippingCity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  shippingNeighborhood?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  shippingAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  shippingComplement?: string;
}
