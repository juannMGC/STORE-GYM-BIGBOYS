"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function RegistroPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(email, password);
      router.push("/tienda");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrarse");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <form
        onSubmit={(e) => void onSubmit(e)}
        className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-2xl font-bold text-zinc-900">Crear cuenta</h1>
        <p className="mt-2 text-sm text-zinc-600">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-medium text-amber-700 hover:underline">
            Iniciá sesión
          </Link>
        </p>
        <p className="mt-4 text-xs text-zinc-500">
          La contraseña debe tener al menos 8 caracteres.
        </p>
        <label className="mt-4 block text-sm font-medium text-zinc-700">Email</label>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
        />
        <label className="mt-4 block text-sm font-medium text-zinc-700">
          Contraseña
        </label>
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
        />
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-amber-500 py-3 font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
        >
          {loading ? "Creando…" : "Registrarme"}
        </button>
      </form>
    </div>
  );
}
