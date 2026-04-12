import { IsOptional, IsString } from 'class-validator';

export class UploadBase64Dto {
  @IsString()
  base64!: string;

  @IsOptional()
  @IsString()
  folder?: string;
}
