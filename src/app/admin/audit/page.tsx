"use client";

import { useEffect, useState } from "react";
import { ActivityIcon, Loader2Icon } from "lucide-react";

type Entry = {
  id: string;
  action: string;
  actorUserId: string | null;
  actorEmail: string | null;
  targetUserId: string | null;
  metadata: unknown;
  createdAt: string;
};

export default function AdminAuditPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/audit?limit=80", {
          credentials: "include",
        });
        if (!res.ok) {
          setErr("Gagal memuat audit log.");
          return;
        }
        const j = (await res.json()) as { entries: Entry[] };
        setEntries(j.entries);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
          <ActivityIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Audit Log</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Jejak perubahan plan/tier dan aksi admin.
          </p>
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
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Aksi</th>
                <th className="px-6 py-4">Aktor</th>
                <th className="px-6 py-4">Target user</th>
                <th className="px-6 py-4">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2Icon className="mx-auto h-6 w-6 animate-spin text-zinc-400" />
                    <p className="mt-2 text-sm text-zinc-500">Memuat audit log...</p>
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-zinc-500"
                  >
                    Belum ada audit log.
                  </td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr key={e.id} className="transition-colors hover:bg-zinc-50/50">
                    <td className="whitespace-nowrap px-6 py-4 text-zinc-500">
                      {new Date(e.createdAt).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-1 font-mono text-[10px] font-medium text-zinc-700 ring-1 ring-inset ring-zinc-500/10">
                        {e.action}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-zinc-700">
                      {e.actorEmail ?? e.actorUserId ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-zinc-500">
                      {e.targetUserId ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-md overflow-hidden rounded bg-zinc-50 px-2 py-1 font-mono text-[10px] text-zinc-600">
                        <div className="truncate">{JSON.stringify(e.metadata)}</div>
                      </div>
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
