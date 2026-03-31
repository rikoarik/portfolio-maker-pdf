import { prisma } from "@/lib/db";
import {
  UsersIcon,
  FolderKanbanIcon,
  CreditCardIcon,
} from "lucide-react";
import { AdminAreaTrendChart } from "./dashboard-chart";

export default async function AdminHomePage() {
  const [userCount, projectCount, plans, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.portfolioProject.count(),
    prisma.plan.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.user.findMany({
      where: {
        createdAt: { gte: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 14) },
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const days = 14;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const counts = new Map<string, number>();
  for (const u of recentUsers) {
    const d = new Date(u.createdAt);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const trend = Array.from({ length: days }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const dateLabel = d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    });
    return { dateLabel, value: counts.get(key) ?? 0 };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Ringkasan Dashboard
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Monitoring aktivitas pengguna, jumlah proyek, dan konfigurasi paket aplikasi Anda.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Users Stat */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <UsersIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Total Pengguna</p>
              <p className="text-3xl font-bold tracking-tight text-zinc-900">
                {userCount}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-zinc-500">
            <span>Akun terdaftar di database</span>
          </div>
        </div>

        {/* Projects Stat */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <FolderKanbanIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Proyek Portofolio</p>
              <p className="text-3xl font-bold tracking-tight text-zinc-900">
                {projectCount}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-zinc-500">
            <span>Dibuat oleh semua pengguna</span>
          </div>
        </div>

        {/* Plans Stat */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <CreditCardIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Paket Aktif</p>
              <p className="text-3xl font-bold tracking-tight text-zinc-900">
                {plans.length}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-zinc-500">
            <span>Tingkatan paket berlangganan</span>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-semibold text-zinc-900">
              Tren pendaftaran pengguna (14 hari)
            </h2>
            <p className="text-xs text-zinc-500">User baru per hari</p>
          </div>
        </div>
        <div className="px-4 py-4 sm:px-6">
          <AdminAreaTrendChart data={trend} ariaLabel="Grafik tren user baru" />
        </div>
      </div>

      {/* Plans Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-5">
          <h2 className="text-base font-semibold text-zinc-900">Daftar Paket</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Atur limit & mapping pembayaran di menu Plans
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50/80 text-xs font-medium uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Proyek</th>
                <th className="px-6 py-4">Screenshot</th>
                <th className="px-6 py-4">AI / periode</th>
                <th className="px-6 py-4">PDF / periode</th>
                <th className="px-6 py-4">Midtrans</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {plans.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-zinc-50/50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-900">{p.name}</span>
                      <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-1 font-mono text-[10px] font-medium text-zinc-600 ring-1 ring-inset ring-zinc-500/10">
                        {p.slug}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 tabular-nums text-zinc-700">
                    {p.maxProjects}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 tabular-nums text-zinc-700">
                    {p.maxScreenshotsPerProject}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 tabular-nums text-zinc-700">
                    {p.maxAiAnalysesPerPeriod}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 tabular-nums text-zinc-700">
                    {p.maxPdfExportsPerPeriod}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-zinc-500">
                    {p.midtransPackageCode ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
