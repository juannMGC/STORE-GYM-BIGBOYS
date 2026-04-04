import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { AppModule } from '../src/app.module';

/**
 * Flujo crítico Fase 5: login como ADMIN + creación de categoría (API protegida).
 * Requiere `DATABASE_URL` y las mismas variables que el seed (`ADMIN_EMAIL`, `ADMIN_PASSWORD`).
 */
describe('Admin flow (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaClient;

  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@bigboys.local';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'ChangeMe123!';

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
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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

  it('POST /auth/login (admin) y POST /admin/categories', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    expect(loginRes.body.accessToken).toBeTruthy();
    expect(loginRes.body.user?.role).toBe('ADMIN');

    const slug = `e2e-${Date.now()}`;
    const catRes = await request(app.getHttpServer())
      .post('/api/admin/categories')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
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
