import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateAvatarDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4_000_000)
  avatarUrl!: string;
}
