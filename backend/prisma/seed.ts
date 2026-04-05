/**
 * Seed: admin + categoría/producto demo.
 * Producción: ejecutar como tarea puntual (`npx prisma db seed`) con ADMIN_PASSWORD fuerte;
 * no commitear contraseñas reales.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@bigboys.local';
  const password = process.env.ADMIN_PASSWORD ?? 'ChangeMe123!';
  const hash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash: hash,
      role: 'ADMIN',
    },
    update: {
      passwordHash: hash,
      role: 'ADMIN',
    },
  });

  console.log(`Seed OK: admin user ${email}`);

  const category = await prisma.category.upsert({
    where: { slug: 'suplementacion' },
    create: {
      name: 'Suplementación',
      slug: 'suplementacion',
    },
    update: {
      name: 'Suplementación',
    },
  });

  await prisma.product.upsert({
    where: { slug: 'nombreproducto' },
    create: {
      title: 'Proteína Premium BIG BOIS',
      slug: 'nombreproducto',
      description:
        'Proteína de alto valor biológico para recuperación muscular. Incluye presentación tipo bote, shaker y dosificador — ideal para entrenamiento serio en BIG BOIS GIM.',
      price: 189900,
      categoryId: category.id,
      images: {
        create: [
          {
            url: '/products/nombreproducto.jpg',
            sortOrder: 0,
          },
        ],
      },
    },
    update: {
      title: 'Proteína Premium BIG BOIS',
      description:
        'Proteína de alto valor biológico para recuperación muscular. Incluye presentación tipo bote, shaker y dosificador — ideal para entrenamiento serio en BIG BOIS GIM.',
      price: 189900,
      categoryId: category.id,
    },
  });

  const demo = await prisma.product.findUnique({
    where: { slug: 'nombreproducto' },
    include: { images: true },
  });
  if (demo && demo.images.length === 0) {
    await prisma.productImage.create({
      data: {
        productId: demo.id,
        url: '/products/nombreproducto.jpg',
        sortOrder: 0,
      },
    });
  }

  console.log('Seed OK: categoría suplementación + producto nombreproducto (/tienda/productos/nombreproducto)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
