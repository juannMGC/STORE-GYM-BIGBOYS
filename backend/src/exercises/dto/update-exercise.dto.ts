import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;

export class UpdateExerciseDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug: solo minúsculas, números y guiones',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  muscleGroupId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(16000)
  instructions?: string | null;

  @IsOptional()
  @IsString()
  @IsIn(LEVELS)
  level?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  sets?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  reps?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  restSeconds?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  equipment?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  tips?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  imageUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  videoUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  order?: number;
}
