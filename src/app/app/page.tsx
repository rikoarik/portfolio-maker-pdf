"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { ApiError, downloadBatchPdf, listMyProjects, getMe } from "@/lib/api";

function statusBadgeClass(status: string): string {
  if (status === "draft") return "bg-zinc-100 text-zinc-600 border-zinc-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

function statusLabel(status: string): string {
  if (status === "draft") return "Draft";
  return status;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ProgressBar({ value, max, label, color = "indigo" }: { value: number; max: number; label: string; color?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const colors = {
    indigo: "from-indigo-500 to-purple-500",
    emerald: "from-emerald-500 to-teal-500",
  };
  return (
    <div className="flex-1 min-w-[140px]">
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-zinc-500 font-medium">{label}</span>
        <span className="text-zinc-700 font-semibold tabular-nums">{value}/{max}</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${colors[color as keyof typeof colors] || colors.indigo} transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function AppProjectsPage() {
  const q = useQuery({
    queryKey: ["my-projects"],
    queryFn: listMyProjects,
    retry: false,
  });

  const u = useQuery({
    queryKey: ["auth_me"],
    queryFn: getMe,
    retry: false,
  });

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchTemplate, setBatchTemplate] = useState<"default" | "compact">("default");
  const [batchError, setBatchError] = useState<string | null>(null);

  const batchMut = useMutation({
    mutationFn: () =>
      downloadBatchPdf(Array.from(selectedIds), batchTemplate),
    onSuccess: (blob) => {
      triggerDownload(blob, `portfolio-gabungan-${Date.now()}.pdf`);
      setBatchError(null);
    },
    onError: (e: unknown) => {
      if (e instanceof ApiError && e.code === "quota_exceeded") {
        setBatchError(`${e.message} Lihat /pricing untuk upgrade.`);
        return;
      }
      setBatchError(e instanceof Error ? e.message : "Gagal membuat PDF.");
    },
  });

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelectionMode() {
    setSelectionMode(false);
    setSelectedIds(new Set());
    setBatchError(null);
  }

  if (q.isPending || u.isPending) {
    return (
      <div className="py-16">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-7 w-48 rounded-lg skeleton" />
              <div className="mt-3 h-4 w-64 rounded skeleton" />
            </div>
            <div className="h-10 w-32 rounded-xl skeleton" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-2xl skeleton" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (q.isError) {
    const err = q.error;
    const dbDown =
      err instanceof ApiError && err.code === "database_unreachable";

    return (
      <div className="mx-auto max-w-lg py-16">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-red-700 font-medium">
            {err instanceof Error ? err.message : "Gagal memuat proyek"}
          </p>
          {dbDown ? (
            <p className="mt-3 text-sm text-zinc-600">
              Ini masalah koneksi database di server (bukan akun Anda). Periksa{" "}
              <code className="rounded bg-zinc-100 px-1 text-xs">DATABASE_URL</code>{" "}
              di <code className="rounded bg-zinc-100 px-1 text-xs">.env</code>, jalankan{" "}
              <code className="rounded bg-zinc-100 px-1 text-xs">npm run db:test</code>
              , lalu restart <code className="rounded bg-zinc-100 px-1 text-xs">npm run dev</code>.
            </p>
          ) : (
            <div className="mt-4 flex justify-center gap-4 text-sm">
              <Link href="/login" className="text-indigo-600 font-medium hover:underline">
                Masuk
              </Link>
              <Link href="/" className="text-indigo-600 font-medium hover:underline">
                Buat proyek baru
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  const projects = q.data.projects;
  const userTier = u.data?.user?.tier || "FREE";
  const plan = u.data?.user?.plan;
  const usage = u.data?.user?.usageThisMonth;
  const aiCap = plan?.maxAiAnalysesPerPeriod ?? 15;
  const aiUsed = usage?.ai_analysis ?? 0;
  const pdfCap = plan?.maxPdfExportsPerPeriod ?? 10;
  const pdfUsed = usage?.pdf_export ?? 0;
  const isPro = userTier === "PRO";

  return (
    <div className="pb-32 animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
            Proyek saya
            {isPro ? (
              <span className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider shadow-md shadow-indigo-500/20">
                PRO
              </span>
            ) : (
              <span className="rounded-lg bg-zinc-100 border border-zinc-200 px-2.5 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Gratis
              </span>
            )}
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            {projects.length} proyek tersimpan
            {usage && (
              <span className="ml-2 text-xs text-zinc-400">
                · periode {usage.periodKey} UTC
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isPro && (
            <Link
              href="/pricing"
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:shadow-xl hover:shadow-indigo-500/25 hover:-translate-y-0.5 active:scale-95"
            >
              ✨ Upgrade Pro
            </Link>
          )}
          <Link
            href="/"
            className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 active:scale-95 shadow-md"
          >
            + Proyek baru
          </Link>
        </div>
      </div>

      {/* Usage Stats */}
      {usage && (
        <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap gap-6">
            <ProgressBar value={aiUsed} max={aiCap} label="Analisis AI bulan ini" color="indigo" />
            <ProgressBar value={pdfUsed} max={pdfCap} label="PDF bulan ini" color="emerald" />
          </div>
        </div>
      )}

      {/* Batch Mode Toggle */}
      {projects.length > 0 && !selectionMode && (
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectionMode(true)}
            className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-600 transition-all hover:bg-zinc-50 hover:border-zinc-300 active:scale-[0.98]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
            Pilih gabungan PDF
          </button>
        </div>
      )}

      {/* Selection mode hint */}
      {selectionMode && (
        <div className="animate-fade-in-down mb-5 flex items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3.5">
          <div className="flex items-center gap-2.5 text-sm text-indigo-700">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0 text-indigo-500">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
            <span>Pilih proyek lalu gabungkan menjadi satu PDF.</span>
            {selectedIds.size > 0 && (
              <span className="font-bold text-indigo-800">{selectedIds.size} dipilih</span>
            )}
          </div>
          <button
            type="button"
            onClick={exitSelectionMode}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-100 transition-colors"
          >
            Batal
          </button>
        </div>
      )}

      {/* Project grid */}
      {projects.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-white px-8 py-20 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-zinc-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-zinc-900">Belum ada proyek</h3>
          <p className="mt-2 text-sm text-zinc-500 max-w-md mx-auto">
            Mulai dari beranda untuk membuat portofolio baru. Upload screenshot dan biarkan AI menghasilkan deskripsi profesional.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Proyek baru
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 stagger-children">
          {projects.map((p) => {
            const isSelected = selectedIds.has(p.id);
            return (
              <li key={p.id} className="animate-fade-in-up">
                {selectionMode ? (
                  <button
                    type="button"
                    onClick={() => toggleSelection(p.id)}
                    className={`group flex h-full w-full flex-col rounded-2xl border-2 p-5 text-left transition-all card-hover ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100"
                        : "border-zinc-200 bg-white shadow-sm hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="line-clamp-2 font-semibold text-zinc-900">
                        {p.title || "Tanpa judul"}
                      </h2>
                      <div className="flex items-center gap-2">
                        <span className={`shrink-0 rounded-lg border px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(p.status)}`}>
                          {statusLabel(p.status)}
                        </span>
                        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-500"
                            : "border-zinc-300 bg-white"
                        }`}>
                          {isSelected && (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 text-white">
                              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0020.25 4.5H3.75A2.25 2.25 0 001.5 6.75v12a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                      <span>{p.screenshotCount} screenshot</span>
                      <span className="text-zinc-300">·</span>
                      <span>
                        {new Date(p.updatedAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </button>
                ) : (
                  <Link
                    href={`/app/${p.id}`}
                    className="group flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all card-hover"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="line-clamp-2 font-semibold text-zinc-900 group-hover:text-indigo-600 transition-colors">
                        {p.title || "Tanpa judul"}
                      </h2>
                      <span className={`shrink-0 rounded-lg border px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(p.status)}`}>
                        {statusLabel(p.status)}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0020.25 4.5H3.75A2.25 2.25 0 001.5 6.75v12a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                      <span>{p.screenshotCount} screenshot</span>
                      <span className="text-zinc-300">·</span>
                      <span>
                        {new Date(p.updatedAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="mt-auto pt-4">
                      <span className="text-xs font-medium text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        Buka proyek
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                          <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Sticky action bar */}
      {selectionMode && (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-fade-in-up">
          <div className="border-t border-zinc-200 bg-white/90 px-4 py-4 backdrop-blur-xl shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.1)]">
            <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set(projects.map((p) => p.id)))}
                  className="text-sm text-indigo-600 font-medium hover:underline"
                >
                  Pilih semua
                </button>
                <span className="text-zinc-300">|</span>
                <span className="text-sm font-semibold text-zinc-700">
                  {selectedIds.size === 0
                    ? "Belum ada yang dipilih"
                    : `${selectedIds.size} proyek dipilih`}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={batchTemplate}
                  onChange={(e) => setBatchTemplate(e.target.value as "default" | "compact")}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="default">Default</option>
                  <option value="compact">Compact</option>
                </select>

                <button
                  type="button"
                  disabled={selectedIds.size === 0 || batchMut.isPending}
                  onClick={() => batchMut.mutate()}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:shadow-xl hover:shadow-indigo-500/25 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
                >
                  {batchMut.isPending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Membuat PDF…
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                        <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                      </svg>
                      Unduh PDF Gabungan
                    </>
                  )}
                </button>
              </div>
            </div>

            {batchError && (
              <div className="mx-auto mt-3 max-w-2xl">
                <p className="text-sm text-red-600 font-medium" role="alert">{batchError}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
