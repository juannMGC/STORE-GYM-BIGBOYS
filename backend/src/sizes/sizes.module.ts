import { Module } from '@nestjs/common';
import { SizesService } from './sizes.service';
import { SizesController } from './sizes.controller';
import { AdminSizesController } from './admin-sizes.controller';

@Module({
  controllers: [SizesController, AdminSizesController],
  providers: [SizesService],
  exports: [SizesService],
})
export class SizesModule {}
