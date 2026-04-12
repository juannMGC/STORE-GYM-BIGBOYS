import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/constants/roles';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export type SafeUser = Omit<User, 'passwordHash'>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  toSafe(user: User): SafeUser {
    const { passwordHash: _p, ...rest } = user;
    return rest;
  }

  toMeResponse(user: User): {
    user: {
      id: string;
      email: string;
      role: string;
      name: string | null;
      phone: string | null;
      address: string | null;
      avatarUrl: string | null;
      createdAt: string;
    };
  } {
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        phone: user.phone,
        address: user.address,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt.toISOString(),
      },
    };
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

  async upsertByAuth0Id(data: {
    email: string;
    auth0Id: string;
    name?: string | null;
    role: string;
  }): Promise<User> {
    return this.prisma.user.upsert({
      where: { auth0Id: data.auth0Id },
      create: {
        email: data.email,
        auth0Id: data.auth0Id,
        name: data.name ?? null,
        role: data.role,
        passwordHash: null,
      },
      update: {
        email: data.email,
        name: data.name ?? undefined,
        role: data.role,
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

  async updateMe(userId: string, dto: UpdateUserDto): Promise<User> {
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      throw new NotFoundException();
    }
    const data: {
      name?: string | null;
      phone?: string | null;
    } = {};
    if (dto.name !== undefined) {
      data.name = dto.name.trim() || null;
    }
    if (dto.phone !== undefined) {
      data.phone = dto.phone.trim() || null;
    }
    if (Object.keys(data).length === 0) {
      return existing;
    }
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async updateAvatar(userId: string, dto: UpdateAvatarDto): Promise<User> {
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      throw new NotFoundException();
    }
    const trimmed = dto.avatarUrl.trim();
    if (!trimmed) {
      throw new BadRequestException('avatarUrl vacío');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: trimmed },
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
