import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly configured: boolean;

  constructor() {
    const cloud_name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const api_key = process.env.CLOUDINARY_API_KEY?.trim();
    const api_secret = process.env.CLOUDINARY_API_SECRET?.trim();

    if (cloud_name && api_key && api_secret) {
      cloudinary.config({
        cloud_name,
        api_key,
        api_secret,
      });
      this.configured = true;
      this.logger.log('✅ Cloudinary configurado');
    } else {
      this.configured = false;
      this.logger.warn(
        'Cloudinary: faltan CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET',
      );
    }
  }

  private ensureConfigured(): void {
    if (!this.configured) {
      throw new ServiceUnavailableException('Cloudinary no está configurado');
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    folder = 'general',
  ): Promise<string> {
    this.ensureConfigured();
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `bigboys/${folder}`,
          resource_type: 'image',
          transformation: [
            { quality: 'auto', fetch_format: 'auto' },
            { width: 1200, crop: 'limit' },
          ],
        },
        (error, result) => {
          if (error) {
            this.logger.error('Error Cloudinary:', error);
            reject(error);
          } else {
            const url = result?.secure_url ?? '';
            this.logger.log(`✅ Imagen subida: ${url}`);
            resolve(url);
          }
        },
      );
      uploadStream.end(file.buffer);
    });
  }

  async uploadBase64(base64: string, folder = 'general'): Promise<string> {
    this.ensureConfigured();
    try {
      const result = await cloudinary.uploader.upload(base64, {
        folder: `bigboys/${folder}`,
        resource_type: 'image',
        transformation: [
          { quality: 'auto', fetch_format: 'auto' },
          { width: 1200, crop: 'limit' },
        ],
      });
      const url = result.secure_url ?? '';
      this.logger.log(`✅ Imagen subida (base64): ${url}`);
      return url;
    } catch (err: unknown) {
      this.logger.error('Error Cloudinary (base64):', err);
      throw new BadRequestException('No se pudo procesar la imagen');
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    this.ensureConfigured();
    await cloudinary.uploader.destroy(publicId);
  }
}
