import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import type { Response } from 'express';

@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  catch(_exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<{ url?: string }>();

    response.status(HttpStatus.TOO_MANY_REQUESTS).json({
      statusCode: 429,
      error: 'Too Many Requests',
      message:
        'Demasiadas solicitudes. Por favor esperá un momento antes de intentar de nuevo.',
      retryAfter: '60 segundos',
      timestamp: new Date().toISOString(),
      path: request.url ?? '',
    });
  }
}
