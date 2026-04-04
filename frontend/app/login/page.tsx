"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/lib/auth-context";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      const next = searchParams.get("next") || "/";
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm"
    >
      <h1 className="text-2xl font-bold text-zinc-900">Iniciar sesión</h1>
      <p className="mt-2 text-sm text-zinc-600">
        ¿No tenés cuenta?{" "}
        <Link href="/registro" className="font-medium text-amber-700 hover:underline">
          Registrate
        </Link>
      </p>
      <label className="mt-6 block text-sm font-medium text-zinc-700">Email</label>
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
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
      />
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-lg bg-zinc-900 py-3 font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {loading ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <Suspense fallback={<div className="text-center text-zinc-600">Cargando…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
