"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { BackButton } from "@/components/back-button";
import { apiFetch } from "@/lib/api-client";
import type { Category, ProductListItem, Size } from "@/lib/types";

const labelFiltro: CSSProperties = {
  color: "#f7e047",
  fontFamily: "var(--font-display)",
  fontSize: "11px",
  letterSpacing: "2px",
  textTransform: "uppercase",
  marginBottom: "10px",
};

type FiltrosContentProps = {
  orderBy: string;
  setOrderBy: (v: string) => void;
  priceRange: { min: number; max: number };
  minPrice: number;
  setMinPrice: (n: number) => void;
  maxPrice: number;
  setMaxPrice: (n: number) => void;
  tallas: Size[];
  sizeActiva: string;
  setSizeActiva: (v: string) => void;
  soloDisponibles: boolean;
  setSoloDisponibles: (v: boolean) => void;
  hayFiltrosActivos: boolean;
  limpiarFiltros: () => void;
};

function FiltrosContent({
  orderBy,
  setOrderBy,
  priceRange,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  tallas,
  sizeActiva,
  setSizeActiva,
  soloDisponibles,
  setSoloDisponibles,
  hayFiltrosActivos,
  limpiarFiltros,
}: FiltrosContentProps) {
  const prMin = priceRange.min;
  const prMax = Math.max(priceRange.min, priceRange.max);
  const span = prMax - prMin || 1;

  return (
    <div className="tienda-filtros">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          paddingBottom: "12px",
          borderBottom: "1px solid #2a2a2a",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            color: "#f7e047",
            fontSize: "14px",
            letterSpacing: "3px",
            textTransform: "uppercase",
          }}
        >
          Filtros
        </span>
        {hayFiltrosActivos ? (
          <button
            type="button"
            onClick={limpiarFiltros}
            style={{
              background: "none",
              border: "none",
              color: "#d91920",
              cursor: "pointer",
              fontSize: "12px",
              fontFamily: "var(--font-display)",
              letterSpacing: "1px",
            }}
          >
            Limpiar
          </button>
        ) : null}
      </div>

      <div style={{ marginBottom: "24px" }}>
        <p style={labelFiltro}>Ordenar por</p>
        <select
          value={orderBy}
          onChange={(e) => setOrderBy(e.target.value)}
          className="select-brand"
          style={{ width: "100%", fontSize: "13px" }}
        >
          <option value="newest">Más nuevos</option>
          <option value="price_asc">Precio: menor a mayor</option>
          <option value="price_desc">Precio: mayor a menor</option>
          <option value="name_asc">Nombre A→Z</option>
        </select>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <p style={labelFiltro}>Precio</p>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
        >
          <span style={{ color: "#a1a1aa", fontSize: "12px" }}>
            ${minPrice.toLocaleString("es-CO")}
          </span>
          <span style={{ color: "#a1a1aa", fontSize: "12px" }}>
            ${maxPrice.toLocaleString("es-CO")}
          </span>
        </div>
        <input
          type="range"
          min={prMin}
          max={prMax}
          step={Math.max(1, Math.round(span / 200))}
          value={Math.min(minPrice, prMax)}
          onChange={(e) => {
            const val = Number(e.target.value);
            if (val < maxPrice) setMinPrice(val);
            else setMinPrice(Math.max(prMin, maxPrice - 1));
          }}
          style={{ width: "100%", accentColor: "#d91920" }}
        />
        <input
          type="range"
          min={prMin}
          max={prMax}
          step={Math.max(1, Math.round(span / 200))}
          value={Math.min(Math.max(maxPrice, prMin), prMax)}
          onChange={(e) => {
            const val = Number(e.target.value);
            if (val > minPrice) setMaxPrice(val);
            else setMaxPrice(Math.min(prMax, minPrice + 1));
          }}
          style={{ width: "100%", marginTop: "8px", accentColor: "#d91920" }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
            marginTop: "8px",
          }}
        >
          <input
            type="number"
            value={minPrice}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!Number.isFinite(v)) return;
              setMinPrice(Math.min(Math.max(v, prMin), Math.min(maxPrice, prMax)));
            }}
            placeholder="Mín"
            className="input-brand"
            style={{ fontSize: "12px", padding: "6px 8px" }}
          />
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!Number.isFinite(v)) return;
              setMaxPrice(Math.max(Math.min(v, prMax), Math.max(minPrice, prMin)));
            }}
            placeholder="Máx"
            className="input-brand"
            style={{ fontSize: "12px", padding: "6px 8px" }}
          />
        </div>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <p style={labelFiltro}>Talla</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {tallas.map((talla) => (
            <label
              key={talla.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                color: sizeActiva === talla.id ? "#f7e047" : "#a1a1aa",
                fontSize: "13px",
              }}
            >
              <input
                type="radio"
                name="talla-tienda"
                value={talla.id}
                checked={sizeActiva === talla.id}
                onChange={() => setSizeActiva(sizeActiva === talla.id ? "" : talla.id)}
                style={{ accentColor: "#d91920" }}
              />
              {talla.name}
            </label>
          ))}
          {sizeActiva ? (
            <button
              type="button"
              onClick={() => setSizeActiva("")}
              style={{
                background: "none",
                border: "none",
                color: "#52525b",
                cursor: "pointer",
                fontSize: "11px",
                textAlign: "left",
                padding: 0,
                marginTop: "4px",
              }}
            >
              × Quitar talla
            </button>
          ) : null}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: "16px",
          borderTop: "1px solid #2a2a2a",
        }}
      >
        <span style={{ color: "#a1a1aa", fontSize: "13px" }}>Solo disponibles</span>
        <button
          type="button"
          aria-pressed={soloDisponibles}
          onClick={() => setSoloDisponibles(!soloDisponibles)}
          style={{
            width: "40px",
            height: "22px",
            borderRadius: "11px",
            background: soloDisponibles ? "#d91920" : "#2a2a2a",
            border: "none",
            cursor: "pointer",
            position: "relative",
            transition: "background 0.2s",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: "3px",
              left: soloDisponibles ? "21px" : "3px",
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: "white",
              transition: "left 0.2s",
            }}
          />
        </button>
      </div>
    </div>
  );
}

