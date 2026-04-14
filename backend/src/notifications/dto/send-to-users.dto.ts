import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SendToUsersDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  userIds!: string[];

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  body!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  url?: string;

  @IsOptional()
  @IsString()
  @IsIn(['PROMO', 'SYSTEM', 'ORDER'])
  notifType?: 'PROMO' | 'SYSTEM' | 'ORDER';
}
