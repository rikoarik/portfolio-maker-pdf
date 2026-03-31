"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { ApiError, downloadBatchPdf, listMyProjects, getMe } from "@/lib/api";

function statusBadgeClass(status: string): string {
  if (status === "draft") return "bg-zinc-100 text-zinc-700";
  return "bg-emerald-50 text-emerald-800";
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
      <div className="py-12 text-center text-zinc-500">Memuat proyek…</div>
    );
  }

  if (q.isError) {
    const err = q.error;
    const dbDown =
      err instanceof ApiError && err.code === "database_unreachable";

    return (
      <div className="rounded-2xl border border-red-100 bg-red-50/50 px-6 py-10">
        <p className="text-red-700">
          {err instanceof Error ? err.message : "Gagal memuat proyek"}
        </p>
        {dbDown ? (
          <p className="mt-4 text-sm text-zinc-600">
            Ini masalah koneksi database di server (bukan akun Anda). Periksa{" "}
            <code className="rounded bg-zinc-100 px-1 text-xs">DATABASE_URL</code>{" "}
            di <code className="rounded bg-zinc-100 px-1 text-xs">.env</code>, jalankan{" "}
            <code className="rounded bg-zinc-100 px-1 text-xs">npm run db:test</code>
            , lalu restart <code className="rounded bg-zinc-100 px-1 text-xs">npm run dev</code>
            .
          </p>
        ) : (
          <p className="mt-4 text-sm text-zinc-600">
            <Link href="/login" className="underline">
              Masuk
            </Link>{" "}
            untuk melihat proyek Anda, atau{" "}
            <Link href="/" className="underline">
              buat proyek baru
            </Link>
            .
          </p>
        )}
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
    <div className="pb-32">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 flex items-center gap-3">
            Proyek saya
            {isPro ? (
              <span className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-2.5 py-0.5 text-xs font-bold text-white uppercase tracking-wide">
                PRO Member
              </span>
            ) : (
              <span className="rounded-full bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                Free Plan
              </span>
            )}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500">
            <span>{projects.length} proyek tersimpan.</span>
            {usage ? (
              <span className="flex flex-wrap items-center gap-x-3 border-l border-zinc-300 pl-3">
                <span>
                  Analisis AI bulan ini:{" "}
                  <strong className="text-zinc-700">
                    {aiUsed}/{aiCap}
                  </strong>
                </span>
                <span>
                  PDF bulan ini:{" "}
                  <strong className="text-zinc-700">
                    {pdfUsed}/{pdfCap}
                  </strong>
                </span>
                <span className="text-xs text-zinc-400">
                  periode {usage.periodKey} UTC
                </span>
              </span>
            ) : null}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isPro && (
            <Link
              href="/pricing"
              className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100"
            >
              Upgrade Pro
            </Link>
          )}

          {/* Toggle selection mode */}
          {projects.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (selectionMode) {
                  exitSelectionMode();
                } else {
                  setSelectionMode(true);
                }
              }}
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                selectionMode
                  ? "border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {selectionMode ? "Batal pilih" : "Pilih gabungan PDF"}
            </button>
          )}

          <Link
            href="/"
            className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            + Proyek baru
          </Link>
        </div>
      </div>

      {/* Selection mode hint */}
      {selectionMode && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0 text-indigo-500">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
          </svg>
          Pilih beberapa proyek lalu gabungkan menjadi satu PDF portofolio.
          {selectedIds.size > 0 && (
            <span className="ml-auto font-semibold">{selectedIds.size} dipilih</span>
          )}
        </div>
      )}

      {/* Project grid */}
      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 px-8 py-16 text-center">
          <p className="text-zinc-600">
            Belum ada proyek tersimpan. Mulai dari beranda untuk membuat
            portofolio baru.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Proyek baru
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => {
            const isSelected = selectedIds.has(p.id);
            return (
              <li key={p.id}>
                {selectionMode ? (
                  /* Selectable card */
                  <button
                    type="button"
                    onClick={() => toggleSelection(p.id)}
                    className={`group flex h-full w-full flex-col rounded-2xl border p-5 text-left transition ${
                      isSelected
                        ? "border-indigo-400 bg-indigo-50 shadow-md shadow-indigo-100 ring-2 ring-indigo-400"
                        : "border-zinc-200 bg-white shadow-sm hover:border-zinc-300 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="line-clamp-2 font-semibold text-zinc-900">
                        {p.title || "Tanpa judul"}
                      </h2>
                      <div className="flex items-center gap-2">
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(p.status)}`}>
                          {statusLabel(p.status)}
                        </span>
                        {/* Checkbox visual */}
                        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
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
                    <p className="mt-3 text-sm text-zinc-500">
                      {p.screenshotCount} screenshot
                      <span className="text-zinc-300"> · </span>
                      diubah{" "}
                      {new Date(p.updatedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </button>
                ) : (
                  /* Regular link card */
                  <Link
                    href={`/app/${p.id}`}
                    className="group flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="line-clamp-2 font-semibold text-zinc-900 group-hover:text-zinc-700">
                        {p.title || "Tanpa judul"}
                      </h2>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(p.status)}`}>
                        {statusLabel(p.status)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-zinc-500">
                      {p.screenshotCount} screenshot
                      <span className="text-zinc-300"> · </span>
                      diubah{" "}
                      {new Date(p.updatedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Sticky action bar — only visible in selection mode with ≥1 selected */}
      {selectionMode && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/80 px-4 py-4 backdrop-blur-xl">
          <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedIds(new Set(projects.map((p) => p.id)))}
                className="text-sm text-zinc-500 underline hover:text-zinc-700"
              >
                Pilih semua
              </button>
              <span className="text-zinc-300">|</span>
              <span className="text-sm font-medium text-zinc-700">
                {selectedIds.size === 0
                  ? "Belum ada yang dipilih"
                  : `${selectedIds.size} proyek dipilih`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Template selector */}
              <select
                value={batchTemplate}
                onChange={(e) => setBatchTemplate(e.target.value as "default" | "compact")}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              >
                <option value="default">Default</option>
                <option value="compact">Compact</option>
              </select>

              <button
                type="button"
                disabled={selectedIds.size === 0 || batchMut.isPending}
                onClick={() => batchMut.mutate()}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:pointer-events-none disabled:opacity-60"
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
              <p className="text-sm text-red-600" role="alert">{batchError}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

