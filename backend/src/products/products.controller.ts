import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

/** Catálogo público: sin JWT. */
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findMany(@Query('categoryId') categoryId?: string) {
    return this.productsService.findManyPublic(categoryId);
  }

  /** Detalle público por slug (URL amigable), p. ej. /tienda/productos/proteina-premium */
  @Get('by-slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findOnePublicBySlug(slug);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOnePublic(id);
  }
}
