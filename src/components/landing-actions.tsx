"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createProject } from "@/lib/api";

export function LandingActions() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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
    <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-center">
      <button
        type="button"
        onClick={onStart}
        disabled={loading}
        className="group relative flex w-full items-center justify-center overflow-hidden rounded-full bg-zinc-900 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-zinc-900/20 transition-all hover:bg-zinc-800 hover:shadow-2xl hover:shadow-zinc-900/30 hover:-translate-y-0.5 active:scale-95 disabled:pointer-events-none disabled:opacity-70 sm:w-auto sm:px-10"
      >
        {loading ? (
          <div className="flex items-center space-x-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
            <span>Menyiapkan...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span>Mulai Buat Portofolio</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 transition-transform group-hover:translate-x-1">
              <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </button>
      {err ? (
        <div className="absolute -bottom-10 rounded-xl bg-red-50 px-4 py-2 border border-red-100 shadow-sm" role="alert">
          <p className="text-center text-sm font-medium text-red-600">
            {err}
          </p>
        </div>
      ) : null}
    </div>
  );
}
