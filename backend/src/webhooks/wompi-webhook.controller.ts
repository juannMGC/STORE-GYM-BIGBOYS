import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';

/** Público: sin JwtAuthGuard (Wompi llama desde sus servidores). */
@Controller('webhooks')
export class WompiWebhookController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('wompi')
  @HttpCode(200)
  async handleWompi(@Body() body: Record<string, unknown>) {
    return this.ordersService.handleWompiWebhook(body);
  }
}
