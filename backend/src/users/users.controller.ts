import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  CurrentUser,
  type RequestUser,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { RolesGuard } from '../common/guards/roles.guard';
import { UsersService } from './users.service';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  search(@Query('q') q?: string) {
    return this.usersService.searchUsers(q ?? '');
  }

  @Patch('me/avatar')
  @Throttle({
    short: { ttl: 1000, limit: 1 },
    medium: { ttl: 60_000, limit: 10 },
  })
  @UseGuards(JwtAuthGuard)
  async patchAvatar(
    @CurrentUser() reqUser: RequestUser,
    @Body() dto: UpdateAvatarDto,
  ) {
    const user = await this.usersService.updateAvatar(reqUser.userId, dto);
    return this.usersService.toMeResponse(user);
  }

  @Patch('me')
  @Throttle({
    short: { ttl: 1000, limit: 2 },
    medium: { ttl: 60_000, limit: 15 },
  })
  @UseGuards(JwtAuthGuard)
  async patchMe(
    @CurrentUser() reqUser: RequestUser,
    @Body() dto: UpdateUserDto,
  ) {
    const user = await this.usersService.updateMe(reqUser.userId, dto);
    return this.usersService.toMeResponse(user);
  }
}

