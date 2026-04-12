import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class ReorderImagesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  imageIds: string[];
}
