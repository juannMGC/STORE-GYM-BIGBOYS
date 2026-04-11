import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

export type CategoryTreeNode = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  createdAt: Date;
  children: CategoryTreeNode[];
};

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAllFlat() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findTree(): Promise<CategoryTreeNode[]> {
    const rows = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    const map = new Map<string, CategoryTreeNode>();
    for (const c of rows) {
      map.set(c.id, {
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        imageUrl: c.imageUrl,
        parentId: c.parentId,
        createdAt: c.createdAt,
        children: [],
      });
    }
    const roots: CategoryTreeNode[] = [];
    for (const node of map.values()) {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }

  async create(dto: CreateCategoryDto) {
    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new BadRequestException('parentId no existe');
      }
    }
    if (dto.slug) {
      const clash = await this.prisma.category.findUnique({
        where: { slug: dto.slug },
      });
      if (clash) throw new ConflictException('slug ya en uso');
    }
    const imageUrlTrim =
      dto.imageUrl !== undefined && dto.imageUrl != null && String(dto.imageUrl).trim() !== ''
        ? String(dto.imageUrl).trim()
        : undefined;
    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        ...(imageUrlTrim !== undefined ? { imageUrl: imageUrlTrim } : {}),
        parentId: dto.parentId,
      },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Categoría no encontrada');
    if (dto.parentId !== undefined && dto.parentId !== null) {
      if (dto.parentId === id) {
        throw new BadRequestException('La categoría no puede ser padre de sí misma');
      }
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) throw new BadRequestException('parentId no existe');
      const wouldCycle = await this.wouldCreateCycle(id, dto.parentId);
      if (wouldCycle) {
        throw new BadRequestException('parentId crearía un ciclo en el árbol');
      }
    }
    if (dto.slug) {
      const clash = await this.prisma.category.findFirst({
        where: { slug: dto.slug, NOT: { id } },
      });
      if (clash) throw new ConflictException('slug ya en uso');
    }
    const imagePatch =
      dto.imageUrl === undefined
        ? {}
        : dto.imageUrl === null || String(dto.imageUrl).trim() === ''
          ? { imageUrl: null }
          : { imageUrl: String(dto.imageUrl).trim() };

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...imagePatch,
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
      },
    });
  }

  /** Comprueba si `nodeId` está en la cadena de ancestros de `ancestorCandidateId`. */
  private async wouldCreateCycle(
    nodeId: string,
    newParentId: string,
  ): Promise<boolean> {
    let current: string | null = newParentId;
    const visited = new Set<string>();
    while (current) {
      if (current === nodeId) return true;
      if (visited.has(current)) return true;
      visited.add(current);
      const row = await this.prisma.category.findUnique({
        where: { id: current },
        select: { parentId: true },
      });
      current = row?.parentId ?? null;
    }
    return false;
  }

  async remove(id: string) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true, children: true } },
      },
    });
    if (!existing) throw new NotFoundException('Categoría no encontrada');
    if (existing._count.children > 0) {
      throw new ConflictException(
        'No se puede eliminar: tiene subcategorías',
      );
    }
    if (existing._count.products > 0) {
      throw new ConflictException(
        'No se puede eliminar: tiene productos asociados',
      );
    }
    await this.prisma.category.delete({ where: { id } });
    return { deleted: true };
  }
}
