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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, type RequestUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/constants/roles';
import { RolesGuard } from '../common/guards/roles.guard';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  validate(@Body() body: ValidateCouponDto) {
    return this.couponsService.validateCoupon(body.code, body.orderTotal);
  }

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  apply(@Body() body: ApplyCouponDto, @CurrentUser() user: RequestUser) {
    return this.couponsService.applyCoupon(body.orderId, body.code, user.userId);
  }

  @Delete('remove/:orderId')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.couponsService.removeCoupon(orderId, user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAll() {
    return this.couponsService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto);
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  toggle(@Param('id', ParseUUIDPipe) id: string) {
    return this.couponsService.toggle(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.couponsService.remove(id);
  }
}
