"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { BackButton } from "@/components/back-button";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { apiFetch } from "@/lib/api-client";
import type { Category, ProductListItem, Size } from "@/lib/types";

const labelFiltro: CSSProperties = {
  color: "var(--gold)",
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
          borderBottom: "1px solid var(--glass-border)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--gold)",
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
              color: "var(--red-neon)",
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
          style={{ width: "100%", accentColor: "var(--red)" }}
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
          style={{ width: "100%", marginTop: "8px", accentColor: "var(--red)" }}
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
            className="input-3d"
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
            className="input-3d"
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
                color: sizeActiva === talla.id ? "var(--gold)" : "rgba(255,255,255,0.55)",
                fontSize: "13px",
              }}
            >
              <input
                type="radio"
                name="talla-tienda"
                value={talla.id}
                checked={sizeActiva === talla.id}
                onChange={() => setSizeActiva(sizeActiva === talla.id ? "" : talla.id)}
                style={{ accentColor: "var(--red)" }}
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
          borderTop: "1px solid var(--glass-border)",
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
            background: soloDisponibles ? "var(--red)" : "var(--black-3)",
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
  const bp = useBreakpoint();
  const isMobile = bp === "sm";
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
    <div
      className="tienda-page"
      style={{
        maxWidth: "1152px",
        margin: "0 auto",
        padding: isMobile ? "16px 12px 40px" : "24px 16px 48px",
      }}
    >
      <div style={{ padding: "16px 0 8px", marginBottom: "8px" }}>
        <BackButton href="/" label="← Inicio" />
      </div>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2.25rem, 6vw, 3.75rem)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--white)",
          margin: 0,
        }}
      >
        Tienda
      </h1>
      <p style={{ marginTop: "12px", maxWidth: "36rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
        Filtrá por precio, talla y disponibilidad, o buscá por nombre.
      </p>

      {categoriesError ? (
        <p style={{ marginTop: "16px", fontSize: "14px", color: "var(--red-neon)" }}>{categoriesError}</p>
      ) : null}

      <button
        type="button"
        onClick={() => setFiltrosAbiertos(true)}
        className="filtros-mobile-btn btn-outline mt-6"
        style={{ marginBottom: "16px" }}
      >
        ⚙️ Filtros
        {hayFiltrosActivos ? (
          <span
            style={{
              background: "var(--red)",
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
          className="filtros-sidebar glass"
          style={{
            width: "220px",
            flexShrink: 0,
            padding: "20px",
            alignSelf: "flex-start",
            position: "sticky",
            top: "80px",
            borderRadius: "8px",
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
              className="input-3d"
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

          <motion.div
            className="tienda-filter-scroll"
            layout
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: isMobile ? "nowrap" : "wrap",
              marginBottom: "24px",
            }}
          >
            <motion.button
              type="button"
              onClick={() => setCategoriaActiva("")}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: "8px 20px",
                border: `1px solid ${categoriaActiva === "" ? "var(--red)" : "rgba(255,255,255,0.08)"}`,
                background: categoriaActiva === "" ? "var(--red)" : "rgba(255,255,255,0.03)",
                color: "#ffffff",
                cursor: "pointer",
                fontFamily: "var(--font-display)",
                fontSize: "12px",
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              Todas
            </motion.button>
            {categoriesLoading ? (
              <span style={{ alignSelf: "center", fontSize: "14px", color: "rgba(255,255,255,0.45)" }}>
                Cargando categorías…
              </span>
            ) : (
              categories.map((cat) => (
                <motion.button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoriaActiva(categoriaActiva === cat.id ? "" : cat.id)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  layout
                  style={{
                    padding: "8px 20px",
                    border: `1px solid ${
                      categoriaActiva === cat.id ? "var(--red)" : "rgba(255,255,255,0.08)"
                    }`,
                    background:
                      categoriaActiva === cat.id ? "var(--red)" : "rgba(255,255,255,0.03)",
                    color: "#ffffff",
                    cursor: "pointer",
                    fontFamily: "var(--font-display)",
                    fontSize: "12px",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                  }}
                >
                  {cat.name}
                </motion.button>
              ))
            )}
          </motion.div>

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
                <button type="button" onClick={limpiarFiltros} className="btn-outline">
                  Ver todos los productos
                </button>
              </div>
            ) : (
              <p style={{ marginTop: "40px", textAlign: "center", color: "rgba(255,255,255,0.45)" }}>
                No hay productos en el catálogo todavía. Creá algunos desde el panel admin.
              </p>
            )
          ) : (
            <motion.div
              layout
              role="list"
              style={{
                display: "grid",
                gap: isMobile ? "12px" : "20px",
                padding: 0,
                margin: 0,
                gridTemplateColumns: isMobile
                  ? "repeat(2, minmax(0, 1fr))"
                  : "repeat(auto-fill, minmax(260px, 1fr))",
              }}
            >
              <AnimatePresence mode="popLayout">
                {productos.map((p, i) => (
                  <motion.div
                    key={p.id}
                    role="listitem"
                    layout
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.88 }}
                    transition={{
                      duration: 0.32,
                      delay: i * 0.04,
                    }}
                    whileHover={{
                      y: -10,
                      transition: { type: "spring", stiffness: 400, damping: 22 },
                    }}
                  >
                    <Link
                      href={
                        p.slug ? `/tienda/productos/${encodeURIComponent(p.slug)}` : `/producto/${p.id}`
                      }
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <motion.div
                        className="card-3d"
                        whileTap={{ scale: 0.98 }}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          overflow: "hidden",
                          borderRadius: "4px",
                        }}
                      >
                        <div style={{ position: "relative", aspectRatio: "1", background: "var(--black)" }}>
                          {p.images[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.images[0].url}
                              alt=""
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <div
                              style={{
                                display: "flex",
                                height: "100%",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "rgba(255,255,255,0.35)",
                              }}
                            >
                              Sin foto
                            </div>
                          )}
                          {(p.stock ?? 0) === 0 && (
                            <div
                              style={{
                                position: "absolute",
                                top: "8px",
                                right: "8px",
                                background: "var(--red)",
                                color: "white",
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "3px 8px",
                                fontFamily: "var(--font-display)",
                                letterSpacing: "1px",
                                textTransform: "uppercase",
                                boxShadow: "var(--glow-sm)",
                              }}
                            >
                              AGOTADO
                            </div>
                          )}
                        </div>
                        <div
                          style={{
                            borderTop: "2px solid rgba(204,0,0,0.25)",
                            padding: "16px",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "var(--font-display)",
                              fontSize: "1.25rem",
                              textTransform: "uppercase",
                              lineHeight: 1.2,
                              color: "var(--white)",
                            }}
                          >
                            {p.title}
                          </span>
                          <span
                            style={{
                              marginTop: "8px",
                              display: "block",
                              fontFamily: "var(--font-display)",
                              fontSize: "1.5rem",
                              color: "var(--gold)",
                              textShadow: "var(--glow-gold)",
                            }}
                          >
                            ${" "}
                            {p.price.toLocaleString("es-CO", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}
                          </span>
                          {(p.reviewCount ?? 0) > 0 ? (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                marginTop: "8px",
                              }}
                            >
                              <span style={{ color: "var(--gold)", fontSize: "12px", letterSpacing: "1px" }}>
                                {"★".repeat(Math.round(p.avgRating ?? 0))}
                                {"☆".repeat(5 - Math.round(p.avgRating ?? 0))}
                              </span>
                              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px" }}>
                                ({p.reviewCount})
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
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
            className="glass"
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              borderTop: "2px solid rgba(204,0,0,0.5)",
              boxShadow: "0 -8px 40px rgba(204,0,0,0.12)",
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
                  color: "var(--gold)",
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
              className="btn-primary"
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
