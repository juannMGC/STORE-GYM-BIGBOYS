import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('El correo ya está registrado');
    }
    const user = await this.usersService.createClient(dto.email, dto.password);
    const accessToken = await this.signToken(user.id, user.email, user.role);
    return { accessToken, user };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.validateCredentials(
      dto.email,
      dto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const accessToken = await this.signToken(user.id, user.email, user.role);
    return {
      accessToken,
      user: this.usersService.toSafe(user),
    };
  }

  private signToken(userId: string, email: string, role: string) {
    return this.jwtService.signAsync({
      sub: userId,
      email,
      role,
    });
  }
}
