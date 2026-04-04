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
        className="panel-brand mx-auto max-w-md p-8"
      >
        <h1 className="font-display text-4xl uppercase tracking-wide text-white">
          Crear cuenta
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-medium text-brand-yellow hover:underline">
            Iniciá sesión
          </Link>
        </p>
        <p className="mt-4 text-xs text-zinc-500">
          La contraseña debe tener al menos 8 caracteres.
        </p>
        <label className="mt-4 block text-sm font-medium text-zinc-300">Email</label>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-brand mt-1"
        />
        <label className="mt-4 block text-sm font-medium text-zinc-300">
          Contraseña
        </label>
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-brand mt-1"
        />
        {error && <p className="mt-4 text-sm text-brand-red">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="btn-brand mt-6 w-full disabled:opacity-50"
        >
          {loading ? "Creando…" : "Registrarme"}
        </button>
      </form>
    </div>
  );
}
