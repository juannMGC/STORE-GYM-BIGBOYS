import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadService } from './upload.service';
import { UploadBase64Dto } from './dto/upload-base64.dto';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(
            new BadRequestException('Solo se permiten imágenes') as Error,
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }
    let safeFolder = (folder?.trim() || 'general').replace(/[^\w/-]/g, '');
    if (!safeFolder) safeFolder = 'general';
    const url = await this.uploadService.uploadImage(file, safeFolder);
    return { url };
  }

  @Post('base64')
  @Throttle({
    short: { ttl: 1000, limit: 2 },
    medium: { ttl: 60_000, limit: 20 },
    long: { ttl: 3_600_000, limit: 100 },
  })
  async uploadBase64(@Body() body: UploadBase64Dto) {
    if (!body.base64?.trim()) {
      throw new BadRequestException('No se recibió imagen en base64');
    }
    if (!body.base64.startsWith('data:image/')) {
      throw new BadRequestException(
        'Formato inválido. Debe ser data:image/...',
      );
    }
    let safeFolder = (body.folder?.trim() || 'general').replace(
      /[^\w/-]/g,
      '',
    );
    if (!safeFolder) safeFolder = 'general';
    const url = await this.uploadService.uploadBase64(body.base64, safeFolder);
    return { url };
  }
}
