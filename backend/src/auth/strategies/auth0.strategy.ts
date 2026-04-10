import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';
import { AuthService } from '../auth.service';

const DEFAULT_ROLES_CLAIM = 'https://myapp.com/roles';

type Auth0JwtPayload = Record<string, unknown>;

@Injectable()
export class Auth0Strategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const domain = configService.getOrThrow<string>('AUTH0_DOMAIN');
    const audience = configService.getOrThrow<string>('AUTH0_AUDIENCE');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      audience,
      /** Debe coincidir con el claim `iss` del JWT (Auth0 usa barra final). */
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

  async validate(payload: Auth0JwtPayload) {
    const rolesClaim =
      this.configService.get<string>('AUTH0_ROLES_CLAIM') ?? DEFAULT_ROLES_CLAIM;
    return this.authService.validateAuth0UserFromPayload(payload, rolesClaim);
  }
}
