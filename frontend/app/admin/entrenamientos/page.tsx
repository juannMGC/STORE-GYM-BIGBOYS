"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { AdminTableSkeleton } from "@/components/admin/table-skeleton";
import { ImageUploader } from "@/components/image-uploader";
import { apiFetch, ApiError } from "@/lib/api-client";

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "6px",
  fontSize: "11px",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#71717a",
};

const DAY_OPTIONS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
  "Lunes a Viernes",
  "Lunes a Sábado",
  "Todos los días",
  "Lunes, Miércoles y Viernes",
  "Martes y Jueves",
  "Sábados",
  "Domingos",
];

type ScheduleRow = {
  day: string;
  startTime: string;
  endTime: string;
  spots: number | null;
};

type TrainingAdmin = {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDesc: string | null;
  price: number;
  priceLabel: string | null;
  imageUrl: string | null;
  icon: string | null;
  active: boolean;
  featured: boolean;
  order: number;
  benefits: { id: string; text: string; order: number }[];
  schedules: {
    id: string;
    day: string;
    startTime: string;
    endTime: string;
    spots: number | null;
  }[];
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function normalizeTime(t: string): string {
  if (!t) return "09:00";
  return t.length >= 5 ? t.slice(0, 5) : t;
}

export default function AdminEntrenamientosPage() {
  const [rows, setRows] = useState<TrainingAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formFeedback, setFormFeedback] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("🏋️");
  const [description, setDescription] = useState("");
  const [longDesc, setLongDesc] = useState("");
  const [price, setPrice] = useState("");
  const [priceLabel, setPriceLabel] = useState("por mes");
  const [imageUrl, setImageUrl] = useState("");
  const [featured, setFeatured] = useState(false);
  const [order, setOrder] = useState("0");
  const [active, setActive] = useState(true);
  const [benefits, setBenefits] = useState<string[]>([]);
  const [benefitInput, setBenefitInput] = useState("");
  const [horarios, setHorarios] = useState<ScheduleRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const data = await apiFetch<TrainingAdmin[]>("/trainings/admin/all");
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setListError(e instanceof ApiError ? e.message : "No se pudieron cargar los entrenamientos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setSlug("");
    setIcon("🏋️");
    setDescription("");
    setLongDesc("");
    setPrice("");
    setPriceLabel("por mes");
    setImageUrl("");
    setFeatured(false);
    setOrder("0");
    setActive(true);
    setBenefits([]);
    setBenefitInput("");
    setHorarios([]);
    setFormFeedback(null);
  }

  function openCreate() {
    resetForm();
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  async function openEdit(id: string) {
    setFormFeedback(null);
    try {
      const t = await apiFetch<TrainingAdmin>(`/trainings/admin/${id}`);
      setEditingId(t.id);
      setName(t.name);
      setSlug(t.slug);
      setIcon(t.icon ?? "🏋️");
      setDescription(t.description);
      setLongDesc(t.longDesc ?? "");
      setPrice(String(t.price));
      setPriceLabel(t.priceLabel ?? "por mes");
      setImageUrl(t.imageUrl ?? "");
      setFeatured(t.featured);
      setOrder(String(t.order));
      setActive(t.active);
      setBenefits(t.benefits.map((b) => b.text));
      setHorarios(
        t.schedules.map((s) => ({
          day: s.day,
          startTime: normalizeTime(s.startTime),
          endTime: normalizeTime(s.endTime),
          spots: s.spots,
        })),
      );
      setModalOpen(true);
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Error al cargar");
    }
  }

  function addBenefit() {
    const t = benefitInput.trim();
    if (!t) return;
    setBenefits((prev) => [...prev, t]);
    setBenefitInput("");
  }

  function removeBenefit(i: number) {
    setBenefits((prev) => prev.filter((_, j) => j !== i));
  }

  function addHorario() {
    setHorarios((prev) => [
      ...prev,
      { day: "Lunes", startTime: "09:00", endTime: "10:00", spots: null },
    ]);
  }

  function updateHorario(i: number, field: keyof ScheduleRow, value: string | number | null) {
    setHorarios((prev) =>
      prev.map((h, j) => (j === i ? { ...h, [field]: value } : h)),
    );
  }

  function removeHorario(i: number) {
    setHorarios((prev) => prev.filter((_, j) => j !== i));
  }

  async function submit() {
    setFormFeedback(null);
    const nameTrim = name.trim();
    const descTrim = description.trim();
    if (!nameTrim || !descTrim) {
      setFormFeedback("Nombre y descripción corta son obligatorios.");
      return;
    }
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setFormFeedback("Precio inválido.");
      return;
    }
    const slugVal = slug.trim() || slugify(nameTrim);
    if (!slugVal) {
      setFormFeedback("Slug inválido.");
      return;
    }

    const schedulesPayload = horarios.map((h) => ({
      day: h.day,
      startTime: normalizeTime(h.startTime),
      endTime: normalizeTime(h.endTime),
      spots: h.spots === null || h.spots === undefined ? null : Number(h.spots),
    }));

    setSaving(true);
    try {
      if (editingId) {
        const payload = {
          name: nameTrim,
          slug: slugVal,
          description: descTrim,
          longDesc: longDesc.trim(),
          price: priceNum,
          priceLabel: priceLabel.trim() || "por mes",
          imageUrl: imageUrl.trim(),
          icon: icon.trim(),
          featured,
          order: Number(order) || 0,
          active,
          benefits,
          schedules: schedulesPayload,
        };
        await apiFetch(`/trainings/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        const payload = {
          name: nameTrim,
          slug: slugVal,
          description: descTrim,
          longDesc: longDesc.trim() || undefined,
          price: priceNum,
          priceLabel: priceLabel.trim() || "por mes",
          imageUrl: imageUrl.trim() || undefined,
          icon: icon.trim() || undefined,
          featured,
          order: Number(order) || 0,
          active,
          benefits,
          schedules: schedulesPayload,
        };
        await apiFetch("/trainings", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      await load();
      closeModal();
      resetForm();
    } catch (e) {
      setFormFeedback(e instanceof ApiError ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function toggleRow(id: string) {
    try {
      await apiFetch(`/trainings/${id}/toggle`, { method: "PATCH" });
      await load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Error");
    }
  }

  async function deleteRow(id: string, label: string) {
    if (!confirm(`¿Eliminar "${label}"? Esta acción no se puede deshacer.`)) return;
    try {
      await apiFetch(`/trainings/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Error al eliminar");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-6 md:pt-10">
      <BackButton href="/admin" label="← Dashboard" />

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl uppercase tracking-wide text-white md:text-4xl">
          Entrenamientos
        </h1>
        <button type="button" className="btn-brand shrink-0" onClick={openCreate}>
          + Nuevo
        </button>
      </div>

      {listError ? (
        <p className="mt-4 text-sm text-brand-red" role="alert">
          {listError}
        </p>
      ) : null}

      {loading ? (
        <div className="mt-8">
          <AdminTableSkeleton />
        </div>
      ) : (
        <div className="panel-brand mt-8 overflow-hidden" style={{ border: "1px solid #2a2a2a" }}>
          {rows.length === 0 ? (
            <p className="p-8 text-center text-zinc-500">No hay entrenamientos cargados.</p>
          ) : (
            <ul className="divide-y divide-[#1a1a1a]">
              {rows.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="text-2xl">{r.icon ?? "🏋️"}</span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">{r.name}</p>
                      <p className="truncate text-sm text-zinc-500">
                        ${Number(r.price).toLocaleString("es-CO")} · {r.slug}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={
                        r.active
                          ? "rounded-sm bg-emerald-950 px-2 py-0.5 text-xs text-emerald-400"
                          : "rounded-sm bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500"
                      }
                    >
                      {r.active ? "ON" : "OFF"}
                    </span>
                    <button
                      type="button"
                      className="btn-brand-outline px-3 py-1 text-xs"
                      onClick={() => void toggleRow(r.id)}
                    >
                      Toggle
                    </button>
                    <button
                      type="button"
                      className="btn-brand-outline px-3 py-1 text-xs"
                      onClick={() => void openEdit(r.id)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="border border-brand-red px-3 py-1 text-xs text-brand-red"
                      onClick={() => void deleteRow(r.id, r.name)}
                    >
                      🗑️
                    </button>
                    <Link
                      href={`/entrenamientos/${r.slug}`}
                      className="text-xs text-zinc-500 underline hover:text-brand-yellow"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver público
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {modalOpen ? (
        <div
          className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/80 p-4 py-10"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="panel-brand w-full max-w-lg border border-[#2a2a2a] p-6"
            style={{ marginBottom: "48px" }}
          >
            <h2 className="font-display text-lg uppercase tracking-wide text-brand-yellow">
              {editingId ? "Editar entrenamiento" : "Nuevo entrenamiento"}
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label style={labelStyle}>Nombre *</label>
                <input
                  className="input-brand w-full"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => {
                    if (!editingId && !slug.trim()) setSlug(slugify(name));
                  }}
                />
              </div>
              <div>
                <label style={labelStyle}>Slug</label>
                <input
                  className="input-brand w-full"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="auto desde el nombre"
                />
              </div>
              <div>
                <label style={labelStyle}>Ícono (emoji)</label>
                <input
                  className="input-brand w-full"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  maxLength={20}
                />
              </div>
              <div>
                <label style={labelStyle}>Descripción corta *</label>
                <textarea className="input-brand min-h-[72px] w-full" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Descripción detallada</label>
                <textarea className="input-brand min-h-[100px] w-full" value={longDesc} onChange={(e) => setLongDesc(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label style={labelStyle}>Precio *</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="input-brand w-full"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Etiqueta precio</label>
                  <input
                    className="input-brand w-full"
                    value={priceLabel}
                    onChange={(e) => setPriceLabel(e.target.value)}
                    placeholder="por mes"
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Imagen (Cloudinary)</label>
                <ImageUploader
                  folder="trainings"
                  currentUrl={imageUrl || null}
                  onUpload={(url) => setImageUrl(url)}
                  size="md"
                />
              </div>
              <div>
                <label style={labelStyle}>URL imagen (alternativo)</label>
                <input
                  className="input-brand w-full"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="flex flex-wrap gap-6">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
                  <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
                  Destacado
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
                  <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
                  Activo
                </label>
              </div>
              <div>
                <label style={labelStyle}>Orden</label>
                <input
                  type="number"
                  className="input-brand w-full max-w-[120px]"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                />
              </div>

              <div style={{ border: "1px solid #2a2a2a", padding: "16px" }}>
                <p style={labelStyle}>Beneficios</p>
                <div className="mb-2 flex gap-2">
                  <input
                    className="input-brand min-w-0 flex-1"
                    value={benefitInput}
                    onChange={(e) => setBenefitInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addBenefit();
                      }
                    }}
                    placeholder="Texto del beneficio"
                  />
                  <button type="button" className="btn-brand-outline shrink-0 px-3 text-sm" onClick={addBenefit}>
                    +
                  </button>
                </div>
                <ul className="space-y-1">
                  {benefits.map((b, i) => (
                    <li key={`${b}-${i}`} className="flex items-center justify-between gap-2 text-sm text-zinc-300">
                      <span className="min-w-0 truncate">{b}</span>
                      <button type="button" className="text-brand-red" onClick={() => removeBenefit(i)} aria-label="Quitar">
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ border: "1px solid #2a2a2a", padding: "16px" }}>
                <p style={labelStyle}>Horarios</p>
                <div className="space-y-3">
                  {horarios.map((h, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-1 gap-2 border-b border-[#1a1a1a] pb-3 last:border-0 md:grid-cols-[2fr_1fr_1fr_1fr_auto]"
                    >
                      <select
                        value={h.day}
                        onChange={(e) => updateHorario(i, "day", e.target.value)}
                        className="select-brand w-full"
                      >
                        {!DAY_OPTIONS.includes(h.day) ? (
                          <option value={h.day}>{h.day}</option>
                        ) : null}
                        {DAY_OPTIONS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <input
                        type="time"
                        value={h.startTime}
                        onChange={(e) => updateHorario(i, "startTime", e.target.value)}
                        className="input-brand w-full"
                      />
                      <input
                        type="time"
                        value={h.endTime}
                        onChange={(e) => updateHorario(i, "endTime", e.target.value)}
                        className="input-brand w-full"
                      />
                      <input
                        type="number"
                        min={0}
                        value={h.spots ?? ""}
                        onChange={(e) =>
                          updateHorario(
                            i,
                            "spots",
                            e.target.value === "" ? null : Number(e.target.value),
                          )
                        }
                        placeholder="Cupos"
                        className="input-brand w-full"
                      />
                      <button
                        type="button"
                        onClick={() => removeHorario(i)}
                        style={{
                          background: "none",
                          border: "1px solid #d91920",
                          color: "#d91920",
                          padding: "6px 10px",
                          cursor: "pointer",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addHorario} className="btn-brand-outline mt-3 text-xs">
                  + Agregar horario
                </button>
              </div>
            </div>

            {formFeedback ? (
              <p className="mt-4 text-sm text-brand-red" role="alert">
                {formFeedback}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" className="btn-brand" disabled={saving} onClick={() => void submit()}>
                {saving ? "Guardando…" : "Guardar"}
              </button>
              <button type="button" className="btn-brand-outline" onClick={closeModal}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
