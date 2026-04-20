"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createBillingPortalSession,
  deleteMyAccount,
  exportMyAccountData,
  getMe,
} from "@/lib/api";

function usagePercent(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min((value / max) * 100, 100);
}

function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SettingsPage() {
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const meQ = useQuery({
    queryKey: ["auth_me"],
    queryFn: getMe,
    retry: false,
  });

  const portalMut = useMutation({
    mutationFn: createBillingPortalSession,
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (e: unknown) => {
      setErr(e instanceof Error ? e.message : "Gagal membuka portal billing.");
    },
  });

  const exportMut = useMutation({
    mutationFn: exportMyAccountData,
    onSuccess: (data) => {
      downloadJson(data, `portfolio-maker-export-${Date.now()}.json`);
      setErr(null);
      setMsg("Data berhasil diekspor.");
    },
    onError: (e: unknown) => {
      setErr(e instanceof Error ? e.message : "Gagal mengekspor data.");
    },
  });

  const deleteMut = useMutation({
    mutationFn: deleteMyAccount,
    onSuccess: (data) => {
      setErr(null);
      setMsg(data.message);
      window.location.href = "/";
    },
    onError: (e: unknown) => {
      setErr(e instanceof Error ? e.message : "Gagal menghapus akun.");
    },
  });

  if (meQ.isPending) {
    return <div className="rounded-xl border border-zinc-200 bg-white p-6">Memuat pengaturan…</div>;
  }
  if (!meQ.data?.user) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
        Anda belum login. <Link href="/login" className="text-indigo-600 hover:underline">Masuk dulu</Link>.
      </div>
    );
  }

  const user = meQ.data.user;
  const plan = user.plan;
  const usage = user.usageThisMonth;
  const aiUsed = usage?.ai_analysis ?? 0;
  const aiCap = plan?.maxAiAnalysesPerPeriod ?? 0;
  const pdfUsed = usage?.pdf_export ?? 0;
  const pdfCap = plan?.maxPdfExportsPerPeriod ?? 0;
  const canOpenPortal = !!user.paymentCustomerId && user.tier === "PRO";

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Pengaturan akun</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Kelola paket, pemakaian kuota, dan data akun Anda.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">Paket aktif</h2>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-lg bg-zinc-100 px-3 py-1 font-medium text-zinc-700">
            {plan?.name ?? user.tier}
          </span>
          <span className="text-zinc-500">
            Periode pemakaian: {usage?.periodLabel ?? usage?.periodKey ?? "-"}
          </span>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-1 flex justify-between text-xs text-zinc-600">
              <span>Analisis AI</span>
              <span>{aiUsed}/{aiCap}</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-100">
              <div
                className="h-2 rounded-full bg-indigo-500"
                style={{ width: `${usagePercent(aiUsed, aiCap)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs text-zinc-600">
              <span>Ekspor PDF</span>
              <span>{pdfUsed}/{pdfCap}</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-100">
              <div
                className="h-2 rounded-full bg-emerald-500"
                style={{ width: `${usagePercent(pdfUsed, pdfCap)}%` }}
              />
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/pricing"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Lihat paket
          </Link>
          <button
            type="button"
            disabled={!canOpenPortal || portalMut.isPending}
            onClick={() => {
              setErr(null);
              setMsg(null);
              portalMut.mutate();
            }}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {portalMut.isPending ? "Membuka portal…" : "Kelola langganan (Stripe)"}
          </button>
        </div>
        {!canOpenPortal ? (
          <p className="mt-3 text-xs text-zinc-500">
            Jika pembayaran Anda lewat Midtrans, pembatalan/perubahan paket dilakukan lewat dukungan.
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">Data akun</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Ekspor salinan data Anda atau hapus data aplikasi Portfolio Maker dari akun ini.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-amber-700">
          Penghapusan ini menghapus data aplikasi dan proyek Anda di Portfolio Maker. Identitas login dari penyedia autentikasi masih bisa tetap ada.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={exportMut.isPending}
            onClick={() => {
              setErr(null);
              setMsg(null);
              exportMut.mutate();
            }}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
          >
            {exportMut.isPending ? "Mengekspor…" : "Ekspor data saya"}
          </button>
          <button
            type="button"
            disabled={deleteMut.isPending}
            onClick={() => {
              const ok = window.confirm(
                "Hapus semua data aplikasi Portfolio Maker dan proyek Anda? Tindakan ini tidak bisa dibatalkan.",
              );
              if (!ok) return;
              setErr(null);
              setMsg(null);
              deleteMut.mutate();
            }}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            {deleteMut.isPending ? "Menghapus…" : "Hapus data aplikasi"}
          </button>
          <Link
            href="/help"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Bantuan
          </Link>
        </div>
        {msg ? <p className="mt-3 text-sm text-emerald-700">{msg}</p> : null}
        {err ? <p className="mt-3 text-sm text-red-600">{err}</p> : null}
      </section>
    </div>
  );
}
