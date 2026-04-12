"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api-client";

type ReviewAdminRow = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  status: string;
  createdAt: string;
  user: { name: string | null; email: string | null };
  product: { title: string; slug: string | null };
};

type TabId = "PENDING" | "APPROVED" | "REJECTED";

function StarRow({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span style={{ color: "#f7e047", fontSize: "13px", letterSpacing: "1px" }} aria-label={`${rating} de 5`}>
      {"★".repeat(full)}
      {"☆".repeat(5 - full)}
    </span>
  );
}

export default function AdminResenasPage() {
  const [tab, setTab] = useState<TabId>("PENDING");
  const [rows, setRows] = useState<ReviewAdminRow[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refreshPendingCount = useCallback(async () => {
    try {
      const p = await apiFetch<ReviewAdminRow[]>("/reviews/admin/pending");
      setPendingCount(Array.isArray(p) ? p.length : 0);
    } catch {
      setPendingCount(0);
    }
  }, []);

  useEffect(() => {
    void refreshPendingCount();
  }, [refreshPendingCount]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === "PENDING") {
        const data = await apiFetch<ReviewAdminRow[]>("/reviews/admin/pending");
        setRows(Array.isArray(data) ? data : []);
      } else {
        const data = await apiFetch<ReviewAdminRow[]>(
          `/reviews/admin/all?status=${encodeURIComponent(tab)}`,
        );
        setRows(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudieron cargar las reseñas");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(
    id: string,
    action: "approve" | "reject" | "delete",
  ) {
    setBusyId(id);
    setError(null);
    try {
      if (action === "delete") {
        await apiFetch(`/reviews/admin/${id}`, { method: "DELETE" });
      } else if (action === "approve") {
        await apiFetch(`/reviews/admin/${id}/approve`, { method: "PATCH" });
      } else {
        await apiFetch(`/reviews/admin/${id}/reject`, { method: "PATCH" });
      }
      await load();
      await refreshPendingCount();
      window.dispatchEvent(new Event("bbg:reviews-pending-changed"));
      if (expandedId === id) setExpandedId(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error al actualizar");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-3xl uppercase tracking-wide text-white md:text-4xl">Reseñas</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Aprobá o rechazá opiniones de clientes con compra verificada.
      </p>

      <div
        className="mt-8 flex flex-wrap gap-2 border-b border-brand-border pb-4"
        role="tablist"
        aria-label="Filtrar por estado"
      >
        {(
          [
            { id: "PENDING" as const, label: "⏳ Pendientes", showBadge: true },
            { id: "APPROVED" as const, label: "✅ Aprobadas", showBadge: false },
            { id: "REJECTED" as const, label: "❌ Rechazadas", showBadge: false },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-sm border px-4 py-2 font-display text-xs uppercase tracking-wider transition ${
              tab === t.id
                ? "border-brand-red bg-brand-red text-white"
                : "border-brand-border text-zinc-300 hover:border-zinc-500"
            }`}
          >
            {t.label}
            {t.showBadge && pendingCount > 0 ? ` (${pendingCount})` : ""}
          </button>
        ))}
      </div>

      {error ? (
        <p className="mt-4 text-sm text-brand-red" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-8 text-zinc-500">Cargando…</p>
      ) : rows.length === 0 ? (
        <p className="mt-8 text-zinc-500">No hay reseñas en esta pestaña.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm text-zinc-300">
            <thead>
              <tr className="border-b border-brand-border text-xs uppercase tracking-wider text-zinc-500">
                <th className="py-3 pr-4">Producto</th>
                <th className="py-3 pr-4">Cliente</th>
                <th className="py-3 pr-4">Valoración</th>
                <th className="py-3 pr-4">Título</th>
                <th className="py-3 pr-4">Fecha</th>
                <th className="py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const open = expandedId === r.id;
                const slug = r.product.slug?.trim();
                const productHref = slug
                  ? `/tienda/productos/${encodeURIComponent(slug)}`
                  : null;
                return (
                  <Fragment key={r.id}>
                    <tr
                      className="cursor-pointer border-b border-[#1a1a1a] hover:bg-[#141414]"
                      onClick={() => setExpandedId(open ? null : r.id)}
                    >
                      <td className="max-w-[180px] py-3 pr-4 align-top">
                        {productHref ? (
                          <a
                            href={productHref}
                            className="text-brand-yellow hover:underline"
                            onClick={(e) => e.stopPropagation()}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {r.product.title}
                          </a>
                        ) : (
                          <span>{r.product.title}</span>
                        )}
                      </td>
                      <td className="max-w-[160px] py-3 pr-4 align-top">
                        <div className="font-medium text-zinc-200">{r.user.name ?? "—"}</div>
                        <div className="text-xs text-zinc-500">{r.user.email}</div>
                      </td>
                      <td className="py-3 pr-4 align-top">
                        <StarRow rating={r.rating} />
                      </td>
                      <td className="max-w-[140px] truncate py-3 pr-4 align-top">{r.title ?? "—"}</td>
                      <td className="whitespace-nowrap py-3 pr-4 align-top text-xs text-zinc-500">
                        {new Date(r.createdAt).toLocaleString("es-CO")}
                      </td>
                      <td className="py-3 align-top" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-wrap gap-1">
                          {tab === "PENDING" ? (
                            <>
                              <button
                                type="button"
                                disabled={busyId === r.id}
                                className="rounded border border-emerald-700 px-2 py-1 text-xs text-emerald-400 hover:bg-emerald-950"
                                onClick={() => void runAction(r.id, "approve")}
                              >
                                ✅ Aprobar
                              </button>
                              <button
                                type="button"
                                disabled={busyId === r.id}
                                className="rounded border border-amber-700 px-2 py-1 text-xs text-amber-400 hover:bg-amber-950"
                                onClick={() => void runAction(r.id, "reject")}
                              >
                                ❌ Rechazar
                              </button>
                            </>
                          ) : null}
                          {tab === "APPROVED" ? (
                            <button
                              type="button"
                              disabled={busyId === r.id}
                              className="rounded border border-amber-700 px-2 py-1 text-xs text-amber-400 hover:bg-amber-950"
                              onClick={() => void runAction(r.id, "reject")}
                            >
                              ❌ Rechazar
                            </button>
                          ) : null}
                          {tab === "REJECTED" ? (
                            <button
                              type="button"
                              disabled={busyId === r.id}
                              className="rounded border border-emerald-700 px-2 py-1 text-xs text-emerald-400 hover:bg-emerald-950"
                              onClick={() => void runAction(r.id, "approve")}
                            >
                              ✅ Aprobar
                            </button>
                          ) : null}
                          <button
                            type="button"
                            disabled={busyId === r.id}
                            className="rounded border border-zinc-600 px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800"
                            onClick={() => void runAction(r.id, "delete")}
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                    {open ? (
                      <tr className="border-b border-[#1a1a1a] bg-[#0c0c0c]">
                        <td colSpan={6} className="px-4 py-4 text-sm leading-relaxed text-zinc-400">
                          <span className="font-display text-xs uppercase tracking-wider text-brand-yellow">
                            Comentario
                          </span>
                          <p className="mt-2 whitespace-pre-wrap">{r.body}</p>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
