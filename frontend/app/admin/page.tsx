"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch, formatShopApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

type DashboardMetrics = {
  ventasTotalesMes: number;
  ventasMesAnterior: number;
  variacionVentas: number | null;
  cantidadPedidosMes: number;
  pedidosPorEstado: { status: string; count: number }[];
  topProductos: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
    price: number;
    stock: number;
    totalVendido: number;
    totalPedidos: number;
  }>;
  ultimosPedidos: Array<{
    id: string;
    idCorto: string;
    status: string;
    cliente: string;
    email?: string;
    total: number;
    cantidadItems: number;
    primerProducto: string;
    createdAt: string;
  }>;
  usuariosNuevosMes: number;
  totalUsuarios: number;
  totalPedidosActivos: number;
  productosAgotados: number;
  generadoEn: string;
};

const ESTADOS_BARRA: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pendiente", color: "#f7e047" },
  PAID: { label: "Confirmado", color: "#60a5fa" },
  SHIPPED: { label: "Enviado", color: "#f97316" },
  DELIVERED: { label: "Entregado", color: "#22c55e" },
  CANCELLED: { label: "Cancelado", color: "#d91920" },
};

const ESTADOS_PEDIDO: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pendiente", color: "#f7e047" },
  PAID: { label: "Confirmado", color: "#60a5fa" },
  SHIPPED: { label: "Enviado", color: "#f97316" },
  DELIVERED: { label: "Entregado", color: "#22c55e" },
  CANCELLED: { label: "Cancelado", color: "#d91920" },
};

