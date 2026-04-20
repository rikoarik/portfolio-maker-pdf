"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { createProject, getMe } from "@/lib/api";

export function LandingActions() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const meQ = useQuery({
    queryKey: ["auth_me"],
    queryFn: getMe,
    retry: false,
  });
  const isAuthenticated = !!meQ.data?.user;

  async function onStart() {
    setErr(null);
    setLoading(true);
    try {
      const p = await createProject({ locale: "id" });
      router.push(`/app/${p.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal membuat proyek");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex w-full flex-col items-center gap-4">
      {isAuthenticated ? (
        <button
          type="button"
          onClick={onStart}
          disabled={loading}
          className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[size:200%_100%] px-8 py-4 text-base font-bold text-white shadow-xl shadow-indigo-500/25 transition-all hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-70 animate-gradient sm:w-auto sm:px-12"
        >
          {loading ? (
            <div className="flex items-center gap-2.5">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span>Menyiapkan...</span>
            </div>
          ) : (
            <>
              <span>Buat proyek baru</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5 transition-transform group-hover:translate-x-1"
              >
                <path
                  fillRule="evenodd"
                  d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                  clipRule="evenodd"
                />
              </svg>
            </>
          )}
        </button>
      ) : (
        <div className="flex w-full max-w-md flex-col gap-2">
          <Link
            href="/register?next=/app"
            className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[size:200%_100%] px-8 py-4 text-base font-bold text-white shadow-xl shadow-indigo-500/25 transition-all hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:scale-[0.97] animate-gradient"
          >
            Daftar & simpan proyek
          </Link>
          <button
            type="button"
            onClick={onStart}
            disabled={loading}
            className="rounded-xl border border-zinc-700 bg-zinc-900/80 px-5 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-60"
          >
            {loading ? "Menyiapkan..." : "Coba dulu tanpa akun"}
          </button>
        </div>
      )}
      {err ? (
        <div
          className="animate-fade-in-up w-full max-w-sm rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 backdrop-blur-md"
          role="alert"
        >
          <p className="text-center text-sm font-medium text-red-400">{err}</p>
        </div>
      ) : null}
      {!isAuthenticated ? (
        <div className="w-full max-w-md rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-left backdrop-blur-md">
          <p className="text-sm font-medium text-amber-200">Mode coba tanpa akun</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-100/80">
            Proyek tetap bisa dibuat, tetapi tidak akan tersimpan ke dashboard akun Anda dan lebih mudah hilang jika sesi browser berubah.
          </p>
        </div>
      ) : null}
    </div>
  );
}
