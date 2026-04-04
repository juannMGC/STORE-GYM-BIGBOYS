import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './orders.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { PatchCartItemDto } from './dto/patch-cart-item.dto';
import { PatchPaymentDto } from './dto/patch-payment.dto';
import { CurrentUser, type RequestUser } from '../common/decorators/current-user.decorator';

/**
 * Carrito = pedido en estado DRAFT. Requiere JWT (cliente o admin como comprador).
 */
@Controller('orders')
@UseGuards(AuthGuard('jwt'))
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /** Carrito actual o null si no hay borrador. */
  @Get('cart')
  getCart(@CurrentUser() user: RequestUser) {
    return this.ordersService.getCart(user.userId);
  }

  @Post('cart/items')
  addItem(@CurrentUser() user: RequestUser, @Body() dto: AddCartItemDto) {
    return this.ordersService.addCartItem(user.userId, dto);
  }

  @Patch('cart/items/:itemId')
  patchItem(
    @CurrentUser() user: RequestUser,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: PatchCartItemDto,
  ) {
    return this.ordersService.patchCartItem(user.userId, itemId, dto);
  }

  @Delete('cart/items/:itemId')
  removeItem(
    @CurrentUser() user: RequestUser,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.ordersService.removeCartItem(user.userId, itemId);
  }

  /** Forma de pago sobre el carrito (DRAFT). */
  @Patch('cart/payment')
  patchPayment(@CurrentUser() user: RequestUser, @Body() dto: PatchPaymentDto) {
    return this.ordersService.patchPayment(user.userId, dto);
  }

  /** DRAFT → PENDING (requiere ítems + paymentMethod). */
  @Post('cart/confirm')
  confirm(@CurrentUser() user: RequestUser) {
    return this.ordersService.confirmCart(user.userId);
  }
}
