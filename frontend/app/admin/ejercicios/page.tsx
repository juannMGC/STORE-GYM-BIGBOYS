"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
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

const LEVEL_OPTIONS = [
  { value: "BEGINNER", label: "Principiante" },
  { value: "INTERMEDIATE", label: "Intermedio" },
  { value: "ADVANCED", label: "Avanzado" },
] as const;

type MuscleGroupRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  order: number;
  _count?: { exercises: number };
};

type ExerciseRow = {
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
  active: boolean;
  featured: boolean;
  order: number;
  muscleGroupId: string;
  muscleGroup: { id: string; name: string; slug: string };
};

export default function AdminEjerciciosPage() {
  const [tab, setTab] = useState<"exercises" | "groups">("exercises");
  const [groups, setGroups] = useState<MuscleGroupRow[]>([]);
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [exerciseModal, setExerciseModal] = useState(false);
  const [groupModal, setGroupModal] = useState(false);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [gName, setGName] = useState("");
  const [gDesc, setGDesc] = useState("");
  const [gOrder, setGOrder] = useState("0");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [muscleGroupId, setMuscleGroupId] = useState("");
  const [level, setLevel] = useState<string>("BEGINNER");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [restSeconds, setRestSeconds] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [equipment, setEquipment] = useState("");
  const [tips, setTips] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [featured, setFeatured] = useState(false);
  const [order, setOrder] = useState("0");

  const loadGroups = useCallback(async () => {
    const data = await apiFetch<MuscleGroupRow[]>("/exercises/muscle-groups", { skipAuth: true });
    setGroups(Array.isArray(data) ? data : []);
  }, []);

  const loadExercises = useCallback(async () => {
    const data = await apiFetch<ExerciseRow[]>("/exercises/admin/all");
    setExercises(Array.isArray(data) ? data : []);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      await loadGroups();
      await loadExercises();
    } catch (e) {
      setListError(e instanceof ApiError ? e.message : "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, [loadExercises, loadGroups]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetExerciseForm() {
    setEditingExerciseId(null);
    setName("");
    setSlug("");
    setMuscleGroupId(groups[0]?.id ?? "");
    setLevel("BEGINNER");
    setSets("");
    setReps("");
    setRestSeconds("");
    setDescription("");
    setInstructions("");
    setEquipment("");
    setTips("");
    setImageUrl("");
    setVideoUrl("");
    setFeatured(false);
    setOrder("0");
    setFeedback(null);
  }

  function resetGroupForm() {
    setEditingGroupId(null);
    setGName("");
    setGDesc("");
    setGOrder("0");
    setFeedback(null);
  }

  function openNewExercise() {
    resetExerciseForm();
    setMuscleGroupId(groups[0]?.id ?? "");
    setExerciseModal(true);
  }

  function openEditExercise(ex: ExerciseRow) {
    setEditingExerciseId(ex.id);
    setName(ex.name);
    setSlug(ex.slug);
    setMuscleGroupId(ex.muscleGroupId);
    setLevel(ex.level);
    setSets(ex.sets != null ? String(ex.sets) : "");
    setReps(ex.reps ?? "");
    setRestSeconds(ex.restSeconds != null ? String(ex.restSeconds) : "");
    setDescription(ex.description ?? "");
    setInstructions(ex.instructions ?? "");
    setEquipment(ex.equipment ?? "");
    setTips(ex.tips ?? "");
    setImageUrl(ex.imageUrl ?? "");
    setVideoUrl(ex.videoUrl ?? "");
    setFeatured(ex.featured);
    setOrder(String(ex.order));
    setFeedback(null);
    setExerciseModal(true);
  }

  async function saveExercise() {
    if (!name.trim() || !muscleGroupId) {
      setFeedback("Completá nombre y grupo muscular.");
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        muscleGroupId,
        level,
        featured,
        order: Number(order) || 0,
        description: description.trim() || undefined,
        instructions: instructions.trim() || undefined,
        equipment: equipment.trim() || undefined,
        tips: tips.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        videoUrl: videoUrl.trim() || undefined,
      };
      if (sets.trim()) body.sets = Number(sets);
      if (reps.trim()) body.reps = reps.trim();
      if (restSeconds.trim()) body.restSeconds = Number(restSeconds);
      if (slug.trim()) body.slug = slug.trim();

      if (editingExerciseId) {
        await apiFetch(`/exercises/${editingExerciseId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch("/exercises", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      setExerciseModal(false);
      resetExerciseForm();
      await loadExercises();
      await loadGroups();
    } catch (e) {
      setFeedback(e instanceof ApiError ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function toggleExercise(id: string) {
    try {
      await apiFetch(`/exercises/${id}/toggle`, { method: "PATCH" });
      await loadExercises();
    } catch {
      /* ignore */
    }
  }

  async function deleteExercise(id: string) {
    if (!confirm("¿Eliminar este ejercicio?")) return;
    try {
      await apiFetch(`/exercises/${id}`, { method: "DELETE" });
      await loadExercises();
      await loadGroups();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Error");
    }
  }

  async function saveGroup() {
    if (!gName.trim()) {
      setFeedback("Nombre requerido");
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      if (editingGroupId) {
        await apiFetch(`/exercises/muscle-groups/${editingGroupId}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: gName.trim(),
            description: gDesc.trim() || null,
            order: Number(gOrder) || 0,
          }),
        });
      } else {
        await apiFetch("/exercises/muscle-groups", {
          method: "POST",
          body: JSON.stringify({
            name: gName.trim(),
            description: gDesc.trim() || undefined,
            order: Number(gOrder) || 0,
          }),
        });
      }
      setGroupModal(false);
      resetGroupForm();
      await loadGroups();
    } catch (e) {
      setFeedback(e instanceof ApiError ? e.message : "Error al guardar grupo");
    } finally {
      setSaving(false);
    }
  }

  async function deleteGroup(id: string) {
    if (!confirm("¿Eliminar este grupo? Solo si no tiene ejercicios.")) return;
    try {
      await apiFetch(`/exercises/muscle-groups/${id}`, { method: "DELETE" });
      await loadGroups();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Error");
    }
  }

  function levelLabel(v: string) {
    return LEVEL_OPTIONS.find((o) => o.value === v)?.label ?? v;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <BackButton href="/admin" label="Volver al panel" />

      <h1 className="font-display mt-6 text-3xl uppercase tracking-wider text-white">Ejercicios</h1>
      <p className="mt-1 text-sm text-zinc-500">Biblioteca de rutinas y grupos musculares</p>

      <div className="mt-6 flex gap-2 border-b border-zinc-800 pb-2">
        <button
          type="button"
          onClick={() => setTab("exercises")}
          className={`rounded px-4 py-2 font-display text-xs uppercase tracking-wider ${
            tab === "exercises" ? "bg-brand-red text-white" : "text-zinc-400 hover:text-white"
          }`}
        >
          Ejercicios
        </button>
        <button
          type="button"
          onClick={() => setTab("groups")}
          className={`rounded px-4 py-2 font-display text-xs uppercase tracking-wider ${
            tab === "groups" ? "bg-brand-red text-white" : "text-zinc-400 hover:text-white"
          }`}
        >
          Grupos musculares
        </button>
      </div>

      {listError ? <p className="mt-4 text-sm text-red-400">{listError}</p> : null}

      {tab === "exercises" ? (
        <>
          <div className="mt-6 flex justify-end">
            <button type="button" className="btn-brand" onClick={() => openNewExercise()}>
              Nuevo ejercicio
            </button>
          </div>

          {loading ? (
            <AdminTableSkeleton />
          ) : (
            <div className="mt-6 overflow-x-auto rounded border border-brand-border">
              <table className="w-full min-w-[800px] text-left text-sm text-zinc-300">
                <thead className="border-b border-brand-border bg-zinc-900/80 font-display text-xs uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="p-3">Imagen</th>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Grupo</th>
                    <th className="p-3">Nivel</th>
                    <th className="p-3">Series / Reps</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {exercises.map((ex) => (
                    <tr key={ex.id} className="border-b border-zinc-800/80">
                      <td className="p-3">
                        {ex.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={ex.imageUrl} alt="" className="h-12 w-12 rounded object-cover" />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded bg-zinc-800 text-xs text-zinc-600">
                            —
                          </div>
                        )}
                      </td>
                      <td className="p-3 font-medium text-white">{ex.name}</td>
                      <td className="p-3">{ex.muscleGroup.name}</td>
                      <td className="p-3">{levelLabel(ex.level)}</td>
                      <td className="p-3 text-xs">
                        {ex.sets ?? "—"} / {ex.reps ?? "—"}
                      </td>
                      <td className="p-3">
                        <span className={ex.active ? "text-green-500" : "text-zinc-500"}>
                          {ex.active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          className="mr-2 text-xs text-brand-yellow hover:underline"
                          onClick={() => openEditExercise(ex)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="mr-2 text-xs text-zinc-400 hover:underline"
                          onClick={() => void toggleExercise(ex.id)}
                        >
                          Activar/desactivar
                        </button>
                        <button
                          type="button"
                          className="text-xs text-red-400 hover:underline"
                          onClick={() => void deleteExercise(ex.id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {exercises.length === 0 ? (
                <p className="p-6 text-center text-zinc-500">No hay ejercicios todavía.</p>
              ) : null}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              className="btn-brand"
              onClick={() => {
                resetGroupForm();
                setGroupModal(true);
              }}
            >
              Nuevo grupo
            </button>
          </div>
          <div className="mt-6 overflow-x-auto rounded border border-brand-border">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="border-b border-brand-border bg-zinc-900/80 font-display text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Slug</th>
                  <th className="p-3">Ejercicios</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr key={g.id} className="border-b border-zinc-800/80">
                    <td className="p-3 font-medium text-white">{g.name}</td>
                    <td className="p-3 text-zinc-500">{g.slug}</td>
                    <td className="p-3">{g._count?.exercises ?? 0}</td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        className="mr-2 text-xs text-brand-yellow hover:underline"
                        onClick={() => {
                          setEditingGroupId(g.id);
                          setGName(g.name);
                          setGDesc(g.description ?? "");
                          setGOrder(String(g.order));
                          setFeedback(null);
                          setGroupModal(true);
                        }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="text-xs text-red-400 hover:underline"
                        onClick={() => void deleteGroup(g.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {exerciseModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded border border-brand-border bg-zinc-950 p-6"
            role="dialog"
            aria-modal
          >
            <h2 className="font-display text-xl uppercase text-white">
              {editingExerciseId ? "Editar ejercicio" : "Nuevo ejercicio"}
            </h2>
            {feedback ? <p className="mt-2 text-sm text-red-400">{feedback}</p> : null}

            <label className="mt-4 block" style={labelStyle}>
              Nombre *
            </label>
            <input
              className="input-brand w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <label className="mt-3 block" style={labelStyle}>
              Slug (opcional)
            </label>
            <input
              className="input-brand w-full"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="auto desde nombre si vacío"
            />

            <label className="mt-3 block" style={labelStyle}>
              Grupo muscular *
            </label>
            <select
              className="input-brand w-full"
              value={muscleGroupId}
              onChange={(e) => setMuscleGroupId(e.target.value)}
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>

            <label className="mt-3 block" style={labelStyle}>
              Nivel *
            </label>
            <select
              className="input-brand w-full"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              {LEVEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <div>
                <label style={labelStyle}>Series</label>
                <input
                  className="input-brand w-full"
                  type="number"
                  min={1}
                  value={sets}
                  onChange={(e) => setSets(e.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle}>Reps</label>
                <input
                  className="input-brand w-full"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  placeholder="8-12"
                />
              </div>
              <div>
                <label style={labelStyle}>Descanso (s)</label>
                <input
                  className="input-brand w-full"
                  type="number"
                  min={0}
                  value={restSeconds}
                  onChange={(e) => setRestSeconds(e.target.value)}
                />
              </div>
            </div>

            <label className="mt-3 block" style={labelStyle}>
              Descripción
            </label>
            <textarea
              className="input-brand min-h-[72px] w-full"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <label className="mt-3 block" style={labelStyle}>
              Instrucciones
            </label>
            <textarea
              className="input-brand min-h-[72px] w-full"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />

            <label className="mt-3 block" style={labelStyle}>
              Equipo
            </label>
            <input className="input-brand w-full" value={equipment} onChange={(e) => setEquipment(e.target.value)} />

            <label className="mt-3 block" style={labelStyle}>
              Consejo del entrenador
            </label>
            <textarea className="input-brand min-h-[60px] w-full" value={tips} onChange={(e) => setTips(e.target.value)} />

            <label className="mt-3 block" style={labelStyle}>
              Imagen
            </label>
            <ImageUploader
              folder="exercises"
              currentUrl={imageUrl}
              onUpload={(url) => setImageUrl(url)}
              onError={(msg) => setFeedback(msg)}
              size="md"
            />

            <label className="mt-3 block" style={labelStyle}>
              Video URL
            </label>
            <input
              className="input-brand w-full"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://..."
            />

            <div className="mt-3 flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
                Destacado
              </label>
              <div className="flex items-center gap-2">
                <span style={labelStyle}>Orden</span>
                <input
                  className="input-brand w-20"
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="btn-brand-outline" onClick={() => setExerciseModal(false)}>
                Cancelar
              </button>
              <button type="button" className="btn-brand" disabled={saving} onClick={() => void saveExercise()}>
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {groupModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded border border-brand-border bg-zinc-950 p-6">
            <h2 className="font-display text-xl uppercase text-white">
              {editingGroupId ? "Editar grupo" : "Nuevo grupo muscular"}
            </h2>
            {feedback ? <p className="mt-2 text-sm text-red-400">{feedback}</p> : null}
            <label className="mt-4 block" style={labelStyle}>
              Nombre *
            </label>
            <input className="input-brand w-full" value={gName} onChange={(e) => setGName(e.target.value)} />
            <label className="mt-3 block" style={labelStyle}>
              Descripción
            </label>
            <textarea className="input-brand min-h-[60px] w-full" value={gDesc} onChange={(e) => setGDesc(e.target.value)} />
            <label className="mt-3 block" style={labelStyle}>
              Orden
            </label>
            <input className="input-brand w-full" type="number" value={gOrder} onChange={(e) => setGOrder(e.target.value)} />
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="btn-brand-outline" onClick={() => setGroupModal(false)}>
                Cancelar
              </button>
              <button type="button" className="btn-brand" disabled={saving} onClick={() => void saveGroup()}>
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
