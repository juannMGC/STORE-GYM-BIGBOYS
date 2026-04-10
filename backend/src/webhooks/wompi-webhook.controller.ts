import {
  Body,
  Controller,
  HttpCode,
  Post,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { verifyWompiEventChecksum } from '../wompi/wompi-event-verify';

@Controller('webhooks')
export class WompiWebhookController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('wompi')
  @HttpCode(200)
  async handleWompi(@Body() body: Record<string, unknown>) {
    const secret = process.env.WOMPI_EVENTS_KEY?.trim();
    if (!secret) {
      throw new ServiceUnavailableException('WOMPI_EVENTS_KEY no configurada');
    }
    if (!verifyWompiEventChecksum(body, secret)) {
      throw new UnauthorizedException('Firma de evento inválida');
    }

    const event = body.event as string | undefined;
    if (event !== 'transaction.updated') {
      return { ok: true, ignored: true };
    }

    const data = body.data as
      | { transaction?: { reference?: string; status?: string; amount_in_cents?: number } }
      | undefined;
    const tx = data?.transaction;
    if (!tx?.reference || tx.status === undefined) {
      return { ok: true };
    }

    const amount = Number(tx.amount_in_cents ?? 0);
    return this.ordersService.applyWompiTransaction(
      tx.reference,
      String(tx.status),
      amount,
    );
  }
}