function formatCop(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AdminHomePage() {
  const { isLoggedIn, isLoading } = useAuth();
  const [metricas, setMetricas] = useState<DashboardMetrics | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarMetricas = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await apiFetch<DashboardMetrics>("/admin/dashboard");
      setMetricas(data);
    } catch (e) {
      setError(formatShopApiError(e, { sessionActive: true }));
      setMetricas(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && isLoggedIn) void cargarMetricas();
  }, [isLoggedIn, isLoading, cargarMetricas]);

  const mesTitulo = useMemo(() => {
    const s = new Intl.DateTimeFormat("es-CO", {
      month: "long",
      year: "numeric",
    }).format(new Date());
    return s.charAt(0).toUpperCase() + s.slice(1);
  }, []);

  const cards = useMemo(() => {
    if (!metricas) return [];
    const v = metricas.variacionVentas;
    const subtituloVentas =
      v != null
        ? `${v > 0 ? "↑" : "↓"} ${Math.abs(v).toFixed(1)}% vs mes anterior`
        : `${metricas.cantidadPedidosMes} pedidos`;
    return [
      {
        icono: "💰",
        titulo: "Ventas del mes",
        valor: formatCop(metricas.ventasTotalesMes),
        subtitulo: subtituloVentas,
        color: "#22c55e",
        link: undefined as string | undefined,
      },
      {
        icono: "📦",
        titulo: "Pedidos pendientes",
        valor: String(metricas.totalPedidosActivos),
        subtitulo: "Requieren atención",
        color: "#f7e047",
        link: "/admin/pedidos?status=PENDING",
      },
      {
        icono: "👥",
        titulo: "Usuarios nuevos",
        valor: `+${metricas.usuariosNuevosMes}`,
        subtitulo: `${metricas.totalUsuarios} total`,
        color: "#60a5fa",
        link: undefined as string | undefined,
      },
      {
        icono: "⚠️",
        titulo: "Productos agotados",
        valor: String(metricas.productosAgotados),
        subtitulo: "Stock en 0",
        color: "#d91920",
        link: "/admin/productos",
      },
    ];
  }, [metricas]);

  if (isLoading) {
    return (
      <div className="text-zinc-500">
        <p>Cargando…</p>
      </div>
    );
  }

  if (cargando && !metricas) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="panel-brand h-[120px] animate-pulse p-5"
            style={{ padding: "20px" }}
          />
        ))}
      </div>
    );
  }

  if (error || !metricas) {
    return (
      <div>
        <h1 className="font-display text-4xl uppercase tracking-wide text-white">Dashboard</h1>
        <p className="mt-4 text-brand-red">{error ?? "No se pudieron cargar las métricas."}</p>
        <button
          type="button"
          onClick={() => void cargarMetricas()}
          className="btn-brand mt-6"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const pedidosBarra = metricas.pedidosPorEstado.filter((e) => e.status !== "DRAFT");
  const maxCount = Math.max(...pedidosBarra.map((e) => e.count), 1);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl uppercase tracking-wide text-white">
            📊 Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Big Boys Gym · {mesTitulo}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void cargarMetricas()}
          style={{
            background: "none",
            border: "1px solid #2a2a2a",
            color: "#52525b",
            cursor: "pointer",
            padding: "6px 12px",
            fontSize: "12px",
            fontFamily: "var(--font-display)",
            letterSpacing: "1px",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#d91920";
            e.currentTarget.style.color = "#d91920";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#2a2a2a";
            e.currentTarget.style.color = "#52525b";
          }}
        >
          ↺ Actualizar
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        {cards.map((card) => (
          <div
            key={card.titulo}
            role={card.link ? "link" : undefined}
            tabIndex={card.link ? 0 : undefined}
            className="panel-brand"
            style={{
              padding: "20px",
              cursor: card.link ? "pointer" : "default",
              transition: "border-color 0.2s",
            }}
            onClick={() => {
              if (card.link) window.location.href = card.link;
            }}
            onKeyDown={(e) => {
              if (card.link && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                window.location.href = card.link;
              }
            }}
            onMouseEnter={(e) => {
              if (card.link) (e.currentTarget as HTMLDivElement).style.borderColor = card.color;
            }}
            onMouseLeave={(e) => {
              if (card.link) (e.currentTarget as HTMLDivElement).style.borderColor = "#2a2a2a";
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "12px",
              }}
            >
              <span style={{ fontSize: "24px" }}>{card.icono}</span>
              {card.link ? (
                <span style={{ color: "#52525b", fontSize: "12px" }}>→</span>
              ) : null}
            </div>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(24px, 4vw, 36px)",
                color: card.color,
                letterSpacing: "2px",
                margin: "0 0 4px",
              }}
            >
              {card.valor}
            </p>
            <p
              style={{
                color: "#52525b",
                fontSize: "12px",
                fontFamily: "var(--font-display)",
                letterSpacing: "2px",
                textTransform: "uppercase",
                marginBottom: "4px",
              }}
            >
              {card.titulo}
            </p>
            <p style={{ color: "#71717a", fontSize: "12px" }}>{card.subtitulo}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2" style={{ marginBottom: "20px" }}>
        <div className="panel-brand" style={{ padding: "24px" }}>
          <p
            style={{
              fontFamily: "var(--font-display)",
              color: "#f7e047",
              fontSize: "12px",
              letterSpacing: "3px",
              textTransform: "uppercase",
              marginBottom: "24px",
            }}
          >
            Pedidos por estado
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {pedidosBarra.map((estado) => {
              const config = ESTADOS_BARRA[estado.status];
              const porcentaje = (estado.count / maxCount) * 100;
              return (
                <div key={estado.status}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    <span style={{ color: "#e4e4e7", fontSize: "13px" }}>
                      {config?.label ?? estado.status}
                    </span>
                    <span
                      style={{
                        color: config?.color ?? "#e4e4e7",
                        fontFamily: "var(--font-display)",
                        fontSize: "14px",
                        letterSpacing: "1px",
                      }}
                    >
                      {estado.count}
                    </span>
                  </div>
                  <div
                    style={{
                      height: "8px",
                      background: "#1a1a1a",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${porcentaje}%`,
                        background: config?.color ?? "#d91920",
                        borderRadius: "4px",
                        transition: "width 0.8s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel-brand" style={{ padding: "24px" }}>
          <p
            style={{
              fontFamily: "var(--font-display)",
              color: "#f7e047",
              fontSize: "12px",
              letterSpacing: "3px",
              textTransform: "uppercase",
              marginBottom: "20px",
            }}
          >
            Top 5 productos
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {metricas.topProductos.map((producto, index) => (
              <div
                key={producto.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px",
                  background: "#1a1a1a",
                  border: "1px solid #2a2a2a",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "20px",
                    color:
                      index === 0 ? "#f7e047" : index === 1 ? "#a1a1aa" : index === 2 ? "#d97706" : "#3f3f46",
                    minWidth: "28px",
                    textAlign: "center",
                  }}
                >
                  {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                </span>
                {producto.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={producto.imageUrl}
                    alt={producto.name}
                    style={{
                      width: "48px",
                      height: "48px",
                      objectFit: "cover",
                      border: "1px solid #2a2a2a",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      background: "#111",
                      border: "1px solid #2a2a2a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#d91920",
                      fontFamily: "var(--font-display)",
                      fontSize: "18px",
                      flexShrink: 0,
                    }}
                  >
                    {producto.name?.charAt(0)}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      color: "#e4e4e7",
                      fontSize: "13px",
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {producto.name}
                  </p>
                  <p style={{ color: "#52525b", fontSize: "12px" }}>
                    {producto.totalVendido} unidades vendidas
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p
                    style={{
                      color: "#f7e047",
                      fontFamily: "var(--font-display)",
                      fontSize: "13px",
                    }}
                  >
                    ${producto.price.toLocaleString("es-CO")}
                  </p>
                  <p style={{ color: "#52525b", fontSize: "11px" }}>stock: {producto.stock}</p>
                </div>
              </div>
            ))}
            {metricas.topProductos.length === 0 ? (
              <p style={{ color: "#52525b", textAlign: "center", padding: "20px" }}>
                Aún no hay ventas registradas
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="panel-brand" style={{ padding: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-display)",
              color: "#f7e047",
              fontSize: "12px",
              letterSpacing: "3px",
              textTransform: "uppercase",
            }}
          >
            Últimos pedidos
          </p>
          <Link
            href="/admin/pedidos"
            style={{
              color: "#d91920",
              fontSize: "12px",
              fontFamily: "var(--font-display)",
              letterSpacing: "1px",
              textDecoration: "none",
            }}
          >
            Ver todos →
          </Link>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {metricas.ultimosPedidos.map((pedido) => {
            const config = ESTADOS_PEDIDO[pedido.status];
            return (
              <Link
                key={pedido.id}
                href={`/admin/pedidos/${pedido.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px",
                  background: "#1a1a1a",
                  border: "1px solid #2a2a2a",
                  textDecoration: "none",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#d91920";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#2a2a2a";
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "#52525b",
                    fontSize: "12px",
                    minWidth: "80px",
                    letterSpacing: "1px",
                  }}
                >
                  #{pedido.idCorto}
                </span>
                <span
                  style={{
                    color: "#e4e4e7",
                    fontSize: "13px",
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {pedido.cliente}
                </span>
                <span
                  style={{
                    color: "#f7e047",
                    fontFamily: "var(--font-display)",
                    fontSize: "13px",
                    minWidth: "100px",
                    textAlign: "right",
                  }}
                >
                  ${pedido.total.toLocaleString("es-CO")}
                </span>
                <span
                  style={{
                    color: config?.color ?? "#e4e4e7",
                    fontSize: "11px",
                    fontFamily: "var(--font-display)",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    minWidth: "90px",
                    textAlign: "right",
                  }}
                >
                  {config?.label ?? pedido.status}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        Datos al {new Date(metricas.generadoEn).toLocaleString("es-CO")}
      </p>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        <li>
          <Link
            href="/admin/pedidos"
            className="panel-brand block p-6 transition hover:border-brand-red"
          >
            <span className="font-display text-xl uppercase text-white">Pedidos</span>
            <span className="mt-1 block text-sm text-zinc-500">Listado y estados</span>
          </Link>
        </li>
        <li>
          <Link
            href="/admin/productos"
            className="panel-brand block p-6 transition hover:border-brand-red"
          >
            <span className="font-display text-xl uppercase text-white">Productos</span>
            <span className="mt-1 block text-sm text-zinc-500">Catálogo y stock</span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
