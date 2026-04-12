"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { Category, ProductListItem } from "@/lib/types";

export default function TiendaPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("");
  const [productos, setProductos] = useState<ProductListItem[]>([]);
  const [cargando, setCargando] = useState(false);
  const [totalResultados, setTotalResultados] = useState(0);

  const primeraCarga = useRef(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch<Category[]>("/categories", { skipAuth: true });
        if (!cancelled) setCategories(data);
      } catch (e) {
        if (!cancelled)
          setCategoriesError(e instanceof Error ? e.message : "No se pudieron cargar las categorías");
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const buscar = useCallback(async (query: string, catId: string) => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("search", query.trim());
      if (catId) params.set("categoryId", catId);
      const qs = params.toString();
      const data = await apiFetch<ProductListItem[]>(`/products${qs ? `?${qs}` : ""}`, {
        skipAuth: true,
      });
      setProductos(Array.isArray(data) ? data : []);
      setTotalResultados(Array.isArray(data) ? data.length : 0);
    } catch {
      setProductos([]);
      setTotalResultados(0);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (primeraCarga.current) {
      primeraCarga.current = false;
      void buscar(search, categoriaActiva);
      return;
    }
    const timer = setTimeout(() => {
      void buscar(search, categoriaActiva);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, categoriaActiva, buscar]);

  const hayFiltros = Boolean(search.trim() || categoriaActiva);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-5xl uppercase tracking-wide text-white md:text-6xl">Tienda</h1>
      <p className="mt-3 max-w-xl text-zinc-400">
        Elegí una categoría o buscá por nombre, descripción o rubro.
      </p>

      {categoriesError ? <p className="mt-4 text-sm text-brand-red">{categoriesError}</p> : null}

      {/* Campo de búsqueda */}
      <div style={{ position: "relative", marginBottom: "24px", marginTop: "24px" }}>
        <div
          style={{
            position: "absolute",
            left: "16px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#52525b",
            pointerEvents: "none",
          }}
        >
          🔍
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar productos..."
          className="input-brand"
          autoComplete="off"
          style={{
            width: "100%",
            paddingLeft: "44px",
            paddingRight: search ? "44px" : "16px",
            fontSize: "16px",
          }}
        />
        {search ? (
          <button
            type="button"
            aria-label="Limpiar búsqueda"
            onClick={() => setSearch("")}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: "#71717a",
              cursor: "pointer",
              fontSize: "18px",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        ) : null}
      </div>

      {/* Pills categoría */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "24px",
        }}
      >
        <button
          type="button"
          onClick={() => setCategoriaActiva("")}
          style={{
            padding: "6px 16px",
            border: `1px solid ${categoriaActiva === "" ? "#d91920" : "#2a2a2a"}`,
            background: categoriaActiva === "" ? "#d91920" : "transparent",
            color: categoriaActiva === "" ? "white" : "#a1a1aa",
            cursor: "pointer",
            fontFamily: "var(--font-display)",
            fontSize: "12px",
            letterSpacing: "2px",
            textTransform: "uppercase",
            transition: "all 0.15s",
          }}
        >
          Todas
        </button>
        {categoriesLoading ? (
          <span className="self-center text-sm text-zinc-500">Cargando categorías…</span>
        ) : (
          categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoriaActiva(categoriaActiva === cat.id ? "" : cat.id)}
              style={{
                padding: "6px 16px",
                border: `1px solid ${categoriaActiva === cat.id ? "#d91920" : "#2a2a2a"}`,
                background: categoriaActiva === cat.id ? "#d91920" : "transparent",
                color: categoriaActiva === cat.id ? "white" : "#a1a1aa",
                cursor: "pointer",
                fontFamily: "var(--font-display)",
                fontSize: "12px",
                letterSpacing: "2px",
                textTransform: "uppercase",
                transition: "all 0.15s",
              }}
            >
              {cat.name}
            </button>
          ))
        )}
      </div>

      {hayFiltros ? (
        <p
          style={{
            color: "#52525b",
            fontSize: "13px",
            marginBottom: "16px",
            fontFamily: "var(--font-display)",
            letterSpacing: "1px",
          }}
        >
          {cargando
            ? "Buscando..."
            : `${totalResultados} producto${totalResultados !== 1 ? "s" : ""} encontrado${
                totalResultados !== 1 ? "s" : ""
              }${search.trim() ? ` para "${search.trim()}"` : ""}${
                categoriaActiva
                  ? ` en ${categories.find((c) => c.id === categoriaActiva)?.name ?? ""}`
                  : ""
              }`}
        </p>
      ) : null}

      {cargando ? (
        <ul
          className="tienda-skeleton-pulse"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "20px",
            listStyle: "none",
            padding: 0,
            margin: 0,
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <li
              key={i}
              style={{
                background: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderRadius: "2px",
                overflow: "hidden",
              }}
            >
              <div style={{ height: "200px", background: "#2a2a2a" }} />
              <div style={{ padding: "16px" }}>
                <div
                  style={{
                    height: "16px",
                    background: "#2a2a2a",
                    marginBottom: "8px",
                    width: "70%",
                  }}
                />
                <div style={{ height: "12px", background: "#2a2a2a", width: "40%" }} />
              </div>
            </li>
          ))}
        </ul>
      ) : productos.length === 0 ? (
        hayFiltros ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 24px",
              color: "#52525b",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "48px",
                marginBottom: "16px",
              }}
            >
              🔍
            </p>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "20px",
                color: "#71717a",
                letterSpacing: "2px",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              Sin resultados
            </p>
            <p style={{ fontSize: "14px", marginBottom: "24px" }}>
              No encontramos productos para{" "}
              <span style={{ color: "#f7e047" }}>&quot;{search.trim() || "esta categoría"}&quot;</span>
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategoriaActiva("");
              }}
              className="btn-brand-outline"
            >
              Ver todos los productos
            </button>
          </div>
        ) : (
          <p className="mt-10 text-center text-zinc-500">
            No hay productos en el catálogo todavía. Creá algunos desde el panel admin.
          </p>
        )
      ) : (
        <ul
          className="grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3"
          style={{ margin: 0 }}
        >
          {productos.map((p) => (
            <li key={p.id}>
              <Link
                href={
                  p.slug ? `/tienda/productos/${encodeURIComponent(p.slug)}` : `/producto/${p.id}`
                }
                className="panel-brand flex flex-col overflow-hidden transition hover:border-brand-red"
              >
                <div className="relative aspect-square bg-brand-black">
                  {p.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.images[0].url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-600">Sin foto</div>
                  )}
                  {(p.stock ?? 0) === 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        background: "#d91920",
                        color: "white",
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "3px 8px",
                        fontFamily: "var(--font-display)",
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                      }}
                    >
                      AGOTADO
                    </div>
                  )}
                </div>
                <div className="border-t-2 border-brand-border p-4">
                  <span className="font-display text-xl uppercase leading-tight text-white">{p.title}</span>
                  <span className="mt-2 block font-display text-2xl text-brand-yellow">
                    ${" "}
                    {p.price.toLocaleString("es-CO", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
