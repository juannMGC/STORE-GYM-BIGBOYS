import { Controller, Get } from '@nestjs/common';
import { CategoriesService } from './categories.service';

/** Catálogo público: sin JWT. */
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /** Lista plana; cada ítem incluye `parentId` (null = raíz). */
  @Get()
  findAllFlat() {
    return this.categoriesService.findAllFlat();
  }

  /** Árbol anidado (`children`). */
  @Get('tree')
  findTree() {
    return this.categoriesService.findTree();
  }
}
