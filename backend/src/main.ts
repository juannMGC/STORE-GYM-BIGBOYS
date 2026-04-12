import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as express from 'express';
import { AppModule } from './app.module';

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
  });
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
}
bootstrap();
