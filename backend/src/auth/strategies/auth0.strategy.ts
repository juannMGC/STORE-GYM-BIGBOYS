import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';
import { UsersService } from '../../users/users.service';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/constants/roles';

const DEFAULT_ROLES_CLAIM = 'https://myapp.com/roles';

type Auth0JwtPayload = {
  sub?: string;
  email?: string;
  [key: string]: unknown;
};

@Injectable()
export class Auth0Strategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const domain = configService.getOrThrow<string>('AUTH0_DOMAIN');
    const audience = configService.getOrThrow<string>('AUTH0_AUDIENCE');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      audience,
      issuer: `https://${domain}/`,
      algorithms: ['RS256'],
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${domain}/.well-known/jwks.json`,
      }),
    });
  }

  async validate(payload: Auth0JwtPayload): Promise<RequestUser> {
    if (!payload?.sub) {
      throw new UnauthorizedException();
    }

    const rolesClaim =
      this.configService.get<string>('AUTH0_ROLES_CLAIM') ??
      DEFAULT_ROLES_CLAIM;
    const roleFromToken = this.parseRolesClaim(payload, rolesClaim);

    return this.usersService.syncFromAuth0(payload, roleFromToken);
  }

  private parseRolesClaim(
    payload: Auth0JwtPayload,
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
