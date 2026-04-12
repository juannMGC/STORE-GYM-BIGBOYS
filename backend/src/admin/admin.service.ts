import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '../common/constants/order-status';
import { Role } from '../common/constants/roles';

const VENTAS_STATUS = [
  OrderStatus.PAID,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
] as const;

function orderItemsTotal(
  items: { priceSnapshot: number; quantity: number }[],
): number {
  return items.reduce((s, i) => s + i.priceSnapshot * i.quantity, 0);
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardMetrics() {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const inicioMesAnterior = new Date(
      ahora.getFullYear(),
      ahora.getMonth() - 1,
      1,
    );

    const pedidosMes = await this.prisma.order.findMany({
      where: {
        status: { in: [...VENTAS_STATUS] },
        createdAt: { gte: inicioMes },
      },
      include: { items: true },
    });
    const ventasTotalesMes = pedidosMes.reduce(
      (sum, order) => sum + orderItemsTotal(order.items),
      0,
    );

    const pedidosMesAnterior = await this.prisma.order.findMany({
      where: {
        status: { in: [...VENTAS_STATUS] },
        createdAt: {
          gte: inicioMesAnterior,
          lt: inicioMes,
        },
      },
      include: { items: true },
    });
    const ventasMesAnterior = pedidosMesAnterior.reduce(
      (sum, order) => sum + orderItemsTotal(order.items),
      0,
    );

    const estadosDisponibles = [
      OrderStatus.DRAFT,
      OrderStatus.PAID,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
    ];
    const pedidosPorEstado = await Promise.all(
      estadosDisponibles.map(async (status) => ({
        status,
        count: await this.prisma.order.count({ where: { status } }),
      })),
    );

    const itemsAgrupados = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          status: { in: [...VENTAS_STATUS] },
        },
      },
      _sum: { quantity: true },
      _count: { _all: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    const topProductosRaw = await Promise.all(
      itemsAgrupados.map(async (row) => {
        const product = await this.prisma.product.findUnique({
          where: { id: row.productId },
          select: {
            id: true,
            title: true,
            price: true,
            stock: true,
            images: {
              take: 1,
              orderBy: { sortOrder: 'asc' },
              select: { url: true },
            },
          },
        });
        if (!product) return null;
        return {
          id: product.id,
          name: product.title,
          imageUrl: product.images[0]?.url ?? null,
          price: product.price,
          stock: product.stock,
          totalVendido: row._sum.quantity ?? 0,
          totalPedidos: row._count._all,
        };
      }),
    );
    const topProductos = topProductosRaw.filter(
      (p): p is NonNullable<(typeof topProductosRaw)[number]> => p !== null,
    );

    const ultimosPedidos = await this.prisma.order.findMany({
      where: {
        status: { not: OrderStatus.DRAFT },
      },
      include: {
        user: { select: { name: true, email: true } },
        items: {
          include: {
            product: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const ultimosPedidosFormateados = ultimosPedidos.map((p) => ({
      id: p.id,
      idCorto: p.id.replace(/-/g, "").slice(0, 8).toUpperCase(),
      status: p.status,
      cliente: p.user?.name ?? p.user?.email ?? 'Cliente',
      email: p.user?.email,
      total: orderItemsTotal(p.items),
      cantidadItems: p.items.length,
      primerProducto: p.items[0]?.product?.title ?? '—',
      createdAt: p.createdAt,
    }));

    const usuariosNuevosMes = await this.prisma.user.count({
      where: {
        createdAt: { gte: inicioMes },
        role: Role.CLIENT,
      },
    });

    const totalUsuarios = await this.prisma.user.count({
      where: { role: Role.CLIENT },
    });

    const totalPedidosActivos = await this.prisma.order.count({
      where: {
        status: { in: [OrderStatus.PAID, OrderStatus.SHIPPED] },
      },
    });

    const productosAgotados = await this.prisma.product.count({
      where: { stock: 0 },
    });

    const variacionVentas =
      ventasMesAnterior > 0
        ? ((ventasTotalesMes - ventasMesAnterior) / ventasMesAnterior) * 100
        : null;

    return {
      ventasTotalesMes,
      ventasMesAnterior,
      variacionVentas,
      cantidadPedidosMes: pedidosMes.length,
      pedidosPorEstado: pedidosPorEstado.filter((e) => e.count > 0),
      topProductos,
      ultimosPedidos: ultimosPedidosFormateados,
      usuariosNuevosMes,
      totalUsuarios,
      totalPedidosActivos,
      productosAgotados,
      generadoEn: new Date().toISOString(),
    };
  }
}
