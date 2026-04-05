import { AuthGuard } from '@nestjs/passport';

/** Guard de Passport para la estrategia registrada como `jwt` (tokens emitidos por Auth0). */
export const JwtAuthGuard = AuthGuard('jwt');
