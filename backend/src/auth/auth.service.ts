import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/constants/roles';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Sincroniza el usuario de Auth0 con la DB: por auth0Id, por email, o creación.
   */
  async validateAuth0User(data: {
    email: string;
    sub: string;
    name?: string | null;
    roleFromToken: string;
  }): Promise<RequestUser> {
    const role = this.usersService.normalizeAppRole(data.roleFromToken);

    let user = await this.usersService.findByAuth0Id(data.sub);
    if (user) {
      user = await this.usersService.updateUserAuth0(user.id, {
        email: data.email,
        name: data.name ?? user.name,
        role,
      });
    } else {
      const byEmail = await this.usersService.findByEmail(data.email);
      if (byEmail) {
        user = await this.usersService.linkAuth0Account(byEmail.id, {
          auth0Id: data.sub,
          email: data.email,
          name: data.name ?? byEmail.name,
          role,
        });
      } else {
        user = await this.usersService.createFromAuth0({
          email: data.email,
          auth0Id: data.sub,
          name: data.name,
          role,
        });
      }
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
  }

  async validateAuth0UserFromPayload(
    payload: Record<string, unknown>,
    rolesClaimKey: string,
  ): Promise<RequestUser> {
    const sub = String(payload.sub ?? '');
    if (!sub) {
      throw new UnauthorizedException();
    }
    let email = this.extractEmailFromPayload(payload);
    if (!email) {
      const existing = await this.usersService.findByAuth0Id(sub);
      if (existing?.email) {
        email = existing.email;
      }
    }
    if (!email) {
      throw new UnauthorizedException(
        'El access token no incluye email y el usuario aún no está en la base. En Auth0: Actions → Login / Post-login → añadí el claim "email" al access token de tu API (ver comentarios en backend/.env.example). Opcional: AUTH0_EMAIL_CLAIM si usás un claim con namespace.',
      );
    }
    const name = this.extractNameFromPayload(payload);
    const roleFromToken = this.parseRolesClaim(payload, rolesClaimKey);
    return this.validateAuth0User({
      email,
      sub,
      name,
      roleFromToken,
    });
  }

  async getMeResponse(userId: string): Promise<{
    user: {
      id: string;
      email: string;
      role: string;
      name: string | null;
      createdAt: string;
    };
  }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException();
    }
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        createdAt: user.createdAt.toISOString(),
      },
    };
  }

  private extractEmailFromPayload(
    payload: Record<string, unknown>,
  ): string | undefined {
    if (typeof payload.email === 'string' && payload.email) {
      return payload.email;
    }
    const customKey = process.env.AUTH0_EMAIL_CLAIM;
    if (customKey && typeof payload[customKey] === 'string') {
      return payload[customKey] as string;
    }
    if (typeof payload['https://myapp.com/email'] === 'string') {
      return payload['https://myapp.com/email'] as string;
    }
    for (const [key, val] of Object.entries(payload)) {
      if (typeof val === 'string' && val.includes('@') && key.endsWith('/email')) {
        return val.trim();
      }
    }
    return undefined;
  }

  private extractNameFromPayload(
    payload: Record<string, unknown>,
  ): string | null | undefined {
    if (typeof payload.name === 'string' && payload.name) {
      return payload.name;
    }
    if (typeof payload.nickname === 'string' && payload.nickname) {
      return payload.nickname;
    }
    return undefined;
  }

  private parseRolesClaim(
    payload: Record<string, unknown>,
    claimKey: string,
  ): string {
    const raw = payload[claimKey];
    if (Array.isArray(raw) && raw.length > 0) {
      return String(raw[0]);
    }
    if (typeof raw === 'string') {
      return raw;
    }
    return Role.CLIENT;
  }
}
