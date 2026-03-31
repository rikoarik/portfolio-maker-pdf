"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { register as registerApi } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const r = await registerApi(email, password, name || undefined);
      if (r.needsEmailConfirmation) {
        router.push(`/check-email?email=${encodeURIComponent(email)}`);
        return;
      }
      router.push("/app");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Pendaftaran gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-50 selection:bg-zinc-200">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-gradient-to-tr from-rose-100 to-orange-50 blur-[100px] opacity-60"></div>
        <div className="absolute -bottom-1/4 right-1/4 w-1/2 h-1/2 rounded-full bg-gradient-to-bl from-blue-50 to-indigo-50 blur-[100px] opacity-60"></div>
      </div>

      <div className="relative z-10 w-full max-w-sm px-4 py-10">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-xl shadow-zinc-900/20 transition-transform hover:scale-105 active:scale-95">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path d="M11.47 3.841a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.061l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 101.061 1.06l8.69-8.689z" />
                <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
              </svg>
            </div>
          </Link>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-zinc-900">Buat Akun Baru</h1>
          <p className="mt-2 text-sm text-zinc-500">Mulai buat portofolio PDF Anda hari ini</p>
        </div>

        <div className="rounded-3xl border border-white/60 bg-white/70 p-8 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] backdrop-blur-2xl">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Nama (opsional)</label>
              <input
                type="text"
                placeholder="Mis: John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white/50 px-4 py-3 text-sm text-zinc-900 transition-all placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/5 hover:border-zinc-300"
              />
            </div>
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
                <label className="text-sm font-medium text-zinc-700">Password</label>
                <span className="text-xs text-zinc-500">Min. 8 karakter</span>
              </div>
              <input
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white/50 px-4 py-3 text-sm text-zinc-900 transition-all placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/5 hover:border-zinc-300"
              />
            </div>
            {err ? (
              <div className="rounded-xl bg-red-50 p-3 border border-red-100" role="alert">
                <p className="text-sm text-red-600 font-medium">{err}</p>
              </div>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-zinc-900/20 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 mt-2"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                  <span>Membuat akun...</span>
                </div>
              ) : (
                <span>Daftar Sekarang</span>
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-sm text-zinc-600">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-zinc-900 hover:underline transition-all">
            Masuk ke akun
          </Link>
        </p>
      </div>
    </div>
  );
}
