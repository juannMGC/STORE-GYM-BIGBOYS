import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { WompiWebhookController } from './wompi-webhook.controller';

@Module({
  imports: [OrdersModule],
  controllers: [WompiWebhookController],
})
export class WebhooksModule {}
