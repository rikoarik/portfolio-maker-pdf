"use client";

import { useCallback, useEffect, useState } from "react";
import { SearchIcon, Loader2Icon } from "lucide-react";

type PlanOpt = { id: string; slug: string; name: string };

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  tier: string;
  planId: string | null;
  currentPeriodEnd: string | null;
  plan: PlanOpt | null;
};

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [plans, setPlans] = useState<PlanOpt[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPlans = useCallback(async () => {
    const res = await fetch("/api/admin/plans", { credentials: "include" });
    if (!res.ok) return;
    const j = (await res.json()) as {
      plans: { id: string; slug: string; name: string }[];
    };
    setPlans(j.plans.map((p) => ({ id: p.id, slug: p.slug, name: p.name })));
  }, []);

  const search = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/users?q=${encodeURIComponent(q)}`,
        { credentials: "include" },
      );
      if (!res.ok) {
        setErr("Gagal mencari pengguna.");
        return;
      }
      const j = (await res.json()) as { users: UserRow[] };
      setUsers(j.users);
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    void loadPlans();
    void search();
    // Hanya muat awal; pencarian lanjutan lewat tombol "Cari".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadPlans]);

  async function patchUser(
    id: string,
    body: { tier?: string; planId?: string | null },
  ) {
    setBusy(id);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(
          typeof j?.error?.message === "string"
            ? j.error.message
            : "Gagal memperbarui.",
        );
        return;
      }
      await search();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Pengguna
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Cari user dan override plan/tier (tercatat di audit log).
          </p>
        </div>
        <div className="flex w-full max-w-md gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void search()}
              placeholder="Cari email atau nama..."
              className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm text-zinc-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-zinc-400"
            />
          </div>
          <button
            type="button"
            onClick={() => void search()}
            className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
          >
            Cari
          </button>
        </div>
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

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50/80 text-xs font-medium uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-6 py-4">Pengguna</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Tier</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2Icon className="mx-auto h-6 w-6 animate-spin text-zinc-400" />
                    <p className="mt-2 text-sm text-zinc-500">Memuat data pengguna...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-zinc-500"
                  >
                    Tidak ada user ditemukan. Coba kata kunci lain.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-zinc-50/50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-zinc-900">{u.email}</span>
                        <span className="text-xs text-zinc-500">{u.name ?? "Tanpa nama"}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          u.role === "ADMIN"
                            ? "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-700/10"
                            : "bg-zinc-50 text-zinc-600 ring-1 ring-inset ring-zinc-500/10"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <select
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm transition-colors hover:border-zinc-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                        defaultValue={u.tier}
                        disabled={busy === u.id}
                        onChange={(e) => void patchUser(u.id, { tier: e.target.value })}
                      >
                        <option value="FREE">FREE</option>
                        <option value="PRO">PRO</option>
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <select
                        className="min-w-[200px] rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm transition-colors hover:border-zinc-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                        defaultValue={u.planId ?? ""}
                        disabled={busy === u.id}
                        onChange={(e) =>
                          void patchUser(u.id, { planId: e.target.value || null })
                        }
                      >
                        <option value="">(tanpa plan)</option>
                        {plans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.slug})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <span className="text-xs font-medium text-zinc-400">
                        {busy === u.id ? (
                          <span className="inline-flex items-center gap-1.5 text-indigo-600">
                            <Loader2Icon className="h-3 w-3 animate-spin" />
                            Menyimpan
                          </span>
                        ) : (
                          "—"
                        )}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
