"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminTableSkeleton } from "@/components/admin/table-skeleton";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { Size } from "@/lib/types";

type Toast = { type: "ok" | "err"; text: string } | null;

type ModalMode = "create" | "edit" | null;

export default function AdminTallasPage() {
  const [rows, setRows] = useState<Size[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast>(null);
  const [modal, setModal] = useState<ModalMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const showToast = useCallback((t: Toast) => {
    setToast(t);
    if (t) setTimeout(() => setToast(null), 4200);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Size[]>("/sizes");
      setRows(data);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "No se pudieron cargar las tallas";
      showToast({ type: "err", text: msg });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setName("");
    setCode("");
    setModal("create");
  }

  function openEdit(s: Size) {
    setEditingId(s.id);
    setName(s.name);
    setCode(s.code);
    setModal("edit");
  }

  function closeModal() {
    setModal(null);
    setEditingId(null);
  }

  async function submitModal() {
    const trimmedName = name.trim();
    const trimmedCode = code.trim();
    if (!trimmedName) {
      showToast({ type: "err", text: "El nombre es obligatorio." });
      return;
    }
    if (!trimmedCode) {
      showToast({ type: "err", text: "El código es obligatorio (único, ej. s, xl, 250g)." });
      return;
    }
    setSaving(true);
    try {
      if (modal === "create") {
        await apiFetch<Size>("/admin/sizes", {
          method: "POST",
          body: JSON.stringify({ name: trimmedName, code: trimmedCode }),
        });
        showToast({ type: "ok", text: "Talla creada." });
      } else if (modal === "edit" && editingId) {
        await apiFetch<Size>(`/admin/sizes/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify({ name: trimmedName, code: trimmedCode }),
        });
        showToast({ type: "ok", text: "Talla actualizada." });
      }
      setModal(null);
      setEditingId(null);
      await load();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Error al guardar";
      showToast({ type: "err", text: msg });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(s: Size) {
    const ok = window.confirm(
      `¿Eliminar “${s.name}” (${s.code})? Solo si no está en productos ni pedidos.`,
    );
    if (!ok) return;
    try {
      await apiFetch(`/admin/sizes/${s.id}`, { method: "DELETE" });
      showToast({ type: "ok", text: "Talla eliminada." });
      await load();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "No se pudo eliminar";
      showToast({ type: "err", text: msg });
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-4xl uppercase tracking-wide text-white">Tallas</h1>
          <p className="mt-1 text-sm text-zinc-500">
            <Link href="/admin" className="text-brand-yellow hover:underline">
              Admin
            </Link>
            {" · "}
            Nombre visible y código único. La API actual no incluye descripción.
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-brand shrink-0">
          Nueva talla
        </button>
      </div>

      {loading ? (
        <div className="mt-8">
          <AdminTableSkeleton />
        </div>
      ) : (
        <div className="panel-brand mt-8 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b-2 border-brand-border text-xs uppercase tracking-wide text-zinc-500">
                <th className="p-4 font-medium">Nombre</th>
                <th className="p-4 font-medium">Código</th>
                <th className="p-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-zinc-500">
                    No hay tallas. Creá la primera.
                  </td>
                </tr>
              ) : (
                rows.map((s) => (
                  <tr key={s.id} className="border-b border-brand-border">
                    <td className="p-4 font-medium text-zinc-100">{s.name}</td>
                    <td className="p-4 font-mono text-sm text-zinc-400">{s.code}</td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(s)}
                        className="mr-2 text-brand-yellow hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(s)}
                        className="text-brand-red hover:underline"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="panel-brand w-full max-w-md p-6 shadow-[8px_8px_0_0_rgba(0,0,0,0.5)]">
            <h2 className="font-display text-2xl uppercase text-white">
              {modal === "create" ? "Nueva talla" : "Editar talla"}
            </h2>
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Nombre
                </label>
                <input
                  className="input-brand mt-1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='ej. "M", "XL", "250 g"'
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Código (único)
                </label>
                <input
                  className="input-brand mt-1 font-mono"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="ej. m, xl, 250g"
                />
              </div>
            </div>
            <div className="mt-8 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="btn-brand-outline px-4 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void submitModal()}
                disabled={saving}
                className="btn-brand px-4 py-2 text-sm disabled:opacity-50"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 z-[250] max-w-md -translate-x-1/2 px-4 ${
            toast.type === "ok"
              ? "border-2 border-brand-yellow/60 bg-brand-steel text-brand-yellow"
              : "border-2 border-brand-red/60 bg-brand-steel text-brand-red"
          } py-3 text-center text-sm shadow-lg`}
          role="status"
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