export default function TiendaPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [tallas, setTallas] = useState<Size[]>([]);

  const [search, setSearch] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("");
  const [sizeActiva, setSizeActiva] = useState("");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1_000_000 });
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1_000_000);
  const [orderBy, setOrderBy] = useState("newest");
  const [soloDisponibles, setSoloDisponibles] = useState(false);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch<Size[]>("/sizes", { skipAuth: true });
        if (!cancelled) setTallas(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setTallas([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const range = await apiFetch<{ min: number; max: number }>("/products/price-range", {
          skipAuth: true,
        });
        if (cancelled || !range) return;
        const lo = Number(range.min);
        const hi = Number(range.max);
        if (!Number.isFinite(lo) || !Number.isFinite(hi)) return;
        const maxR = hi >= lo ? hi : lo;
        const minR = hi >= lo ? lo : hi;
        setPriceRange({ min: minR, max: maxR });
        setMinPrice(minR);
        setMaxPrice(maxR);
      } catch {
        /* defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const limpiarFiltros = useCallback(() => {
    setSearch("");
    setCategoriaActiva("");
    setSizeActiva("");
    setMinPrice(priceRange.min);
    setMaxPrice(priceRange.max);
    setSoloDisponibles(false);
    setOrderBy("newest");
  }, [priceRange.min, priceRange.max]);

  const hayFiltrosActivos =
    search.trim() !== "" ||
    categoriaActiva !== "" ||
    sizeActiva !== "" ||
    minPrice > priceRange.min ||
    maxPrice < priceRange.max ||
    soloDisponibles ||
    orderBy !== "newest";

  const buscar = useCallback(async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (categoriaActiva) params.set("categoryId", categoriaActiva);
      if (sizeActiva) params.set("sizeId", sizeActiva);
      if (minPrice > priceRange.min) params.set("minPrice", String(minPrice));
      if (maxPrice < priceRange.max) params.set("maxPrice", String(maxPrice));
      if (soloDisponibles) params.set("inStock", "true");
      if (orderBy !== "newest") params.set("orderBy", orderBy);
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
  }, [
    search,
    categoriaActiva,
    sizeActiva,
    minPrice,
    maxPrice,
    priceRange.min,
    priceRange.max,
    soloDisponibles,
    orderBy,
  ]);

  useEffect(() => {
    if (primeraCarga.current) {
      primeraCarga.current = false;
      void buscar();
      return;
    }
    const timer = setTimeout(() => void buscar(), 400);
    return () => clearTimeout(timer);
  }, [buscar]);

  const filtrosProps: FiltrosContentProps = {
    orderBy,
    setOrderBy,
    priceRange,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    tallas,
    sizeActiva,
    setSizeActiva,
    soloDisponibles,
    setSoloDisponibles,
    hayFiltrosActivos,
    limpiarFiltros,
  };

  return (
    <div className="tienda-page mx-auto max-w-6xl px-4 py-12">
      <div style={{ padding: "16px 0 8px", marginBottom: "8px" }}>
        <BackButton href="/" label="← Inicio" />
      </div>
      <h1 className="font-display text-5xl uppercase tracking-wide text-white md:text-6xl">Tienda</h1>
      <p className="mt-3 max-w-xl text-zinc-400">
        Filtrá por precio, talla y disponibilidad, o buscá por nombre.
      </p>

      {categoriesError ? <p className="mt-4 text-sm text-brand-red">{categoriesError}</p> : null}

      <button
        type="button"
        onClick={() => setFiltrosAbiertos(true)}
        className="filtros-mobile-btn btn-brand-outline mt-6"
        style={{ marginBottom: "16px" }}
      >
        ⚙️ Filtros
        {hayFiltrosActivos ? (
          <span
            style={{
              background: "#d91920",
              color: "white",
              borderRadius: "50%",
              width: "18px",
              height: "18px",
              fontSize: "11px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: "8px",
            }}
          >
            !
          </span>
        ) : null}
      </button>

      <div
        style={{
          display: "flex",
          gap: "32px",
          alignItems: "flex-start",
        }}
      >
        <aside
          className="filtros-sidebar"
          style={{
            width: "220px",
            flexShrink: 0,
            background: "#111111",
            border: "1px solid #2a2a2a",
            padding: "20px",
            alignSelf: "flex-start",
            position: "sticky",
            top: "80px",
          }}
        >
          <FiltrosContent {...filtrosProps} />
        </aside>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ position: "relative", marginBottom: "24px" }}>
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

          {hayFiltrosActivos ? (
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
                      ? ` · ${categories.find((c) => c.id === categoriaActiva)?.name ?? ""}`
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
            hayFiltrosActivos ? (
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
                  Probá ajustar filtros o la búsqueda.
                </p>
                <button type="button" onClick={limpiarFiltros} className="btn-brand-outline">
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
                        <div className="flex h-full items-center justify-center text-zinc-600">
                          Sin foto
                        </div>
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
                      <span className="font-display text-xl uppercase leading-tight text-white">
                        {p.title}
                      </span>
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
      </div>

      {filtrosAbiertos ? (
        <>
          <div
            role="presentation"
            onClick={() => setFiltrosAbiertos(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              zIndex: 40,
            }}
          />
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              background: "#111111",
              borderTop: "2px solid #d91920",
              zIndex: 50,
              maxHeight: "80vh",
              overflowY: "auto",
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "20px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  color: "#f7e047",
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                }}
              >
                Filtros
              </span>
              <button
                type="button"
                onClick={() => setFiltrosAbiertos(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#e4e4e7",
                  cursor: "pointer",
                  fontSize: "20px",
                }}
              >
                ×
              </button>
            </div>
            <FiltrosContent {...filtrosProps} />
            <button
              type="button"
              onClick={() => {
                setFiltrosAbiertos(false);
              }}
              className="btn-brand"
              style={{ width: "100%", marginTop: "16px" }}
            >
              Aplicar filtros
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
