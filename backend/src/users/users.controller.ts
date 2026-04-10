import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import {
  CurrentUser,
  type RequestUser,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async patchMe(
    @CurrentUser() reqUser: RequestUser,
    @Body() dto: UpdateUserDto,
  ) {
    const user = await this.usersService.updateMe(reqUser.userId, dto);
    return this.usersService.toMeResponse(user);
  }
}

