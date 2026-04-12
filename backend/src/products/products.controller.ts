import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';

/** Catálogo público: sin JWT. */
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findMany(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('sizeId') sizeId?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('inStock') inStock?: string,
    @Query('orderBy') orderBy?: string,
  ) {
    const parseNum = (v?: string): number | undefined => {
      if (v === undefined || v === '') return undefined;
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    };
    return this.productsService.findManyPublic({
      search,
      categoryId,
      sizeId: sizeId?.trim() || undefined,
      minPrice: parseNum(minPrice),
      maxPrice: parseNum(maxPrice),
      inStock: inStock === 'true',
      orderBy: orderBy?.trim() || undefined,
    });
  }

  /** Rango de precios del catálogo (sliders en tienda). */
  @Get('price-range')
  getPriceRange() {
    return this.productsService.getPriceRange();
  }

  /** Detalle público por slug (URL amigable), p. ej. /tienda/productos/proteina-premium */
  @Get('by-slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findOnePublicBySlug(slug);
  }

  /** Debe ir antes de @Get(':id') para no capturar "related" como UUID. */
  @Get(':id/related')
  getRelated(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('categoryId') categoryId: string,
    @Query('limit') limit?: string,
  ) {
    const cat = categoryId?.trim();
    if (!cat) {
      throw new BadRequestException('categoryId es obligatorio');
    }
    const n = limit !== undefined && limit !== '' ? Number(limit) : 4;
    const parsed = Number.isFinite(n) ? Math.floor(n) : 4;
    return this.productsService.getRelated(id, cat, parsed);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOnePublic(id);
  }
}
