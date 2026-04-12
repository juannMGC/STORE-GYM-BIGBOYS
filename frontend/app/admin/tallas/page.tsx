"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { AdminTableSkeleton } from "@/components/admin/table-skeleton";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { Size } from "@/lib/types";

type ModalMode = "create" | "edit" | null;

type FormFeedback = { type: "ok" | "err"; text: string } | null;

/** Código único derivado del nombre (sin guiones; ej. "250 g" → "250g"). */
function codeFromName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export default function AdminTallasPage() {
  const [rows, setRows] = useState<Size[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [codeManual, setCodeManual] = useState(false);
  const [formFeedback, setFormFeedback] = useState<FormFeedback>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const data = await apiFetch<Size[]>("/sizes");
      setRows(data);
    } catch (e) {
      setListError(e instanceof ApiError ? e.message : "No se pudieron cargar las tallas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setName("");
    setCode("");
    setDescription("");
    setCodeManual(false);
    setFormFeedback(null);
    setModal("create");
  }

  function openEdit(s: Size) {
    setEditingId(s.id);
    setName(s.name);
    setCode(s.code);
    setDescription(s.description ?? "");
    setCodeManual(true);
    setFormFeedback(null);
    setModal("edit");
  }

  function closeModal() {
    setModal(null);
    setEditingId(null);
    setFormFeedback(null);
  }

  function onNameChange(v: string) {
    setName(v);
    if (!codeManual) {
      setCode(codeFromName(v));
    }
  }

  function onCodeChange(v: string) {
    setCodeManual(true);
    setCode(v);
  }

  async function submitModal() {
    setFormFeedback(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormFeedback({ type: "err", text: "El nombre es obligatorio." });
      return;
    }
    const codeTrim = code.trim();
    const resolvedCode = codeTrim || codeFromName(trimmedName);
    if (!resolvedCode) {
      setFormFeedback({
        type: "err",
        text: "El código no puede quedar vacío (se genera desde el nombre).",
      });
      return;
    }
    const descTrim = description.trim();
    setSaving(true);
    try {
      if (modal === "create") {
        await apiFetch<Size>("/admin/sizes", {
          method: "POST",
          body: JSON.stringify({
            name: trimmedName,
            code: resolvedCode,
            ...(descTrim ? { description: descTrim } : {}),
          }),
        });
      } else if (modal === "edit" && editingId) {
        await apiFetch<Size>(`/admin/sizes/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: trimmedName,
            code: resolvedCode,
            description: descTrim || null,
          }),
        });
      }
      await load();
      setFormFeedback({
        type: "ok",
        text: modal === "create" ? "Talla creada." : "Talla actualizada.",
      });
      await new Promise((r) => setTimeout(r, 650));
      closeModal();
      return;
    } catch (e) {
      setFormFeedback({
        type: "err",
        text: e instanceof ApiError ? e.message : "Error al guardar",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(s: Size) {
    if (!window.confirm(`¿Eliminar “${s.name}” (${s.code})?`)) return;
    try {
      await apiFetch(`/admin/sizes/${s.id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setListError(e instanceof ApiError ? e.message : "No se pudo eliminar");
    }
  }

  const rowBorder = "border-b border-[#2a2a2a]";

  return (
    <div>
      <div style={{ padding: "16px 0 8px", marginBottom: "8px" }}>
        <BackButton href="/admin" label="← Dashboard" />
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-4xl uppercase tracking-wide text-white">Tallas</h1>
          <p className="mt-1 text-sm text-zinc-500">
            <Link href="/admin" className="text-brand-yellow hover:underline">
              Admin
            </Link>
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-brand shrink-0">
          Nueva talla
        </button>
      </div>

      {listError && (
        <p className="mt-6 text-sm text-brand-red" role="alert">
          {listError}
        </p>
      )}

      {loading ? (
        <div className="mt-8">
          <AdminTableSkeleton />
        </div>
      ) : (
        <div className="admin-table-scroll panel-brand mt-8 overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b-2 border-[#2a2a2a] text-xs uppercase tracking-wide text-zinc-500">
                <th className="p-4 font-medium">Nombre</th>
                <th className="p-4 font-medium">Código</th>
                <th className="p-4 font-medium">Descripción</th>
                <th className="p-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-500">
                    No hay tallas. Creá la primera.
                  </td>
                </tr>
              ) : (
                rows.map((s) => (
                  <tr key={s.id} className={rowBorder}>
                    <td className="p-4 font-medium text-zinc-100">{s.name}</td>
                    <td className="p-4 font-mono text-sm text-zinc-400">{s.code}</td>
                    <td className="max-w-xs p-4 text-zinc-400">
                      <span className="line-clamp-2">{s.description?.trim() || "—"}</span>
                    </td>
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
          role="dialog"
          aria-modal="true"
          aria-labelledby="size-modal-title"
          className="admin-modal-overlay flex items-start justify-center overflow-y-auto p-2 sm:items-center sm:p-5"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "rgba(0,0,0,0.85)",
          }}
        >
          <div
            className="admin-modal-container flex flex-col"
            style={{
              width: "100%",
              maxWidth: "448px",
              marginTop: "auto",
              marginBottom: "auto",
              backgroundColor: "#1a1a1a",
              border: "1px solid #2a2a2a",
              borderRadius: "4px",
            }}
          >
            <div
              className="flex shrink-0 items-center justify-between gap-3"
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid #2a2a2a",
              }}
            >
              <h2
                id="size-modal-title"
                className="font-display text-xl uppercase text-white sm:text-2xl"
              >
                {modal === "create" ? "Nueva talla" : "Editar talla"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="shrink-0 rounded border-2 border-[#2a2a2a] px-2.5 py-1 font-display text-lg leading-none text-brand-yellow transition hover:border-brand-yellow hover:bg-brand-yellow/10 disabled:opacity-50"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <div className="space-y-4" style={{ padding: "24px" }}>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Nombre <span className="text-brand-red">*</span>
                </label>
                <input
                  className="input-brand mt-1 w-full"
                  value={name}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder='ej. "M", "XL", "250 g"'
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Código (único)
                </label>
                <input
                  className="input-brand mt-1 w-full font-mono text-sm"
                  value={code}
                  onChange={(e) => onCodeChange(e.target.value)}
                  placeholder="se genera desde el nombre"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Descripción
                </label>
                <textarea
                  className="input-brand mt-1 min-h-[88px] w-full resize-y"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              {formFeedback && (
                <p
                  className={
                    formFeedback.type === "ok" ? "text-sm text-brand-yellow" : "text-sm text-brand-red"
                  }
                  role="status"
                >
                  {formFeedback.text}
                </p>
              )}
            </div>
            <div
              className="flex w-full shrink-0 flex-col gap-3 sm:flex-row sm:justify-end"
              style={{
                padding: "16px 24px",
                borderTop: "1px solid #2a2a2a",
              }}
            >
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="btn-brand-outline w-full px-4 py-2 text-sm sm:w-auto"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void submitModal()}
                disabled={saving}
                className="btn-brand w-full px-4 py-2 text-sm disabled:opacity-50 sm:w-auto"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
