import { Test, TestingModule } from '@nestjs/testing';
import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  Injectable,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';

/**
 * Flujo crítico Fase 5: usuario ADMIN en DB + categoría (API protegida con JWT/Auth0).
 * Sin token real de Auth0: se simula JwtAuthGuard inyectando `req.user` (mismo shape que Auth0Strategy).
 */
describe('Admin flow (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;

  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@bigboys.local';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'ChangeMe123!';

  let e2eAdminUserId: string;

  @Injectable()
  class E2eMockJwtGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const req = context.switchToHttp().getRequest();
      req.user = {
        userId: e2eAdminUserId,
        email: adminEmail,
        role: 'ADMIN',
      };
      return true;
    }
  }

  beforeAll(async () => {
    prisma = new PrismaClient();
    const hash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.upsert({
      where: { email: adminEmail },
      create: {
        email: adminEmail,
        passwordHash: hash,
        role: 'ADMIN',
      },
      update: {
        passwordHash: hash,
        role: 'ADMIN',
      },
    });
    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: adminEmail },
    });
    e2eAdminUserId = admin.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(E2eMockJwtGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /admin/categories con usuario ADMIN (guard simulado)', async () => {
    const slug = `e2e-${Date.now()}`;
    const catRes = await request(app.getHttpServer())
      .post('/api/admin/categories')
      .set('Authorization', 'Bearer e2e-mock-token')
      .send({ name: 'Categoría E2E', slug })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    expect(catRes.body.id).toBeTruthy();
    expect(catRes.body.name).toBe('Categoría E2E');
    expect(catRes.body.slug).toBe(slug);

    await prisma.category.deleteMany({ where: { id: catRes.body.id } });
  });
});
