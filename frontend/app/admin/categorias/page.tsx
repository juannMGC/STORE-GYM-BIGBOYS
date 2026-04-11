"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminTableSkeleton } from "@/components/admin/table-skeleton";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { Category } from "@/lib/types";

type ModalMode = "create" | "edit" | null;

type FormFeedback = { type: "ok" | "err"; text: string } | null;

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminCategoriasPage() {
  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageBroken, setImageBroken] = useState(false);
  const [slugManual, setSlugManual] = useState(false);
  const [formFeedback, setFormFeedback] = useState<FormFeedback>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const data = await apiFetch<Category[]>("/categories");
      setRows(data);
    } catch (e) {
      setListError(e instanceof ApiError ? e.message : "No se pudieron cargar las categorías");
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
    setSlug("");
    setDescription("");
    setSlugManual(false);
    setFormFeedback(null);
    setModal("create");
  }

  function openEdit(c: Category) {
    setEditingId(c.id);
    setName(c.name);
    setSlug(c.slug ?? "");
    setDescription(c.description ?? "");
    setImageUrl(c.imageUrl?.trim() ?? "");
    setImageBroken(false);
    setSlugManual(true);
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
    if (!slugManual) {
      setSlug(slugify(v));
    }
  }

  function onSlugChange(v: string) {
    setSlugManual(true);
    setSlug(v);
  }

  async function submitModal() {
    setFormFeedback(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormFeedback({ type: "err", text: "El nombre es obligatorio." });
      return;
    }
    const slugTrim = slug.trim();
    const resolvedSlug = slugTrim || slugify(trimmedName) || undefined;
    const descTrim = description.trim();
    const imgTrim = imageUrl.trim();
    setSaving(true);
    try {
      if (modal === "create") {
        await apiFetch<Category>("/admin/categories", {
          method: "POST",
          body: JSON.stringify({
            name: trimmedName,
            ...(resolvedSlug ? { slug: resolvedSlug } : {}),
            ...(descTrim ? { description: descTrim } : {}),
            ...(imgTrim ? { imageUrl: imgTrim } : {}),
          }),
        });
      } else if (modal === "edit" && editingId) {
        await apiFetch<Category>(`/admin/categories/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: trimmedName,
            slug: resolvedSlug ?? null,
            description: descTrim || null,
            imageUrl: imgTrim || null,
          }),
        });
      }
      await load();
      setFormFeedback({
        type: "ok",
        text: modal === "create" ? "Categoría creada." : "Categoría actualizada.",
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

  async function handleDelete(c: Category) {
    if (!window.confirm(`¿Eliminar “${c.name}”?`)) return;
    try {
      await apiFetch(`/admin/categories/${c.id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setListError(e instanceof ApiError ? e.message : "No se pudo eliminar");
    }
  }

  const rowBorder = "border-b border-[#2a2a2a]";

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-4xl uppercase tracking-wide text-white">
            Categorías
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            <Link href="/admin" className="text-brand-yellow hover:underline">
              Admin
            </Link>
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-brand shrink-0">
          Nueva categoría
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
        <div className="panel-brand mt-8 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b-2 border-[#2a2a2a] text-xs uppercase tracking-wide text-zinc-500">
                <th className="p-4 font-medium">Nombre</th>
                <th className="p-4 font-medium">Slug</th>
                <th className="p-4 font-medium">Descripción</th>
                <th className="p-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-500">
                    No hay categorías. Creá la primera.
                  </td>
                </tr>
              ) : (
                rows.map((c) => (
                  <tr key={c.id} className={rowBorder}>
                    <td className="p-4 font-medium text-zinc-100">{c.name}</td>
                    <td className="p-4 font-mono text-sm text-zinc-400">{c.slug ?? "—"}</td>
                    <td className="max-w-xs p-4 text-zinc-400">
                      <span className="line-clamp-2">{c.description?.trim() || "—"}</span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        className="mr-2 text-brand-yellow hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(c)}
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
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cat-modal-title"
        >
          <div className="panel-brand w-full max-w-md border-[#2a2a2a] p-6 shadow-[8px_8px_0_0_rgba(0,0,0,0.5)]">
            <h2
              id="cat-modal-title"
              className="font-display text-2xl uppercase text-white"
            >
              {modal === "create" ? "Nueva categoría" : "Editar categoría"}
            </h2>
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Nombre <span className="text-brand-red">*</span>
                </label>
                <input
                  className="input-brand mt-1 w-full"
                  value={name}
                  onChange={(e) => onNameChange(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Slug
                </label>
                <input
                  className="input-brand mt-1 w-full font-mono text-sm"
                  value={slug}
                  onChange={(e) => onSlugChange(e.target.value)}
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
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  URL de imagen
                </label>
                <div className="mt-1 flex gap-3">
                  <input
                    className="input-brand min-w-0 flex-1"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://…"
                  />
                  {imageUrl.trim() && !imageBroken ? (
                    <div className="shrink-0 overflow-hidden border-2 border-brand-border bg-brand-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl.trim()}
                        alt=""
                        style={{ width: 80, height: 80, objectFit: "cover" }}
                        onError={() => setImageBroken(true)}
                      />
                    </div>
                  ) : null}
                </div>
                {imageUrl.trim() && imageBroken ? (
                  <p className="mt-1 text-xs text-brand-red">No se pudo cargar la imagen.</p>
                ) : null}
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
    </div>
  );
}
