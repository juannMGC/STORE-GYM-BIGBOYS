import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddProductImageDto } from './dto/add-product-image.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ReorderImagesDto } from './dto/reorder-images.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Post(':id/images')
  addImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddProductImageDto,
  ) {
    return this.productsService.addProductImage(id, dto);
  }

  @Delete(':id/images/:imageId')
  removeImage(
    @Param('id', ParseUUIDPipe) productId: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ) {
    return this.productsService.removeProductImage(productId, imageId);
  }

  @Patch(':id/images/reorder')
  reorderImages(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReorderImagesDto,
  ) {
    return this.productsService.reorderProductImages(id, dto.imageIds);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }
}
