import { Type } from 'class-transformer';
import { IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

class PushKeysDto {
  @IsString()
  p256dh!: string;

  @IsString()
  auth!: string;
}

class SubscriptionPayloadDto {
  @IsString()
  endpoint!: string;

  @ValidateNested()
  @Type(() => PushKeysDto)
  keys!: PushKeysDto;
}

export class SubscribePushDto {
  @ValidateNested()
  @Type(() => SubscriptionPayloadDto)
  subscription!: SubscriptionPayloadDto;
}

export class UnsubscribePushDto {
  @IsString()
  endpoint!: string;
}
