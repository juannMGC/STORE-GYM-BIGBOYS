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
      className="panel-brand mx-auto max-w-md p-8"
    >
      <h1 className="font-display text-4xl uppercase tracking-wide text-white">
        Iniciar sesión
      </h1>
      <p className="mt-2 text-sm text-zinc-400">
        ¿No tenés cuenta?{" "}
        <Link href="/registro" className="font-medium text-brand-yellow hover:underline">
          Registrate
        </Link>
      </p>
      <label className="mt-6 block text-sm font-medium text-zinc-300">Email</label>
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
        autoComplete="current-password"
        required
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
        {loading ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <Suspense fallback={<div className="text-center text-zinc-500">Cargando…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
