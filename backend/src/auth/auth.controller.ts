import { Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  CurrentUser,
  type RequestUser,
} from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/constants/roles';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Sincroniza usuario Auth0 ↔ DB (crea o actualiza) y devuelve el registro persistido.
   * Requiere `Authorization: Bearer <access_token Auth0>` (misma audience que AUTH0_AUDIENCE).
   */
  @Post('auth0')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  postAuth0(@CurrentUser() _user: RequestUser) {
    return this.authService.getMeResponse(_user.userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: RequestUser) {
    return this.authService.getMeResponse(user.userId);
  }

  /** Verificación de rol ADMIN (útil para probar guards en Fase 1). */
  @Get('admin/ping')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  adminPing(@CurrentUser() user: RequestUser) {
    return { ok: true, user };
  }
}
