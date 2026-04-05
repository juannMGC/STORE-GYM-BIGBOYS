import { Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/constants/roles';
import type { RequestUser } from '../common/decorators/current-user.decorator';

export type SafeUser = Omit<User, 'passwordHash'>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  toSafe(user: User): SafeUser {
    const { passwordHash: _p, ...rest } = user;
    return rest;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /**
   * Crea o actualiza el usuario local a partir del JWT de Auth0 (sub + email + rol).
   */
  async syncFromAuth0(
    payload: Record<string, unknown>,
    roleFromToken: string,
  ): Promise<RequestUser> {
    const sub = String(payload.sub ?? '');
    if (!sub) {
      throw new UnauthorizedException();
    }

    const email = this.extractEmailFromPayload(payload);
    if (!email) {
      throw new UnauthorizedException(
        'El token no incluye email. En Auth0, añade el claim "email" o configura AUTH0_EMAIL_CLAIM.',
      );
    }

    const role = this.normalizeAppRole(roleFromToken);

    let user = await this.prisma.user.findUnique({
      where: { auth0Sub: sub },
    });

    if (!user) {
      const byEmail = await this.prisma.user.findUnique({
        where: { email },
      });
      if (byEmail) {
        user = await this.prisma.user.update({
          where: { id: byEmail.id },
          data: { auth0Sub: sub, email, role },
        });
      } else {
        user = await this.prisma.user.create({
          data: {
            email,
            auth0Sub: sub,
            role,
            passwordHash: null,
          },
        });
      }
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { email, role },
      });
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  }

  private extractEmailFromPayload(payload: Record<string, unknown>): string | undefined {
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
    return undefined;
  }

  private normalizeAppRole(raw: string): string {
    if (raw === 'USER') {
      return Role.CLIENT;
    }
    if (raw === Role.ADMIN || raw === Role.CLIENT) {
      return raw;
    }
    return Role.CLIENT;
  }
}
