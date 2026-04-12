"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { AdminTableSkeleton } from "@/components/admin/table-skeleton";
import { apiFetch, ApiError } from "@/lib/api-client";
import { uploadImageFile } from "@/lib/upload-image";
import { PRODUCT_SLUG_PATTERN, slugifyTitle } from "@/lib/slugify";
import type { Category, ProductListItem, Size } from "@/lib/types";

type Toast = { type: "ok" | "err"; text: string } | null;

type ModalMode = "create" | "edit" | null;

function isHttpImageUrl(u: string): boolean {
  const t = u.trim();
  return /^https?:\/\//i.test(t);
}

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
  /** Galería completa; la primera es la principal en tienda. */
  const [imagenes, setImagenes] = useState<
    { id: string; url: string; sortOrder: number }[]
  >([]);
  const [nuevaImagenUrl, setNuevaImagenUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedSizeIds, setSelectedSizeIds] = useState<string[]>([]);
  const [stockAdjustingId, setStockAdjustingId] = useState<string | null>(null);
  /** Preview blob o URL Cloudinary mientras se sube / tras subir la imagen principal. */
  const [principalPreview, setPrincipalPreview] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const principalBlobRef = useRef<string | null>(null);

  const stockBtnStyle: CSSProperties = {
    width: "28px",
    height: "28px",
    padding: 0,
    borderRadius: "4px",
    border: "1px solid #2a2a2a",
    background: "#111",
    color: "#f7e047",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "var(--font-display)",
    lineHeight: 1,
  };

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
    return () => {
      if (principalBlobRef.current) {
        URL.revokeObjectURL(principalBlobRef.current);
        principalBlobRef.current = null;
      }
    };
  }, []);

  function revokePrincipalBlob() {
    if (principalBlobRef.current) {
      URL.revokeObjectURL(principalBlobRef.current);
      principalBlobRef.current = null;
    }
  }

  function openCreate() {
    revokePrincipalBlob();
    setPrincipalPreview(null);
    setEditingId(null);
    setModal("create");
    setSlugDirty(false);
    setTitle("");
    setSlug("");
    setDescription("");
    setPrice("");
    setStock("0");
    setImagenes([]);
    setNuevaImagenUrl("");
    setCategoryId(sortedCategories[0]?.id ?? "");
    setSelectedSizeIds([]);
  }

  async function openEdit(p: ProductListItem) {
    revokePrincipalBlob();
    setPrincipalPreview(null);
    setEditingId(p.id);
    setModal("edit");
    setSlugDirty(true);
    setTitle(p.title);
    setSlug(p.slug ?? "");
    setDescription(p.description ?? "");
    setPrice(String(p.price));
    setStock(String(p.stock ?? 0));
    setCategoryId(p.categoryId);
    setSelectedSizeIds(p.sizes.map((x) => x.size.id));
    setNuevaImagenUrl("");
    try {
      const full = await apiFetch<ProductListItem>(`/products/${p.id}`, { skipAuth: true });
      setImagenes([...full.images].sort((a, b) => a.sortOrder - b.sortOrder));
    } catch {
      setImagenes([...p.images].sort((a, b) => a.sortOrder - b.sortOrder));
    }
  }

  function closeModal() {
    revokePrincipalBlob();
    setPrincipalPreview(null);
    setModal(null);
    setEditingId(null);
    setNuevaImagenUrl("");
  }

  async function handleImagenPrincipal(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast({ type: "err", text: "Solo se permiten imágenes" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast({ type: "err", text: "La imagen debe pesar menos de 5MB" });
      return;
    }

    revokePrincipalBlob();
    const localUrl = URL.createObjectURL(file);
    principalBlobRef.current = localUrl;
    setPrincipalPreview(localUrl);

    try {
      setSubiendo(true);
      const cloudUrl = await uploadImageFile(file, "products");
      console.log("[productos] imagen principal subida:", cloudUrl);
      revokePrincipalBlob();
      setPrincipalPreview(cloudUrl);
      setImagenes((prev) => {
        if (prev.length === 0) {
          return [{ id: `local-${Date.now()}`, url: cloudUrl, sortOrder: 0 }];
        }
        const next = [...prev];
        next[0] = { ...next[0], url: cloudUrl };
        return next;
      });
    } catch {
      revokePrincipalBlob();
      setPrincipalPreview(null);
      showToast({ type: "err", text: "Error al subir imagen. Intentá de nuevo." });
    } finally {
      setSubiendo(false);
    }
  }

  async function handleGaleriaUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;

    setSubiendo(true);
    const errores: string[] = [];
    let editAdds = 0;
    let createAdds = 0;

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        errores.push(`${file.name} supera 5MB`);
        continue;
      }
      if (!file.type.startsWith("image/")) {
        errores.push(`${file.name} no es una imagen`);
        continue;
      }
      try {
        const cloudUrl = await uploadImageFile(file, "products");
        console.log("[galería] subida a Cloudinary:", cloudUrl);

        if (modal === "edit" && editingId) {
          await apiFetch(`/admin/products/${editingId}/images`, {
            method: "POST",
            body: JSON.stringify({ url: cloudUrl }),
          });
          editAdds += 1;
        } else {
          setImagenes((prev) => [
            ...prev,
            {
              id: `cloudinary-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              url: cloudUrl,
              sortOrder: prev.length,
            },
          ]);
          createAdds += 1;
        }
      } catch (err) {
        console.error("[galería] error:", err);
        errores.push(`Error al subir ${file.name}`);
      }
    }

    if (modal === "edit" && editingId && editAdds > 0) {
      await recargarImagenes(editingId);
    }

    setSubiendo(false);

    if (errores.length > 0) {
      showToast({ type: "err", text: errores.join(" · ") });
    } else if (editAdds > 0) {
      showToast({ type: "ok", text: "Imágenes añadidas." });
    } else if (createAdds > 0) {
      showToast({ type: "ok", text: "Imágenes listas (Cloudinary). Guardá el producto para persistirlas." });
    }
  }

  const recargarImagenes = useCallback(async (productId: string) => {
    const full = await apiFetch<ProductListItem>(`/products/${productId}`, { skipAuth: true });
    setImagenes([...full.images].sort((a, b) => a.sortOrder - b.sortOrder));
  }, []);

  async function agregarImagenUrl() {
    const u = nuevaImagenUrl.trim();
    if (!u) return;
    if (u.startsWith("data:") || u.startsWith("blob:")) {
      showToast({
        type: "err",
        text: "No se puede usar base64 ni blob. Subí el archivo o pegá una URL https.",
      });
      return;
    }
    if (!isHttpImageUrl(u)) {
      showToast({
        type: "err",
        text: "La imagen debe ser una URL que empiece con http:// o https://",
      });
      return;
    }
    if (modal === "edit" && editingId) {
      try {
        await apiFetch(`/admin/products/${editingId}/images`, {
          method: "POST",
          body: JSON.stringify({ url: u }),
        });
        setNuevaImagenUrl("");
        await recargarImagenes(editingId);
        showToast({ type: "ok", text: "Imagen añadida." });
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : "No se pudo añadir la imagen";
        showToast({ type: "err", text: msg });
      }
    } else {
      setImagenes((prev) => [
        ...prev,
        { id: `local-${Date.now()}`, url: u, sortOrder: prev.length },
      ]);
      setNuevaImagenUrl("");
    }
  }

  async function eliminarImagen(imageId: string) {
    if (!window.confirm("¿Eliminar esta imagen?")) return;
    const draftId =
      imageId.startsWith("local-") || imageId.startsWith("cloudinary-");
    if (modal === "edit" && editingId && !draftId) {
      try {
        await apiFetch(`/admin/products/${editingId}/images/${imageId}`, {
          method: "DELETE",
        });
        await recargarImagenes(editingId);
        showToast({ type: "ok", text: "Imagen eliminada." });
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : "No se pudo eliminar";
        showToast({ type: "err", text: msg });
      }
    } else {
      setImagenes((prev) => prev.filter((i) => i.id !== imageId));
    }
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

    const imageUrls = (() => {
      const ordered = [...imagenes].sort((a, b) => a.sortOrder - b.sortOrder);
      const out: string[] = [];
      const seen = new Set<string>();
      for (const i of ordered) {
        const u = i.url.trim();
        if (!u || !isHttpImageUrl(u) || seen.has(u)) continue;
        seen.add(u);
        out.push(u);
      }
      return out;
    })();

    setSaving(true);
    try {
      if (modal === "create") {
        const nuevo = await apiFetch<ProductListItem>("/admin/products", {
          method: "POST",
          body: JSON.stringify({
            title: t,
            ...(slugVal ? { slug: slugVal } : {}),
            description: description.trim() || undefined,
            price: priceNum,
            stock: stockNum,
            categoryId,
            sizeIds: selectedSizeIds,
          }),
        });
        for (const url of imageUrls) {
          await apiFetch(`/admin/products/${nuevo.id}/images`, {
            method: "POST",
            body: JSON.stringify({ url }),
          });
        }
        showToast({ type: "ok", text: "Producto creado con imágenes ✓" });
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

  const ajustarStock = useCallback(
    async (productId: string, delta: number) => {
      const producto = products.find((p) => p.id === productId);
      if (!producto) return;
      const nuevoStock = Math.max(0, (producto.stock ?? 0) + delta);
      setStockAdjustingId(productId);
      try {
        await apiFetch<ProductListItem>(`/admin/products/${productId}`, {
          method: "PATCH",
          body: JSON.stringify({ stock: nuevoStock }),
        });
        await loadProducts();
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : "No se pudo ajustar el stock";
        showToast({ type: "err", text: msg });
      } finally {
        setStockAdjustingId(null);
      }
    },
    [products, loadProducts, showToast],
  );

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
      <div style={{ padding: "16px 0 8px", marginBottom: "8px" }}>
        <BackButton href="/admin" label="← Dashboard" />
      </div>
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
        <div className="admin-table-scroll panel-brand mt-8 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
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
                      <td className="p-4">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <button
                            type="button"
                            aria-label="Menos una unidad"
                            disabled={(p.stock ?? 0) === 0 || stockAdjustingId === p.id}
                            style={{
                              ...stockBtnStyle,
                              opacity: (p.stock ?? 0) === 0 || stockAdjustingId === p.id ? 0.4 : 1,
                              cursor:
                                (p.stock ?? 0) === 0 || stockAdjustingId === p.id
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                            onClick={() => void ajustarStock(p.id, -1)}
                          >
                            −
                          </button>
                          <span
                            style={{
                              minWidth: "40px",
                              textAlign: "center",
                              fontSize: "13px",
                              fontWeight: 600,
                              color:
                                (p.stock ?? 0) === 0
                                  ? "#d91920"
                                  : (p.stock ?? 0) <= 10
                                    ? "#f7e047"
                                    : "#22c55e",
                            }}
                          >
                            {(p.stock ?? 0) === 0 ? "AGOTADO" : p.stock ?? 0}
                          </span>
                          <button
                            type="button"
                            aria-label="Más una unidad"
                            disabled={stockAdjustingId === p.id}
                            style={{
                              ...stockBtnStyle,
                              opacity: stockAdjustingId === p.id ? 0.4 : 1,
                              cursor: stockAdjustingId === p.id ? "not-allowed" : "pointer",
                            }}
                            onClick={() => void ajustarStock(p.id, 1)}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => void openEdit(p)}
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
              maxWidth: "640px",
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
                    inputMode="numeric"
                    className="input-brand mt-1 w-full"
                    value={stock}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        setStock("");
                        return;
                      }
                      const n = Number.parseInt(raw, 10);
                      if (!Number.isNaN(n) && n >= 0) {
                        setStock(String(n));
                      }
                    }}
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    Stock actual:{" "}
                    {(() => {
                      const n = Math.floor(Number(stock));
                      return Number.isFinite(n) && n >= 0 ? n : 0;
                    })()}{" "}
                    unidades
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Imagen principal
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                    marginTop: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      border: "1px solid #2a2a2a",
                      flexShrink: 0,
                      overflow: "hidden",
                      background: "#1a1a1a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {principalPreview?.trim() || imagenes[0]?.url?.trim() ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={principalPreview ?? imagenes[0]?.url ?? ""}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        onError={(ev) => {
                          ev.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <span style={{ color: "#3f3f46", fontSize: "24px" }}>🖼️</span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <input
                      type="text"
                      className="input-brand w-full"
                      value={imagenes[0]?.url ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v.trim().startsWith("data:") || v.trim().startsWith("blob:")) {
                          showToast({
                            type: "err",
                            text: "No pegues base64. Subí la imagen o una URL https.",
                          });
                          return;
                        }
                        revokePrincipalBlob();
                        setPrincipalPreview(null);
                        setImagenes((prev) => {
                          if (prev.length === 0) {
                            return [{ id: `local-${Date.now()}`, url: v, sortOrder: 0 }];
                          }
                          const next = [...prev];
                          next[0] = { ...next[0], url: v };
                          return next;
                        });
                      }}
                      placeholder="https://... o subí desde dispositivo"
                      style={{ width: "100%", marginBottom: "8px" }}
                    />
                    <label
                      htmlFor="prod-img-principal"
                      className="btn-brand-outline"
                      style={{
                        display: "inline-block",
                        cursor: subiendo ? "wait" : "pointer",
                        fontSize: "12px",
                        padding: "6px 12px",
                      }}
                    >
                      {subiendo ? "⏳ Subiendo…" : "📷 Subir imagen"}
                    </label>
                    <input
                      id="prod-img-principal"
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => void handleImagenPrincipal(e)}
                      disabled={subiendo}
                    />
                  </div>
                </div>
              </div>

              <div
                style={{
                  borderTop: "1px solid #2a2a2a",
                  margin: "20px 0",
                  paddingTop: "20px",
                }}
              >
                <p
                  style={{
                    color: "#f7e047",
                    fontFamily: "var(--font-display)",
                    fontSize: "11px",
                    letterSpacing: "3px",
                    textTransform: "uppercase",
                    marginBottom: "16px",
                  }}
                >
                  Galería de imágenes
                </p>
                <style>{`
                  @keyframes bbg-galeria-spin {
                    to { transform: rotate(360deg); }
                  }
                `}</style>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  {imagenes.map((img, index) => (
                    <div
                      key={img.id}
                      style={{
                        position: "relative",
                        aspectRatio: "1",
                        border:
                          index === 0 ? "2px solid #d91920" : "1px solid #2a2a2a",
                        overflow: "hidden",
                        background: "#1a1a1a",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={`Imagen ${index + 1}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      {index === 0 ? (
                        <div
                          style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: "rgba(217,25,32,0.9)",
                            color: "white",
                            fontSize: "8px",
                            textAlign: "center",
                            padding: "2px",
                            fontFamily: "var(--font-display)",
                            letterSpacing: "1px",
                          }}
                        >
                          PRINCIPAL
                        </div>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void eliminarImagen(img.id)}
                        style={{
                          position: "absolute",
                          top: "2px",
                          right: "2px",
                          background: "rgba(0,0,0,0.8)",
                          border: "none",
                          color: "#d91920",
                          width: "18px",
                          height: "18px",
                          borderRadius: "50%",
                          cursor: "pointer",
                          fontSize: "10px",
                          lineHeight: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <label
                    htmlFor="galeria-upload"
                    style={{
                      aspectRatio: "1",
                      border: "2px dashed #2a2a2a",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: subiendo ? "wait" : "pointer",
                      background: "#111111",
                      transition: "border-color 0.15s",
                      minHeight: "72px",
                    }}
                    onMouseEnter={(ev) => {
                      if (!subiendo) ev.currentTarget.style.borderColor = "#d91920";
                    }}
                    onMouseLeave={(ev) => {
                      ev.currentTarget.style.borderColor = "#2a2a2a";
                    }}
                  >
                    {subiendo ? (
                      <span
                        style={{
                          fontSize: "20px",
                          display: "inline-block",
                          animation: "bbg-galeria-spin 0.8s linear infinite",
                        }}
                      >
                        ⏳
                      </span>
                    ) : (
                      <>
                        <span style={{ fontSize: "20px", color: "#52525b" }}>+</span>
                        <span
                          style={{
                            fontSize: "9px",
                            color: "#52525b",
                            fontFamily: "var(--font-display)",
                            letterSpacing: "1px",
                            marginTop: "2px",
                          }}
                        >
                          FOTO
                        </span>
                      </>
                    )}
                  </label>
                </div>
                <input
                  id="galeria-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => void handleGaleriaUpload(e)}
                  disabled={subiendo}
                />
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <input
                    type="text"
                    value={nuevaImagenUrl}
                    onChange={(e) => setNuevaImagenUrl(e.target.value)}
                    placeholder="https://... URL de imagen"
                    className="input-brand"
                    style={{ flex: 1, fontSize: "13px" }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void agregarImagenUrl();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => void agregarImagenUrl()}
                    className="btn-brand-outline"
                    style={{ flexShrink: 0, fontSize: "12px" }}
                  >
                    + URL
                  </button>
                </div>
                {nuevaImagenUrl.trim() ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={nuevaImagenUrl.trim()}
                    alt=""
                    style={{
                      width: "60px",
                      height: "60px",
                      objectFit: "cover",
                      border: "1px solid #2a2a2a",
                      marginBottom: "12px",
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : null}
                {subiendo ? (
                  <p
                    style={{
                      color: "#f7e047",
                      fontSize: "12px",
                      fontFamily: "var(--font-display)",
                      letterSpacing: "1px",
                      marginTop: "8px",
                    }}
                  >
                    ⏳ Subiendo imágenes a Cloudinary...
                  </p>
                ) : null}
                <p
                  style={{
                    color: "#52525b",
                    fontSize: "11px",
                    marginTop: "8px",
                  }}
                >
                  Cada archivo pasa por POST /api/upload/image → Cloudinary (
                  <code className="text-[10px] text-brand-yellow">bigboys/products</code>
                  ). Máx. 5MB por imagen. Sin base64 en DB.
                </p>
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
