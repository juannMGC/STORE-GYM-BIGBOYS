import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as express from 'express';
import { AppModule } from './app.module';
import { ThrottlerExceptionFilter } from './common/filters/throttler-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  app.use(express.json({ limit: '10mb' }));
  app.use(
    express.urlencoded({
      extended: true,
      limit: '10mb',
    }),
  );

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const corsRaw =
    process.env.FRONTEND_URL?.trim() ||
    process.env.CORS_ORIGIN?.trim() ||
    'http://localhost:3000';
  const corsOrigin =
    corsRaw.includes(',') ? corsRaw.split(',').map((s) => s.trim()) : corsRaw;
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept'],
    exposedHeaders: [
      'X-RateLimit-Limit-short',
      'X-RateLimit-Remaining-short',
      'X-RateLimit-Reset-short',
      'X-RateLimit-Limit-medium',
      'X-RateLimit-Remaining-medium',
      'X-RateLimit-Reset-medium',
      'X-RateLimit-Limit-long',
      'X-RateLimit-Remaining-long',
      'X-RateLimit-Reset-long',
      'Retry-After-short',
      'Retry-After-medium',
      'Retry-After-long',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
}
bootstrap();
