import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, type RequestUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/constants/roles';
import { RolesGuard } from '../common/guards/roles.guard';
import { BroadcastPushDto } from './dto/broadcast-push.dto';
import { SendToUsersDto } from './dto/send-to-users.dto';
import { SubscribePushDto, UnsubscribePushDto } from './dto/subscribe-push.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  subscribe(
    @Body() body: SubscribePushDto,
    @CurrentUser() user: RequestUser,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.notificationsService.saveSubscription(
      user.userId,
      body.subscription,
      userAgent,
    );
  }

  @Delete('unsubscribe')
  @UseGuards(JwtAuthGuard)
  unsubscribe(@Body() body: UnsubscribePushDto, @CurrentUser() user: RequestUser) {
    return this.notificationsService.removeSubscription(user.userId, body.endpoint);
  }

  @Post('broadcast')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  broadcast(@Body() body: BroadcastPushDto) {
    return this.notificationsService.sendToAll(body);
  }

  @Post('send-to-users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  sendToUsers(@Body() body: SendToUsersDto) {
    return this.notificationsService.sendToMultipleUsers(body);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getStats() {
    return this.notificationsService.getStats();
  }
}
