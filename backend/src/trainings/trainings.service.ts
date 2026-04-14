import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

@Injectable()
export class TrainingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.training.findMany({
      where: { active: true },
      include: {
        schedules: { orderBy: { day: 'asc' } },
        benefits: { orderBy: { order: 'asc' } },
      },
      orderBy: { order: 'asc' },
    });
  }

  async findAllAdmin() {
    return this.prisma.training.findMany({
      include: {
        schedules: { orderBy: { day: 'asc' } },
        benefits: { orderBy: { order: 'asc' } },
      },
      orderBy: { order: 'asc' },
    });
  }

  async findBySlugPublic(slug: string) {
    const training = await this.prisma.training.findFirst({
      where: { slug, active: true },
      include: {
        schedules: { orderBy: { day: 'asc' } },
        benefits: { orderBy: { order: 'asc' } },
      },
    });
    if (!training) {
      throw new NotFoundException('Entrenamiento no encontrado');
    }
    return training;
  }

  async findByIdAdmin(id: string) {
    const training = await this.prisma.training.findUnique({
      where: { id },
      include: {
        schedules: { orderBy: { day: 'asc' } },
        benefits: { orderBy: { order: 'asc' } },
      },
    });
    if (!training) {
      throw new NotFoundException('Entrenamiento no encontrado');
    }
    return training;
  }

  async create(dto: CreateTrainingDto) {
    const slug = dto.slug?.trim() || slugifyName(dto.name);
    if (!slug) {
      throw new BadRequestException('No se pudo generar slug');
    }

    return this.prisma.training.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description.trim(),
        longDesc: dto.longDesc?.trim() ?? null,
        price: dto.price,
        priceLabel: dto.priceLabel?.trim() ?? 'por mes',
        imageUrl: dto.imageUrl?.trim() ?? null,
        icon: dto.icon?.trim() ?? null,
        active: dto.active ?? true,
        featured: dto.featured ?? false,
        order: dto.order ?? 0,
        benefits:
          dto.benefits?.length ?
            {
              create: dto.benefits.map((b, i) => ({
                text: b.trim(),
                order: i,
              })),
            }
          : undefined,
        schedules:
          dto.schedules?.length ?
            {
              create: dto.schedules.map((s) => ({
                day: s.day.trim(),
                startTime: s.startTime.trim(),
                endTime: s.endTime.trim(),
                spots: s.spots ?? null,
              })),
            }
          : undefined,
      },
      include: {
        schedules: true,
        benefits: true,
      },
    });
  }

  async update(id: string, dto: UpdateTrainingDto) {
    const existing = await this.prisma.training.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Entrenamiento no encontrado');
    }

    const data: {
      name?: string;
      slug?: string;
      description?: string;
      longDesc?: string | null;
      price?: number;
      priceLabel?: string | null;
      imageUrl?: string | null;
      icon?: string | null;
      active?: boolean;
      featured?: boolean;
      order?: number;
    } = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.slug !== undefined) data.slug = dto.slug.trim();
    if (dto.description !== undefined) data.description = dto.description.trim();
    if (dto.longDesc !== undefined) {
      data.longDesc = dto.longDesc === null || dto.longDesc === '' ? null : dto.longDesc.trim();
    }
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.priceLabel !== undefined) {
      data.priceLabel = dto.priceLabel === null || dto.priceLabel === '' ? null : dto.priceLabel.trim();
    }
    if (dto.imageUrl !== undefined) {
      data.imageUrl = dto.imageUrl === null || dto.imageUrl === '' ? null : dto.imageUrl.trim();
    }
    if (dto.icon !== undefined) {
      data.icon = dto.icon === null || dto.icon === '' ? null : dto.icon.trim();
    }
    if (dto.active !== undefined) data.active = dto.active;
    if (dto.featured !== undefined) data.featured = dto.featured;
    if (dto.order !== undefined) data.order = dto.order;

    if (Object.keys(data).length > 0) {
      await this.prisma.training.update({
        where: { id },
        data,
      });
    }

    if (dto.benefits !== undefined) {
      await this.prisma.trainingBenefit.deleteMany({ where: { trainingId: id } });
      if (dto.benefits.length > 0) {
        await this.prisma.trainingBenefit.createMany({
          data: dto.benefits.map((b, i) => ({
            trainingId: id,
            text: b.trim(),
            order: i,
          })),
        });
      }
    }

    if (dto.schedules !== undefined) {
      await this.prisma.trainingSchedule.deleteMany({ where: { trainingId: id } });
      if (dto.schedules.length > 0) {
        await this.prisma.trainingSchedule.createMany({
          data: dto.schedules.map((s) => ({
            trainingId: id,
            day: s.day.trim(),
            startTime: s.startTime.trim(),
            endTime: s.endTime.trim(),
            spots: s.spots ?? null,
          })),
        });
      }
    }

    return this.findByIdAdmin(id);
  }

  async remove(id: string) {
    await this.findByIdAdmin(id);
    return this.prisma.training.delete({ where: { id } });
  }

  async toggleActive(id: string) {
    const t = await this.prisma.training.findUnique({ where: { id } });
    if (!t) {
      throw new NotFoundException();
    }
    return this.prisma.training.update({
      where: { id },
      data: { active: !t.active },
    });
  }
}
