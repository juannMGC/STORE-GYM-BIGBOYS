import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ArchiveOrderDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;
}
