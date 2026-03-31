"use client";

import { useEffect, useState } from "react";
import { CreditCardIcon, Loader2Icon, SaveIcon, CheckCircle2Icon } from "lucide-react";

type PlanRow = {
  id: string;
  slug: string;
  name: string;
  stripePriceId: string | null;
  midtransPackageCode: string | null;
  maxProjects: number;
  maxScreenshotsPerProject: number;
  maxAiAnalysesPerPeriod: number;
  maxPdfExportsPerPeriod: number;
  periodDays: number;
  active: boolean;
};

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const res = await fetch("/api/admin/plans", { credentials: "include" });
      if (!res.ok) {
        setErr("Gagal memuat plans.");
        return;
      }
      const j = (await res.json()) as { plans: PlanRow[] };
      setPlans(j.plans);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(plan: PlanRow, patch: Partial<PlanRow>) {
    setSaving(plan.id);
    setErr(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(
          typeof j?.error?.message === "string"
            ? j.error.message
            : "Gagal menyimpan.",
        );
        return;
      }
      setSuccessMsg(`Paket ${plan.name} berhasil diperbarui.`);
      await load();
      
      // Auto hide success message
      setTimeout(() => setSuccessMsg(null), 3000);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Plans & Limit
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Konfigurasi limit per paket dan mapping pembayaran (Midtrans/Stripe).
        </p>
      </div>

      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{err}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {successMsg ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
          <CheckCircle2Icon className="h-5 w-5 text-emerald-600" />
          <p className="text-sm font-medium text-emerald-800">{successMsg}</p>
        </div>
      ) : null}

      {loading ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-zinc-200 bg-white">
          <Loader2Icon className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      ) : (
        <div className="space-y-6">
          {plans.map((p) => (
            <form
              key={p.id}
              className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                void save(p, {
                  name: String(fd.get("name") ?? ""),
                  stripePriceId:
                    String(fd.get("stripePriceId") ?? "").trim() || null,
                  midtransPackageCode:
                    String(fd.get("midtransPackageCode") ?? "").trim() || null,
                  maxProjects: Number(fd.get("maxProjects")),
                  maxScreenshotsPerProject: Number(
                    fd.get("maxScreenshotsPerProject"),
                  ),
                  maxAiAnalysesPerPeriod: Number(fd.get("maxAiAnalysesPerPeriod")),
                  maxPdfExportsPerPeriod: Number(fd.get("maxPdfExportsPerPeriod")),
                  periodDays: Number(fd.get("periodDays")),
                  active: fd.get("active") === "on",
                });
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 bg-zinc-50/50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
                    <CreditCardIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-900">
                      {p.name}
                    </h2>
                    <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-[10px] font-medium text-zinc-600 ring-1 ring-inset ring-zinc-500/10">
                      {p.slug}
                    </span>
                  </div>
                </div>
                <label className="flex cursor-pointer items-center gap-3">
                  <span className="text-sm font-medium text-zinc-700">Aktif</span>
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      name="active" 
                      defaultChecked={p.active} 
                      className="peer sr-only"
                    />
                    <div className="h-6 w-11 rounded-full bg-zinc-200 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 peer-focus:ring-offset-2"></div>
                  </div>
                </label>
              </div>
              
              <div className="p-6 space-y-8">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-900">
                      Nama Paket
                    </label>
                    <input
                      name="name"
                      defaultValue={p.name}
                      className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 shadow-sm transition-colors hover:border-zinc-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-zinc-400"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-900">
                        Stripe Price ID
                      </label>
                      <input
                        name="stripePriceId"
                        defaultValue={p.stripePriceId ?? ""}
                        placeholder="price_..."
                        className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 font-mono text-sm text-zinc-900 shadow-sm transition-colors hover:border-zinc-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-zinc-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-900">
                        Midtrans Pkg Code
                      </label>
                      <input
                        name="midtransPackageCode"
                        defaultValue={p.midtransPackageCode ?? ""}
                        placeholder="PRO-1"
                        className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 font-mono text-sm text-zinc-900 shadow-sm transition-colors hover:border-zinc-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-zinc-400"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="mb-4 text-sm font-semibold text-zinc-900">Konfigurasi Limit</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {(
                      [
                        ["maxProjects", "Max Proyek"],
                        ["maxScreenshotsPerProject", "Screenshot / Proyek"],
                        ["maxAiAnalysesPerPeriod", "AI / Periode"],
                        ["maxPdfExportsPerPeriod", "PDF / Periode"],
                        ["periodDays", "Hari Periode"],
                      ] as const
                    ).map(([name, label]) => (
                      <div key={name} className="space-y-2">
                        <label className="text-xs font-medium text-zinc-600">
                          {label}
                        </label>
                        <input
                          type="number"
                          name={name}
                          min={0}
                          defaultValue={
                            p[name as keyof PlanRow] as number
                          }
                          className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 tabular-nums shadow-sm transition-colors hover:border-zinc-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end border-t border-zinc-100 bg-zinc-50/50 px-6 py-4">
                <button
                  type="submit"
                  disabled={saving === p.id}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 disabled:opacity-50"
                >
                  {saving === p.id ? (
                    <>
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <SaveIcon className="h-4 w-4" />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
