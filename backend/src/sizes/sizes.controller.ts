import { Controller, Get } from '@nestjs/common';
import { SizesService } from './sizes.service';

/** Listado público de tallas (p. ej. formularios). Sin JWT. */
@Controller('sizes')
export class SizesController {
  constructor(private readonly sizesService: SizesService) {}

  @Get()
  findAll() {
    return this.sizesService.findAll();
  }
}
