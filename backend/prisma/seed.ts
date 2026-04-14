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

  const entrenamientos = [
    {
      name: 'Entrenamiento Personalizado',
      slug: 'personalizado',
      icon: '🎯',
      description:
        'Sesiones uno a uno con tu entrenador personal.',
      longDesc:
        'Diseñado específicamente para tus objetivos, nivel físico y disponibilidad de tiempo.',
      price: 250000,
      priceLabel: 'por mes',
      featured: true,
      order: 1,
      benefits: [
        'Entrenador dedicado exclusivamente a vos',
        'Plan de entrenamiento personalizado',
        'Seguimiento nutricional básico',
        'Ajuste de rutina cada 4 semanas',
        'Acceso ilimitado al gym',
      ],
      schedules: [
        {
          day: 'Lunes a Viernes',
          startTime: '06:00',
          endTime: '21:00',
          spots: 1,
        },
        {
          day: 'Sábados',
          startTime: '08:00',
          endTime: '14:00',
          spots: 1,
        },
      ],
    },
    {
      name: 'Alto Rendimiento',
      slug: 'alto-rendimiento',
      icon: '🏆',
      description:
        'Para deportistas que buscan el máximo nivel competitivo.',
      longDesc:
        'Programa especializado para atletas con metas competitivas. Periodización avanzada y monitoreo de rendimiento.',
      price: 350000,
      priceLabel: 'por mes',
      featured: true,
      order: 2,
      benefits: [
        'Periodización deportiva avanzada',
        'Evaluación física mensual',
        'Análisis de rendimiento',
        'Preparación para competencias',
        'Nutrición deportiva especializada',
      ],
      schedules: [
        {
          day: 'Lunes, Miércoles y Viernes',
          startTime: '06:00',
          endTime: '08:00',
          spots: 8,
        },
        {
          day: 'Martes y Jueves',
          startTime: '17:00',
          endTime: '19:00',
          spots: 8,
        },
      ],
    },
    {
      name: 'Mensualidad Gym',
      slug: 'mensualidad',
      icon: '📅',
      description: 'Acceso completo al gym por un mes.',
      longDesc:
        'Acceso libre a todas las instalaciones y equipos del gym. Ideal para quienes ya conocen su rutina.',
      price: 80000,
      priceLabel: 'por mes',
      featured: false,
      order: 3,
      benefits: [
        'Acceso ilimitado al gym',
        'Uso de todos los equipos',
        'Vestiarios y duchas',
        'Asesoría inicial gratuita',
        'Sin contratos de permanencia',
      ],
      schedules: [
        {
          day: 'Lunes a Viernes',
          startTime: '05:30',
          endTime: '22:00',
          spots: null,
        },
        {
          day: 'Sábados',
          startTime: '07:00',
          endTime: '15:00',
          spots: null,
        },
        {
          day: 'Domingos',
          startTime: '09:00',
          endTime: '13:00',
          spots: null,
        },
      ],
    },
    {
      name: 'Plan Anual',
      slug: 'plan-anual',
      icon: '🌟',
      description: 'El mejor precio del año con todos los beneficios.',
      longDesc:
        'Pagá un año y ahorrá hasta 3 meses de mensualidad. Nuestro plan más conveniente para los más comprometidos.',
      price: 700000,
      priceLabel: 'por año',
      featured: true,
      order: 4,
      benefits: [
        'Equivale a 9 meses pagando mensual',
        'Acceso ilimitado todo el año',
        'Congelamiento de hasta 30 días',
        'Descuento en productos de la tienda',
        '1 sesión de entrenador personal incluida',
      ],
      schedules: [
        {
          day: 'Lunes a Viernes',
          startTime: '05:30',
          endTime: '22:00',
          spots: null,
        },
        {
          day: 'Sábados',
          startTime: '07:00',
          endTime: '15:00',
          spots: null,
        },
        {
          day: 'Domingos',
          startTime: '09:00',
          endTime: '13:00',
          spots: null,
        },
      ],
    },
  ];

  for (const t of entrenamientos) {
    const training = await prisma.training.upsert({
      where: { slug: t.slug },
      create: {
        name: t.name,
        slug: t.slug,
        description: t.description,
        longDesc: t.longDesc,
        price: t.price,
        priceLabel: t.priceLabel,
        icon: t.icon,
        featured: t.featured,
        order: t.order,
        active: true,
        benefits: {
          create: t.benefits.map((text, order) => ({ text, order })),
        },
        schedules: {
          create: t.schedules.map((s) => ({
            day: s.day,
            startTime: s.startTime,
            endTime: s.endTime,
            spots: s.spots,
          })),
        },
      },
      update: {
        name: t.name,
        description: t.description,
        longDesc: t.longDesc,
        price: t.price,
        priceLabel: t.priceLabel,
        featured: t.featured,
        order: t.order,
        active: true,
      },
    });

    await prisma.trainingSchedule.deleteMany({ where: { trainingId: training.id } });
    await prisma.trainingBenefit.deleteMany({ where: { trainingId: training.id } });
    await prisma.trainingSchedule.createMany({
      data: t.schedules.map((s) => ({
        trainingId: training.id,
        day: s.day,
        startTime: s.startTime,
        endTime: s.endTime,
        spots: s.spots,
      })),
    });
    await prisma.trainingBenefit.createMany({
      data: t.benefits.map((text, order) => ({
        trainingId: training.id,
        text,
        order,
      })),
    });
  }

  console.log('Seed OK: 4 entrenamientos (Training + horarios + beneficios)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
