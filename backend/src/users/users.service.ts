import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
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

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async createClient(email: string, plainPassword: string): Promise<SafeUser> {
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role: Role.CLIENT,
      },
    });
    return this.toSafe(user);
  }

  async validateCredentials(
    email: string,
    plainPassword: string,
  ): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user) return null;
    const ok = await bcrypt.compare(plainPassword, user.passwordHash);
    return ok ? user : null;
  }
}
