import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;

export class CreateExerciseDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @IsString()
  @MinLength(1)
  muscleGroupId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16000)
  instructions?: string;

  @IsOptional()
  @IsString()
  @IsIn(LEVELS)
  level?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  sets?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  reps?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  restSeconds?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  equipment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  tips?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  videoUrl?: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  order?: number;
}
