"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { login, getMe } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const meQ = useQuery({ queryKey: ["auth_me"], queryFn: getMe, retry: false, staleTime: 60_000 });
  useEffect(() => {
    if (meQ.data?.user) router.replace("/app");
  }, [meQ.data, router]);

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
    <div className="relative flex min-h-screen w-full">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#09090b] flex-col justify-between p-12">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute -top-1/4 -left-1/4 w-3/4 aspect-square rounded-full bg-indigo-600/20 blur-[120px] animate-float" />
          <div className="absolute -bottom-1/4 -right-1/4 w-3/4 aspect-square rounded-full bg-purple-600/15 blur-[120px] animate-float" style={{ animationDelay: "3s" }} />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M19.5 22.5a3 3 0 003-3v-8.174l-6.879 4.022 3.485 1.876a.75.75 0 01-.712 1.321l-5.683-3.06a1.5 1.5 0 00-1.422 0l-5.683 3.06a.75.75 0 01-.712-1.32l3.485-1.877L1.5 11.326V19.5a3 3 0 003 3h15z" />
                <path d="M1.5 9.589v-.745a3 3 0 011.578-2.641l7.5-4.039a3 3 0 012.844 0l7.5 4.039A3 3 0 0122.5 8.844v.745l-8.426 4.926-.652-.35a3 3 0 00-2.844 0l-.652.35L1.5 9.59z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white">Portfolio Maker</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-bold tracking-tight text-white leading-tight">
            Buat portofolio{" "}
            <span className="gradient-text">profesional</span>
            {" "}dalam hitungan menit.
          </h2>
          <p className="mt-4 text-base text-zinc-400 leading-relaxed">
            Didukung teknologi AI Gemini untuk menganalisis setiap screenshot dan menghasilkan deskripsi berkualitas tinggi.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            {[
              "Upload screenshot, AI urus sisanya",
              "Export PDF berkualitas profesional",
              "Gratis selamanya untuk paket dasar",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-indigo-400">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-zinc-600">&copy; {new Date().getFullYear()} Portfolio Maker</p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M19.5 22.5a3 3 0 003-3v-8.174l-6.879 4.022 3.485 1.876a.75.75 0 01-.712 1.321l-5.683-3.06a1.5 1.5 0 00-1.422 0l-5.683 3.06a.75.75 0 01-.712-1.32l3.485-1.877L1.5 11.326V19.5a3 3 0 003 3h15z" />
                  <path d="M1.5 9.589v-.745a3 3 0 011.578-2.641l7.5-4.039a3 3 0 012.844 0l7.5 4.039A3 3 0 0122.5 8.844v.745l-8.426 4.926-.652-.35a3 3 0 00-2.844 0l-.652.35L1.5 9.59z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-zinc-900">Portfolio Maker</span>
            </Link>
          </div>

          <div className="animate-fade-in-up">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Selamat datang kembali
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Masuk ke akun Portfolio Maker Anda
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-5 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Email</label>
              <input
                type="email"
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-700"
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
                className="input-field"
              />
            </div>
            {err ? (
              <div
                className="animate-fade-in rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                role="alert"
              >
                <p className="text-sm font-medium text-red-600">{err}</p>
              </div>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full !py-3 !rounded-xl !text-sm"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Masuk...</span>
                </div>
              ) : (
                <span>Masuk</span>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-zinc-500 animate-fade-in-up" style={{ animationDelay: "160ms" }}>
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
            >
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
