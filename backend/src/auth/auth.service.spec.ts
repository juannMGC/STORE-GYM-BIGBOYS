import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { Role, type RoleValue } from '../common/constants/roles';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<Pick<
    UsersService,
    | 'normalizeAppRole'
    | 'findByAuth0Id'
    | 'findByEmail'
    | 'linkAuth0Account'
    | 'updateUserAuth0'
    | 'upsertByAuth0Id'
  >>;

  const baseUser = {
    id: 'user-1',
    email: 'test@test.com',
    name: 'Test User',
    auth0Id: 'auth0|123',
    role: Role.CLIENT,
    avatarUrl: null as string | null,
    phone: null as string | null,
    address: null as string | null,
    department: null as string | null,
    city: null as string | null,
    neighborhood: null as string | null,
    complement: null as string | null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            normalizeAppRole: jest.fn((r: string) => r as RoleValue),
            findByAuth0Id: jest.fn(),
            findByEmail: jest.fn(),
            linkAuth0Account: jest.fn(),
            updateUserAuth0: jest.fn(),
            upsertByAuth0Id: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
    usersService = moduleRef.get(UsersService);
  });

  describe('validateAuth0UserFromPayload', () => {
    it('crea usuario nuevo si no existe (upsertByAuth0Id)', async () => {
      usersService.findByAuth0Id.mockResolvedValue(null);
      usersService.findByEmail.mockResolvedValue(null);
      usersService.upsertByAuth0Id.mockResolvedValue(baseUser);

      const payload = {
        sub: 'auth0|nuevo',
        email: 'nuevo@test.com',
        permissions: [],
      };

      const result = await authService.validateAuth0UserFromPayload(payload);

      expect(usersService.upsertByAuth0Id).toHaveBeenCalledWith(
        expect.objectContaining({
          auth0Id: 'auth0|nuevo',
          email: 'nuevo@test.com',
        }),
      );
      expect(result.userId).toBe('user-1');
      expect(result.email).toBe('test@test.com');
    });

    it('actualiza usuario existente por auth0Id', async () => {
      usersService.findByAuth0Id.mockResolvedValue(baseUser);
      usersService.updateUserAuth0.mockResolvedValue({
        ...baseUser,
        email: 'updated@test.com',
      });

      const payload = {
        sub: 'auth0|123',
        email: 'updated@test.com',
        permissions: [],
      };

      const result = await authService.validateAuth0UserFromPayload(payload);

      expect(usersService.updateUserAuth0).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ email: 'updated@test.com' }),
      );
      expect(result.email).toBe('updated@test.com');
    });

    it('vincula cuenta Auth0 cuando el email ya existe sin auth0Id', async () => {
      usersService.findByAuth0Id.mockResolvedValue(null);
      usersService.findByEmail.mockResolvedValue({
        ...baseUser,
        auth0Id: null,
      });
      usersService.linkAuth0Account.mockResolvedValue(baseUser);

      const payload = {
        sub: 'auth0|link',
        email: 'test@test.com',
        permissions: [],
      };

      await authService.validateAuth0UserFromPayload(payload);

      expect(usersService.linkAuth0Account).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ auth0Id: 'auth0|link' }),
      );
    });

    it('lanza ConflictException si el email pertenece a otro auth0Id', async () => {
      usersService.findByAuth0Id.mockResolvedValue(null);
      usersService.findByEmail.mockResolvedValue({
        ...baseUser,
        auth0Id: 'auth0|otro',
      });

      await expect(
        authService.validateAuth0UserFromPayload({
          sub: 'auth0|nuevo',
          email: 'test@test.com',
          permissions: [],
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('fuerza rol ADMIN si el email coincide con ADMIN_EMAIL', async () => {
      const prev = process.env.ADMIN_EMAIL;
      process.env.ADMIN_EMAIL = 'admin@bigboys.local';

      usersService.findByAuth0Id.mockResolvedValue(null);
      usersService.findByEmail.mockResolvedValue(null);
      usersService.upsertByAuth0Id.mockResolvedValue({
        ...baseUser,
        email: 'admin@bigboys.local',
        role: Role.ADMIN,
      });

      try {
        await authService.validateAuth0UserFromPayload({
          sub: 'auth0|admin',
          email: 'admin@bigboys.local',
          permissions: [],
        });

        expect(usersService.upsertByAuth0Id).toHaveBeenCalledWith(
          expect.objectContaining({
            role: Role.ADMIN,
          }),
        );
      } finally {
        if (prev === undefined) {
          delete process.env.ADMIN_EMAIL;
        } else {
          process.env.ADMIN_EMAIL = prev;
        }
      }
    });

    it('lanza UnauthorizedException si falta sub', async () => {
      await expect(
        authService.validateAuth0UserFromPayload({ email: 'a@b.com' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
