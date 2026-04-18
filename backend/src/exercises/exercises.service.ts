import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { CreateMuscleGroupDto } from './dto/create-muscle-group.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { UpdateMuscleGroupDto } from './dto/update-muscle-group.dto';

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMuscleGroups() {
    return this.prisma.muscleGroup.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: {
            exercises: {
              where: { active: true },
            },
          },
        },
      },
    });
  }

  async findAllAdmin() {
    return this.prisma.exercise.findMany({
      include: { muscleGroup: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findAll(filters?: {
    muscleGroupSlug?: string;
    level?: string;
    search?: string;
    featured?: boolean;
  }) {
    const where: Prisma.ExerciseWhereInput = { active: true };

    if (filters?.muscleGroupSlug) {
      where.muscleGroup = { slug: filters.muscleGroupSlug };
    }
    if (filters?.level) {
      where.level = filters.level;
    }
    if (filters?.search?.trim()) {
      where.OR = [
        {
          name: {
            contains: filters.search.trim(),
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: filters.search.trim(),
            mode: 'insensitive',
          },
        },
      ];
    }
    if (filters?.featured) {
      where.featured = true;
    }

    return this.prisma.exercise.findMany({
      where,
      include: {
        muscleGroup: {
          select: { name: true, slug: true },
        },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findBySlug(slug: string) {
    const exercise = await this.prisma.exercise.findFirst({
      where: { slug, active: true },
      include: { muscleGroup: true },
    });
    if (!exercise) {
      throw new NotFoundException('Ejercicio no encontrado');
    }
    return exercise;
  }

  private async uniqueExerciseSlug(base: string): Promise<string> {
    let slug = base;
    for (let n = 0; n < 1000; n += 1) {
      const exists = await this.prisma.exercise.findUnique({
        where: { slug },
      });
      if (!exists) return slug;
      slug = `${base}-${n + 1}`;
    }
    throw new BadRequestException('No se pudo generar un slug único');
  }

  async create(dto: CreateExerciseDto) {
    const baseSlug =
      dto.slug?.trim() || slugifyName(dto.name) || 'ejercicio';
    const slug = await this.uniqueExerciseSlug(baseSlug);

    return this.prisma.exercise.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        instructions: dto.instructions,
        muscleGroupId: dto.muscleGroupId,
        level: dto.level ?? 'BEGINNER',
        sets: dto.sets,
        reps: dto.reps,
        restSeconds: dto.restSeconds,
        equipment: dto.equipment,
        tips: dto.tips,
        imageUrl: dto.imageUrl,
        videoUrl: dto.videoUrl,
        featured: dto.featured ?? false,
        order: dto.order ?? 0,
      },
      include: { muscleGroup: true },
    });
  }

  async update(id: string, dto: UpdateExerciseDto) {
    if (dto.slug) {
      const other = await this.prisma.exercise.findFirst({
        where: { slug: dto.slug, NOT: { id } },
      });
      if (other) {
        throw new BadRequestException('Ese slug ya está en uso');
      }
    }
    const data: Prisma.ExerciseUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.slug !== undefined) data.slug = dto.slug;
    if (dto.description !== undefined) data.description = dto.description ?? undefined;
    if (dto.instructions !== undefined) data.instructions = dto.instructions ?? undefined;
    if (dto.muscleGroupId !== undefined) {
      data.muscleGroup = { connect: { id: dto.muscleGroupId } };
    }
    if (dto.level !== undefined) data.level = dto.level;
    if (dto.sets !== undefined) data.sets = dto.sets ?? undefined;
    if (dto.reps !== undefined) data.reps = dto.reps ?? undefined;
    if (dto.restSeconds !== undefined) data.restSeconds = dto.restSeconds ?? undefined;
    if (dto.equipment !== undefined) data.equipment = dto.equipment ?? undefined;
    if (dto.tips !== undefined) data.tips = dto.tips ?? undefined;
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl ?? undefined;
    if (dto.videoUrl !== undefined) data.videoUrl = dto.videoUrl ?? undefined;
    if (dto.active !== undefined) data.active = dto.active;
    if (dto.featured !== undefined) data.featured = dto.featured;
    if (dto.order !== undefined) data.order = dto.order;

    return this.prisma.exercise.update({
      where: { id },
      data,
      include: { muscleGroup: true },
    });
  }

  async remove(id: string) {
    return this.prisma.exercise.delete({ where: { id } });
  }

  async toggleActive(id: string) {
    const ex = await this.prisma.exercise.findUnique({ where: { id } });
    if (!ex) throw new NotFoundException();
    return this.prisma.exercise.update({
      where: { id },
      data: { active: !ex.active },
    });
  }

  async createMuscleGroup(dto: CreateMuscleGroupDto) {
    const rawSlug = dto.slug?.trim();
    const slug =
      rawSlug ||
      slugifyName(dto.name).replace(/^-+|-+$/g, '') ||
      'grupo';
    return this.prisma.muscleGroup.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        order: dto.order ?? 0,
      },
    });
  }

  async updateMuscleGroup(id: string, dto: UpdateMuscleGroupDto) {
    return this.prisma.muscleGroup.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description ?? undefined }
          : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
      },
    });
  }

  async removeMuscleGroup(id: string) {
    const count = await this.prisma.exercise.count({
      where: { muscleGroupId: id },
    });
    if (count > 0) {
      throw new BadRequestException(
        `No se puede eliminar: tiene ${count} ejercicios`,
      );
    }
    return this.prisma.muscleGroup.delete({ where: { id } });
  }
}
