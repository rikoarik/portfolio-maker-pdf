"use client";

import { useEffect, useState } from "react";
import { WebhookIcon, Loader2Icon } from "lucide-react";

type WhEvent = {
  id: string;
  provider: string;
  eventId: string;
  payload: unknown;
  processedAt: string;
};

export default function AdminWebhooksPage() {
  const [events, setEvents] = useState<WhEvent[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/webhooks?limit=50", {
          credentials: "include",
        });
        if (!res.ok) {
          setErr("Gagal memuat event webhook.");
          return;
        }
        const j = (await res.json()) as { events: WhEvent[] };
        setEvents(j.events);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
          <WebhookIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Webhooks</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Event tersimpan setelah verifikasi signature; duplikat diabaikan oleh
            idempotensi (Stripe/Midtrans).
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

      {loading ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-zinc-200 bg-white">
          <Loader2Icon className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      ) : (
        <ul className="space-y-4">
          {events.map((e) => (
            <li
              key={e.id}
              className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="border-b border-zinc-100 bg-zinc-50/50 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        e.provider === "stripe"
                          ? "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-700/10"
                          : e.provider === "midtrans"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-700/10"
                            : "bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-500/10"
                      }`}
                    >
                      {e.provider}
                    </span>
                    <span className="font-mono text-sm font-medium text-zinc-700">{e.eventId}</span>
                  </div>
                  <span className="text-xs font-medium text-zinc-500">
                    {new Date(e.processedAt).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              </div>
              <div className="bg-zinc-900 p-5">
                <pre className="max-h-64 overflow-y-auto font-mono text-[11px] leading-relaxed text-zinc-300 scrollbar-thin scrollbar-track-zinc-800 scrollbar-thumb-zinc-600">
                  {JSON.stringify(e.payload, null, 2)}
                </pre>
              </div>
            </li>
          ))}
          {events.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-12 text-center">
              <p className="text-sm font-medium text-zinc-900">Belum ada webhook</p>
              <p className="mt-1 text-xs text-zinc-500">
                Event dari payment gateway akan muncul di sini.
              </p>
            </li>
          ) : null}
        </ul>
      )}
    </div>
  );
}
