"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminTableSkeleton } from "@/components/admin/table-skeleton";
import { apiFetch, ApiError } from "@/lib/api-client";
import { PRODUCT_SLUG_PATTERN, slugifyTitle } from "@/lib/slugify";
import type { Category, ProductListItem, Size } from "@/lib/types";

type Toast = { type: "ok" | "err"; text: string } | null;

type ModalMode = "create" | "edit" | null;

export default function AdminProductosPage() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [refsLoading, setRefsLoading] = useState(true);
  const [toast, setToast] = useState<Toast>(null);
  const [modal, setModal] = useState<ModalMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [slugDirty, setSlugDirty] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [imageUrl, setImageUrl] = useState("");
  const [imageBroken, setImageBroken] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [selectedSizeIds, setSelectedSizeIds] = useState<string[]>([]);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );
  const sortedSizes = useMemo(
    () => [...sizes].sort((a, b) => a.name.localeCompare(b.name)),
    [sizes],
  );

  const showToast = useCallback((t: Toast) => {
    setToast(t);
    if (t) setTimeout(() => setToast(null), 4200);
  }, []);

  const loadRefs = useCallback(async () => {
    setRefsLoading(true);
    try {
      const [c, s] = await Promise.all([
        apiFetch<Category[]>("/categories"),
        apiFetch<Size[]>("/sizes"),
      ]);
      setCategories(c);
      setSizes(s);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "No se cargaron categorías o tallas";
      showToast({ type: "err", text: msg });
    } finally {
      setRefsLoading(false);
    }
  }, [showToast]);

  const loadProducts = useCallback(async () => {
    setListLoading(true);
    try {
      const data = await apiFetch<ProductListItem[]>("/products");
      setProducts(data);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "No se pudieron cargar los productos";
      showToast({ type: "err", text: msg });
    } finally {
      setListLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadRefs();
  }, [loadRefs]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (modal !== "create" || slugDirty) return;
    const t = title.trim();
    setSlug(t ? slugifyTitle(title) : "");
  }, [title, modal, slugDirty]);

  useEffect(() => {
    setImageBroken(false);
  }, [imageUrl]);

  function openCreate() {
    setEditingId(null);
    setModal("create");
    setSlugDirty(false);
    setTitle("");
    setSlug("");
    setDescription("");
    setPrice("");
    setStock("0");
    setImageUrl("");
    setCategoryId(sortedCategories[0]?.id ?? "");
    setSelectedSizeIds([]);
  }

  function openEdit(p: ProductListItem) {
    setEditingId(p.id);
    setModal("edit");
    setSlugDirty(true);
    setTitle(p.title);
    setSlug(p.slug ?? "");
    setDescription(p.description ?? "");
    setPrice(String(p.price));
    setStock(String(p.stock ?? 0));
    setImageUrl(p.images[0]?.url ?? "");
    setCategoryId(p.categoryId);
    setSelectedSizeIds(p.sizes.map((x) => x.size.id));
  }

  function closeModal() {
    setModal(null);
    setEditingId(null);
  }

  function toggleSize(id: string) {
    setSelectedSizeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function submitModal() {
    const t = title.trim();
    if (!t) {
      showToast({ type: "err", text: "El nombre es obligatorio." });
      return;
    }
    const slugVal = slug.trim();
    if (modal === "edit" && !slugVal) {
      showToast({ type: "err", text: "El slug es obligatorio al editar." });
      return;
    }
    if (slugVal && !PRODUCT_SLUG_PATTERN.test(slugVal)) {
      showToast({
        type: "err",
        text: "Slug inválido: solo minúsculas, números y guiones.",
      });
      return;
    }
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      showToast({ type: "err", text: "Precio inválido." });
      return;
    }
    const stockNum = Math.max(0, Math.floor(Number(stock)));
    if (!Number.isFinite(stockNum)) {
      showToast({ type: "err", text: "Stock inválido." });
      return;
    }
    if (!categoryId) {
      showToast({ type: "err", text: "Elegí una categoría." });
      return;
    }

    const trimmedImg = imageUrl.trim();
    const imageUrls = trimmedImg ? [trimmedImg] : [];

    setSaving(true);
    try {
      if (modal === "create") {
        await apiFetch<ProductListItem>("/admin/products", {
          method: "POST",
          body: JSON.stringify({
            title: t,
            ...(slugVal ? { slug: slugVal } : {}),
            description: description.trim() || undefined,
            price: priceNum,
            stock: stockNum,
            categoryId,
            ...(imageUrls.length ? { imageUrls } : {}),
            sizeIds: selectedSizeIds,
          }),
        });
        showToast({ type: "ok", text: "Producto creado." });
      } else if (modal === "edit" && editingId) {
        await apiFetch<ProductListItem>(`/admin/products/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify({
            title: t,
            slug: slugVal || null,
            description: description.trim() || null,
            price: priceNum,
            stock: stockNum,
            categoryId,
            imageUrls,
            sizeIds: selectedSizeIds,
          }),
        });
        showToast({ type: "ok", text: "Producto actualizado." });
      }
      setModal(null);
      setEditingId(null);
      await loadProducts();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Error al guardar";
      showToast({ type: "err", text: msg });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: ProductListItem) {
    const ok = window.confirm(
      `¿Eliminar “${p.title}”? No se puede si figura en pedidos.`,
    );
    if (!ok) return;
    try {
      await apiFetch(`/admin/products/${p.id}`, { method: "DELETE" });
      showToast({ type: "ok", text: "Producto eliminado." });
      await loadProducts();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "No se pudo eliminar";
      showToast({ type: "err", text: msg });
    }
  }

  const loading = listLoading || refsLoading;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-4xl uppercase tracking-wide text-white">
            Productos
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            <Link href="/admin" className="text-brand-yellow hover:underline">
              Admin
            </Link>
            {" · "}
            API usa <code className="text-xs text-brand-yellow">title</code>; en el formulario
            es el nombre del producto.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          disabled={refsLoading || !sortedCategories.length}
          className="btn-brand shrink-0 disabled:opacity-50"
        >
          Nuevo producto
        </button>
      </div>

      {!sortedCategories.length && !refsLoading ? (
        <p className="mt-8 text-sm text-brand-red">
          No hay categorías. Creá al menos una en{" "}
          <Link href="/admin/categorias" className="underline">
            Categorías
          </Link>
          .
        </p>
      ) : null}

      {loading ? (
        <div className="mt-8">
          <AdminTableSkeleton />
        </div>
      ) : (
        <div className="panel-brand mt-8 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b-2 border-brand-border text-xs uppercase tracking-wide text-zinc-500">
                <th className="p-4 font-medium">Imagen</th>
                <th className="p-4 font-medium">Nombre</th>
                <th className="p-4 font-medium">Categoría</th>
                <th className="p-4 font-medium">Precio</th>
                <th className="p-4 font-medium">Stock</th>
                <th className="p-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">
                    No hay productos. Creá el primero.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const thumb = p.images[0]?.url;
                  return (
                    <tr key={p.id} className="border-b border-brand-border">
                      <td className="p-4">
                        <div className="relative h-12 w-12 overflow-hidden border-2 border-brand-border bg-brand-black">
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={thumb}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="flex h-full items-center justify-center text-[10px] text-zinc-600">
                              —
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-medium text-zinc-100">{p.title}</td>
                      <td className="p-4 text-zinc-400">{p.category.name}</td>
                      <td className="p-4 text-brand-yellow">${p.price.toFixed(2)}</td>
                      <td className="p-4 text-zinc-300">{p.stock ?? 0}</td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          className="mr-2 text-brand-yellow hover:underline"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(p)}
                          className="text-brand-red hover:underline"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-product-modal-title"
          className="p-2 sm:p-5"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "640px",
              marginTop: "auto",
              marginBottom: "auto",
              backgroundColor: "#1a1a1a",
              border: "1px solid #2a2a2a",
              borderRadius: "4px",
              display: "flex",
              flexDirection: "column",
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
                id="admin-product-modal-title"
                className="font-display text-xl uppercase text-white sm:text-2xl"
              >
                {modal === "create" ? "Nuevo producto" : "Editar producto"}
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
                  Nombre
                </label>
                <input
                  className="input-brand mt-1 w-full"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Slug (URL)
                </label>
                <input
                  className="input-brand mt-1 w-full font-mono text-sm"
                  value={slug}
                  onChange={(e) => {
                    setSlugDirty(true);
                    setSlug(e.target.value);
                  }}
                  placeholder="se genera desde el nombre"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Descripción
                </label>
                <textarea
                  className="input-brand mt-1 min-h-[100px] w-full resize-y"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Precio
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="input-brand mt-1 w-full"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div className="min-w-0">
                  <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Stock
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="input-brand mt-1 w-full"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  URL de imagen
                </label>
                <input
                  className="input-brand mt-1 w-full"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://…"
                />
                {imageUrl.trim() && !imageBroken ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl.trim()}
                    alt=""
                    className="mt-3 max-h-44 w-auto max-w-full rounded border-2 border-brand-border object-contain"
                    onError={() => setImageBroken(true)}
                  />
                ) : null}
                {imageUrl.trim() && imageBroken ? (
                  <p className="mt-2 text-xs text-brand-red">No se pudo cargar la imagen.</p>
                ) : null}
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Categoría
                </label>
                <select
                  className="select-brand mt-1 w-full"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  {sortedCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Tallas
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {sortedSizes.map((s) => {
                    const checked = selectedSizeIds.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className={`flex cursor-pointer items-center gap-3 rounded border-2 px-3 py-2 text-sm transition ${
                          checked
                            ? "border-brand-yellow bg-brand-yellow/10 text-zinc-100"
                            : "border-brand-border text-zinc-400 hover:border-zinc-500"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSize(s.id)}
                          className="h-4 w-4 shrink-0 rounded border-2 border-brand-border bg-brand-black accent-brand-yellow"
                        />
                        <span>
                          {s.name}{" "}
                          <span className="font-mono text-xs text-zinc-500">({s.code})</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                {sortedSizes.length === 0 ? (
                  <p className="mt-2 text-xs text-zinc-500">
                    No hay tallas.{" "}
                    <Link href="/admin/tallas" className="text-brand-yellow hover:underline">
                      Alta en Tallas
                    </Link>
                  </p>
                ) : null}
              </div>
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

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 z-[10050] max-w-md -translate-x-1/2 px-4 ${
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
