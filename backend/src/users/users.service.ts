import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/constants/roles';

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

  async findByAuth0Id(auth0Id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { auth0Id } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async createFromAuth0(data: {
    email: string;
    auth0Id: string;
    name?: string | null;
    role: string;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        auth0Id: data.auth0Id,
        name: data.name ?? null,
        role: data.role,
        passwordHash: null,
      },
    });
  }

  async updateUserAuth0(
    userId: string,
    data: { email: string; name?: string | null; role: string },
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        email: data.email,
        name: data.name ?? undefined,
        role: data.role,
      },
    });
  }

  async linkAuth0Account(
    userId: string,
    data: {
      auth0Id: string;
      email: string;
      name?: string | null;
      role: string;
    },
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        auth0Id: data.auth0Id,
        email: data.email,
        name: data.name ?? undefined,
        role: data.role,
      },
    });
  }

  normalizeAppRole(raw: string): string {
    if (raw === 'USER') {
      return Role.CLIENT;
    }
    if (raw === Role.ADMIN || raw === Role.CLIENT) {
      return raw;
    }
    return Role.CLIENT;
  }
}
