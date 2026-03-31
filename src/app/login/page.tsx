"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { login } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login(email, password);
      const nextRaw = searchParams.get("next") ?? "/app";
      const next =
        nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/app";
      router.push(next);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative z-10 w-full max-w-sm px-4 py-10">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-block">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-xl shadow-zinc-900/20 transition-transform hover:scale-105 active:scale-95">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-7 h-7"
            >
              <path d="M19.5 22.5a3 3 0 003-3v-8.174l-6.879 4.022 3.485 1.876a.75.75 0 01-.712 1.321l-5.683-3.06a1.5 1.5 0 00-1.422 0l-5.683 3.06a.75.75 0 01-.712-1.32l3.485-1.877L1.5 11.326V19.5a3 3 0 003 3h15z" />
              <path d="M1.5 9.589v-.745a3 3 0 011.578-2.641l7.5-4.039a3 3 0 012.844 0l7.5 4.039A3 3 0 0122.5 8.844v.745l-8.426 4.926-.652-.35a3 3 0 00-2.844 0l-.652.35L1.5 9.59z" />
            </svg>
          </div>
        </Link>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-zinc-900">
          Selamat datang kembali
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Masuk ke akun Portfolio Maker Anda
        </p>
      </div>

      <div className="rounded-3xl border border-white/60 bg-white/70 p-8 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] backdrop-blur-2xl">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Email</label>
            <input
              type="email"
              required
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white/50 px-4 py-3 text-sm text-zinc-900 transition-all placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/5 hover:border-zinc-300"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-700">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
              >
                Lupa password?
              </Link>
            </div>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white/50 px-4 py-3 text-sm text-zinc-900 transition-all placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/5 hover:border-zinc-300"
            />
          </div>
          {err ? (
            <div
              className="rounded-xl border border-red-100 bg-red-50 p-3"
              role="alert"
            >
              <p className="text-sm font-medium text-red-600">{err}</p>
            </div>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="group relative mt-2 flex w-full items-center justify-center overflow-hidden rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-zinc-900/20 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                <span>Masuk...</span>
              </div>
            ) : (
              <span>Masuk</span>
            )}
          </button>
        </form>
      </div>

      <p className="mt-8 text-center text-sm text-zinc-600">
        Belum punya akun?{" "}
        <Link
          href="/register"
          className="font-semibold text-zinc-900 transition-all hover:underline"
        >
          Daftar sekarang
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-50 selection:bg-zinc-200">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-gradient-to-b from-indigo-100 to-purple-50 opacity-60 blur-[100px]"></div>
        <div className="absolute -bottom-1/4 -left-1/4 h-1/2 w-1/2 rounded-full bg-gradient-to-t from-teal-50 to-emerald-50 opacity-60 blur-[100px]"></div>
      </div>
      <Suspense
        fallback={
          <div className="relative z-10 py-20 text-sm text-zinc-500">Memuat…</div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
