import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ArchiveOrderDto } from './dto/archive-order.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, type RequestUser } from '../common/decorators/current-user.decorator';

@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  list(@Query('status') status?: string) {
    return this.ordersService.findAllAdmin(status);
  }

  /** Debe ir antes de `:id` para no capturar "history" como UUID. */
  @Get('history')
  listHistory() {
    return this.ordersService.listOrderHistory();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.getOrderDetailDtoById(id);
  }

  /** Misma lógica que `PATCH /api/orders/:id/status`. */
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }

  @Delete(':id')
  deleteOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
    @Body() body: ArchiveOrderDto,
  ) {
    return this.ordersService.archiveOrder(id, user.email, body?.reason);
  }
}
