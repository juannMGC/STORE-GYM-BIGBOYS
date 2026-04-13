import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class BroadcastPushDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  body!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  url?: string;
}
