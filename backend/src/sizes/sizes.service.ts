import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSizeDto } from './dto/create-size.dto';
import { UpdateSizeDto } from './dto/update-size.dto';

@Injectable()
export class SizesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.size.findMany({ orderBy: { name: 'asc' } });
  }

  async create(dto: CreateSizeDto) {
    const clash = await this.prisma.size.findUnique({
      where: { code: dto.code },
    });
    if (clash) throw new ConflictException('code ya en uso');
    return this.prisma.size.create({
      data: { name: dto.name, code: dto.code },
    });
  }

  async update(id: string, dto: UpdateSizeDto) {
    const existing = await this.prisma.size.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Talla no encontrada');
    if (dto.code) {
      const clash = await this.prisma.size.findFirst({
        where: { code: dto.code, NOT: { id } },
      });
      if (clash) throw new ConflictException('code ya en uso');
    }
    return this.prisma.size.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code }),
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.size.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true, orderItems: true } },
      },
    });
    if (!existing) throw new NotFoundException('Talla no encontrada');
    if (existing._count.products > 0 || existing._count.orderItems > 0) {
      throw new ConflictException(
        'No se puede eliminar: está en uso en productos o pedidos',
      );
    }
    await this.prisma.size.delete({ where: { id } });
    return { deleted: true };
  }
}
