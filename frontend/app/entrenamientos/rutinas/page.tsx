"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const apiBase = () => process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

function exercisesUrl(suffix: string): string {
  const base = apiBase();
  const path = suffix ? (suffix.startsWith("/") ? suffix : `/${suffix}`) : "";
  return base ? `${base}/api/exercises${path}` : `/api/exercises${path}`;
}

const LEVELS: Record<string, string> = {
  BEGINNER: "Principiante",
  INTERMEDIATE: "Intermedio",
  ADVANCED: "Avanzado",
};

const LEVEL_COLORS: Record<string, string> = {
  BEGINNER: "#22c55e",
  INTERMEDIATE: "#f7e047",
  ADVANCED: "#CC0000",
};

type MuscleGroupApi = {
  id: string;
  name: string;
  slug: string;
  order: number;
  _count?: { exercises: number };
};

type ExerciseApi = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  instructions: string | null;
  level: string;
  sets: number | null;
  reps: string | null;
  restSeconds: number | null;
  equipment: string | null;
  tips: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  muscleGroup: { name: string; slug: string };
};

function formatRest(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return "-";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}min ${s}s` : `${m}min`;
}

export default function RutinasPage() {
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroupApi[]>([]);
  const [exercises, setExercises] = useState<ExerciseApi[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseApi | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    void fetch(exercisesUrl("/muscle-groups"))
      .then((r) => (r.ok ? r.json() : []))
      .then((d: unknown) => setMuscleGroups(Array.isArray(d) ? d : []))
      .catch(() => setMuscleGroups([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    void fetch(exercisesUrl(""))
      .then((r) => (r.ok ? r.json() : []))
      .then((d: unknown) => setExercises(Array.isArray(d) ? d : []))
      .catch(() => setExercises([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedExercise) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedExercise]);

  const filteredExercises = useMemo(() => {
    let list = [...exercises];
    if (selectedGroup !== "all") {
      list = list.filter((ex) => ex.muscleGroup?.slug === selectedGroup);
    }
    if (selectedLevel !== "all") {
      list = list.filter((ex) => ex.level === selectedLevel);
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (ex) =>
          ex.name.toLowerCase().includes(q) ||
          (ex.description?.toLowerCase().includes(q) ?? false),
      );
    }
    return list;
  }, [exercises, selectedGroup, selectedLevel, debouncedSearch]);

  return (
    <main style={{ minHeight: "100vh", background: "#000000", paddingTop: "80px" }}>
      <style>{`
        @keyframes rutinas-pulse {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 0.85; }
        }
      `}</style>

      <section style={{ padding: "48px 24px 40px", maxWidth: "1200px", margin: "0 auto" }}>
        <Link
          href="/entrenamientos"
          style={{
            color: "#CC0000",
            textDecoration: "none",
            fontFamily: "var(--font-display)",
            fontSize: "12px",
            letterSpacing: "3px",
            textTransform: "uppercase",
            display: "inline-block",
            marginBottom: "24px",
          }}
        >
          Entrenamientos
        </Link>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(32px, 6vw, 64px)",
            color: "#ffffff",
            textTransform: "uppercase",
            letterSpacing: "4px",
            marginBottom: "8px",
          }}
        >
          Biblioteca de
          <span style={{ color: "#CC0000", textShadow: "0 0 20px rgba(204,0,0,0.5)" }}> Ejercicios</span>
        </motion.h1>

        <p
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "16px",
            fontFamily: "var(--font-body)",
            marginBottom: "40px",
          }}
        >
          {filteredExercises.length} ejercicios disponibles
        </p>

        <div style={{ position: "relative", maxWidth: "400px", marginBottom: "24px" }}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ejercicio..."
            className="input-3d"
            style={{ width: "100%", paddingLeft: "16px", fontSize: "14px" }}
            autoComplete="off"
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            marginBottom: "16px",
            overflowX: "auto",
            paddingBottom: "8px",
          }}
        >
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedGroup("all")}
            style={{
              padding: "8px 20px",
              background: selectedGroup === "all" ? "#CC0000" : "rgba(255,255,255,0.03)",
              border: `1px solid ${selectedGroup === "all" ? "#CC0000" : "rgba(255,255,255,0.08)"}`,
              color: "#ffffff",
              cursor: "pointer",
              fontFamily: "var(--font-display)",
              fontSize: "12px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            Todos ({exercises.length})
          </motion.button>

          {muscleGroups.map((group) => (
            <motion.button
              type="button"
              key={group.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedGroup(group.slug)}
              style={{
                padding: "8px 20px",
                background: selectedGroup === group.slug ? "#CC0000" : "rgba(255,255,255,0.03)",
                border: `1px solid ${selectedGroup === group.slug ? "#CC0000" : "rgba(255,255,255,0.08)"}`,
                color: "#ffffff",
                cursor: "pointer",
                fontFamily: "var(--font-display)",
                fontSize: "12px",
                letterSpacing: "2px",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              {group.name} ({group._count?.exercises ?? 0})
            </motion.button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {(
            [
              { key: "all", label: "Todos los niveles" },
              { key: "BEGINNER", label: "Principiante" },
              { key: "INTERMEDIATE", label: "Intermedio" },
              { key: "ADVANCED", label: "Avanzado" },
            ] as const
          ).map((lv) => (
            <button
              type="button"
              key={lv.key}
              onClick={() => setSelectedLevel(lv.key)}
              style={{
                padding: "6px 16px",
                background: "transparent",
                border: `1px solid ${
                  selectedLevel === lv.key
                    ? LEVEL_COLORS[lv.key] ?? "#CC0000"
                    : "rgba(255,255,255,0.1)"
                }`,
                color:
                  selectedLevel === lv.key
                    ? LEVEL_COLORS[lv.key] ?? "#CC0000"
                    : "rgba(255,255,255,0.4)",
                cursor: "pointer",
                fontFamily: "var(--font-display)",
                fontSize: "11px",
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              {lv.label}
            </button>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px 80px" }}>
        {loading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  height: "320px",
                  background: "#111111",
                  border: "1px solid #1a1a1a",
                  animation: "rutinas-pulse 1.5s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        ) : filteredExercises.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px", color: "rgba(255,255,255,0.3)" }}>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "20px",
                letterSpacing: "4px",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              Sin ejercicios
            </p>
            <p style={{ fontSize: "14px" }}>No hay ejercicios con los filtros seleccionados</p>
          </div>
        ) : (
          <motion.div
            layout
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            <AnimatePresence mode="popLayout">
              {filteredExercises.map((ex, i) => (
                <motion.div
                  key={ex.id}
                  layout
                  role="button"
                  tabIndex={0}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ y: -6 }}
                  onClick={() => setSelectedExercise(ex)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedExercise(ex);
                    }
                  }}
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    backdropFilter: "blur(10px)",
                    cursor: "pointer",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "180px",
                      background: "#0a0a0a",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {ex.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ex.imageUrl}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "linear-gradient(135deg, #0a0a0a, rgba(204,0,0,0.1))",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "48px",
                            color: "rgba(204,0,0,0.3)",
                            letterSpacing: "2px",
                          }}
                        >
                          {(ex.muscleGroup?.name ?? "?").charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        padding: "3px 10px",
                        background: "rgba(0,0,0,0.8)",
                        border: `1px solid ${LEVEL_COLORS[ex.level] ?? "#CC0000"}`,
                        color: LEVEL_COLORS[ex.level] ?? "#CC0000",
                        fontFamily: "var(--font-display)",
                        fontSize: "10px",
                        letterSpacing: "2px",
                        textTransform: "uppercase",
                      }}
                    >
                      {LEVELS[ex.level] ?? ex.level}
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        top: "10px",
                        left: "10px",
                        padding: "3px 10px",
                        background: "rgba(204,0,0,0.8)",
                        color: "#ffffff",
                        fontFamily: "var(--font-display)",
                        fontSize: "10px",
                        letterSpacing: "2px",
                        textTransform: "uppercase",
                      }}
                    >
                      {ex.muscleGroup?.name}
                    </div>
                  </div>
                  <div style={{ padding: "16px" }}>
                    <h3
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "16px",
                        color: "#ffffff",
                        textTransform: "uppercase",
                        letterSpacing: "2px",
                        marginBottom: "8px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ex.name}
                    </h3>
                    {ex.description ? (
                      <p
                        style={{
                          color: "rgba(255,255,255,0.4)",
                          fontSize: "13px",
                          lineHeight: 1.5,
                          marginBottom: "14px",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {ex.description}
                      </p>
                    ) : null}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "8px",
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        paddingTop: "12px",
                      }}
                    >
                      {(
                        [
                          { label: "Series", value: ex.sets ?? "-" },
                          { label: "Reps", value: ex.reps ?? "-" },
                          { label: "Descanso", value: formatRest(ex.restSeconds) },
                        ] as const
                      ).map((stat) => (
                        <div key={stat.label} style={{ textAlign: "center" }}>
                          <p
                            style={{
                              fontFamily: "var(--font-display)",
                              fontSize: "16px",
                              color: "#CC0000",
                              margin: "0 0 2px",
                              letterSpacing: "1px",
                            }}
                          >
                            {stat.value}
                          </p>
                          <p
                            style={{
                              color: "rgba(255,255,255,0.3)",
                              fontSize: "10px",
                              textTransform: "uppercase",
                              fontFamily: "var(--font-display)",
                              letterSpacing: "1px",
                              margin: 0,
                            }}
                          >
                            {stat.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      <AnimatePresence>
        {selectedExercise ? (
          <motion.div
            key="exercise-modal-root"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
              overflowY: "auto",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedExercise(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedExercise(null)}
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.88)",
                backdropFilter: "blur(8px)",
                zIndex: 0,
              }}
            />

            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: "680px",
                maxHeight: "90vh",
                background: "#0a0a0a",
                border: "1px solid rgba(204,0,0,0.3)",
                boxShadow: "0 0 60px rgba(204,0,0,0.15)",
                overflowY: "auto",
                position: "relative",
                zIndex: 1,
                flexShrink: 0,
                scrollbarWidth: "thin",
                scrollbarColor: "#CC0000 #111111",
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedExercise(null)}
                style={{
                  position: "sticky",
                  top: "12px",
                  float: "right",
                  marginRight: "12px",
                  marginTop: "12px",
                  background: "rgba(204,0,0,0.2)",
                  border: "1px solid rgba(204,0,0,0.5)",
                  color: "#CC0000",
                  width: "32px",
                  height: "32px",
                  cursor: "pointer",
                  fontSize: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                  fontFamily: "monospace",
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                x
              </button>

              {selectedExercise.videoUrl ? (
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "16/9",
                    background: "#000",
                    overflow: "hidden",
                    clear: "both" as const,
                  }}
                >
                  <video
                    src={selectedExercise.videoUrl}
                    controls
                    playsInline
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                    poster={selectedExercise.imageUrl ?? undefined}
                  />
                </div>
              ) : selectedExercise.imageUrl ? (
                <div
                  style={{
                    width: "100%",
                    height: "clamp(180px, 35vw, 280px)",
                    overflow: "hidden",
                    flexShrink: 0,
                    clear: "both" as const,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedExercise.imageUrl}
                    alt={selectedExercise.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "clamp(120px, 20vw, 180px)",
                    background: "linear-gradient(135deg, #0a0a0a, rgba(204,0,0,0.08))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    clear: "both" as const,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(32px, 8vw, 56px)",
                      color: "rgba(204,0,0,0.2)",
                      letterSpacing: "4px",
                      textTransform: "uppercase",
                    }}
                  >
                    {selectedExercise.muscleGroup?.name}
                  </span>
                </div>
              )}

              <div style={{ padding: "clamp(16px, 4vw, 28px)" }}>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    marginBottom: "16px",
                  }}
                >
                  <span
                    style={{
                      padding: "4px 14px",
                      background: "rgba(204,0,0,0.12)",
                      border: "1px solid #CC0000",
                      color: "#CC0000",
                      fontFamily: "var(--font-display)",
                      fontSize: "11px",
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                    }}
                  >
                    {selectedExercise.muscleGroup?.name}
                  </span>
                  <span
                    style={{
                      padding: "4px 14px",
                      background: "rgba(0,0,0,0.4)",
                      border: `1px solid ${LEVEL_COLORS[selectedExercise.level] ?? "#CC0000"}`,
                      color: LEVEL_COLORS[selectedExercise.level] ?? "#CC0000",
                      fontFamily: "var(--font-display)",
                      fontSize: "11px",
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                    }}
                  >
                    {LEVELS[selectedExercise.level] ?? selectedExercise.level}
                  </span>
                </div>

                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(20px, 5vw, 32px)",
                    color: "#ffffff",
                    textTransform: "uppercase",
                    letterSpacing: "3px",
                    marginBottom: "20px",
                    lineHeight: 1.2,
                  }}
                >
                  {selectedExercise.name}
                </h2>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "clamp(8px, 2vw, 14px)",
                    marginBottom: "24px",
                  }}
                >
                  {(
                    [
                      { label: "Series", value: selectedExercise.sets ?? "-" },
                      { label: "Repeticiones", value: selectedExercise.reps ?? "-" },
                      {
                        label: "Descanso",
                        value: selectedExercise.restSeconds
                          ? formatRest(selectedExercise.restSeconds)
                          : "-",
                      },
                    ] as const
                  ).map((stat) => (
                    <div
                      key={stat.label}
                      style={{
                        padding: "clamp(10px, 2vw, 18px)",
                        background: "#111111",
                        border: "1px solid rgba(204,0,0,0.15)",
                        textAlign: "center",
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "clamp(20px, 4vw, 28px)",
                          color: "#CC0000",
                          textShadow: "0 0 10px rgba(204,0,0,0.3)",
                          margin: "0 0 4px",
                          letterSpacing: "2px",
                        }}
                      >
                        {stat.value}
                      </p>
                      <p
                        style={{
                          color: "rgba(255,255,255,0.35)",
                          fontSize: "clamp(9px, 2vw, 11px)",
                          textTransform: "uppercase",
                          fontFamily: "var(--font-display)",
                          letterSpacing: "2px",
                          margin: 0,
                        }}
                      >
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>

                {selectedExercise.description ? (
                  <div style={{ marginBottom: "20px" }}>
                    <h4
                      style={{
                        fontFamily: "var(--font-display)",
                        color: "#CC0000",
                        fontSize: "11px",
                        letterSpacing: "3px",
                        textTransform: "uppercase",
                        marginBottom: "10px",
                        paddingBottom: "6px",
                        borderBottom: "1px solid rgba(204,0,0,0.15)",
                      }}
                    >
                      Descripción
                    </h4>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.55)",
                        fontSize: "clamp(13px, 2vw, 15px)",
                        lineHeight: 1.7,
                      }}
                    >
                      {selectedExercise.description}
                    </p>
                  </div>
                ) : null}

                {selectedExercise.instructions ? (
                  <div style={{ marginBottom: "20px" }}>
                    <h4
                      style={{
                        fontFamily: "var(--font-display)",
                        color: "#CC0000",
                        fontSize: "11px",
                        letterSpacing: "3px",
                        textTransform: "uppercase",
                        marginBottom: "10px",
                        paddingBottom: "6px",
                        borderBottom: "1px solid rgba(204,0,0,0.15)",
                      }}
                    >
                      Cómo ejecutar
                    </h4>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.55)",
                        fontSize: "clamp(13px, 2vw, 15px)",
                        lineHeight: 1.7,
                        whiteSpace: "pre-line",
                      }}
                    >
                      {selectedExercise.instructions}
                    </p>
                  </div>
                ) : null}

                {selectedExercise.equipment ? (
                  <div style={{ marginBottom: "20px" }}>
                    <h4
                      style={{
                        fontFamily: "var(--font-display)",
                        color: "#CC0000",
                        fontSize: "11px",
                        letterSpacing: "3px",
                        textTransform: "uppercase",
                        marginBottom: "10px",
                        paddingBottom: "6px",
                        borderBottom: "1px solid rgba(204,0,0,0.15)",
                      }}
                    >
                      Equipo necesario
                    </h4>
                    <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "clamp(13px, 2vw, 15px)" }}>
                      {selectedExercise.equipment}
                    </p>
                  </div>
                ) : null}

                {selectedExercise.tips ? (
                  <div
                    style={{
                      padding: "clamp(12px, 3vw, 18px)",
                      background: "rgba(204,0,0,0.04)",
                      border: "1px solid rgba(204,0,0,0.15)",
                      borderLeft: "3px solid #CC0000",
                      marginBottom: "8px",
                    }}
                  >
                    <h4
                      style={{
                        fontFamily: "var(--font-display)",
                        color: "#CC0000",
                        fontSize: "11px",
                        letterSpacing: "3px",
                        textTransform: "uppercase",
                        marginBottom: "8px",
                      }}
                    >
                      Consejo del entrenador
                    </h4>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.55)",
                        fontSize: "clamp(13px, 2vw, 15px)",
                        lineHeight: 1.7,
                        margin: 0,
                      }}
                    >
                      {selectedExercise.tips}
                    </p>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
