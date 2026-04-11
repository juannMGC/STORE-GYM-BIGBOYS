import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { RolesGuard } from '../common/guards/roles.guard';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { PatchCartItemDto } from './dto/patch-cart-item.dto';
import { PatchPaymentDto } from './dto/patch-payment.dto';
import { WompiSignatureDto } from './dto/wompi-signature.dto';
import { CurrentUser, type RequestUser } from '../common/decorators/current-user.decorator';

/**
 * Carrito = pedido en estado DRAFT. Requiere Bearer token de Auth0 (cliente o admin como comprador).
 */
@Controller('orders')
@UseGuards(JwtAuthGuard)
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

  /** Listado de pedidos del usuario autenticado (sin borradores). */
  @Get('my-orders')
  getMyOrders(@CurrentUser() user: RequestUser) {
    return this.ordersService.getOrdersByUser(user.userId);
  }

  /** Solo ADMIN. Un CLIENT recibe 403 Forbidden. */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }

  @Post(':orderId/wompi-signature')
  @HttpCode(200)
  wompiSignature(
    @CurrentUser() user: RequestUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: WompiSignatureDto,
  ) {
    return this.ordersService.buildWompiSignature(user.userId, orderId, dto);
  }

  /** Detalle de un pedido del usuario autenticado (p. ej. tras pago Wompi). */
  @Get(':orderId')
  getOne(
    @CurrentUser() user: RequestUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.ordersService.findOneForUser(user.userId, orderId);
  }
}
