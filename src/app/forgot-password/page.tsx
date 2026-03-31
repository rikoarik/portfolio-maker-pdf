"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Selalu tampilkan sukses agar tidak mengungkap apakah email ada
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        const msg =
          typeof j?.error?.message === "string"
            ? j.error.message
            : "Gagal mengirim email reset.";
        setErr(msg);
        return;
      }
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-sm rounded-3xl border border-white/60 bg-white/70 p-8 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] backdrop-blur-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Reset password
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Masukkan email akunmu. Kami akan kirim link untuk membuat password baru.
        </p>

        {done ? (
          <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
            Jika email terdaftar, link reset sudah dikirim. Cek inbox/spam lalu
            ikuti instruksinya.
            <div className="mt-3">
              <Link href="/login" className="underline">
                Kembali ke login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-zinc-700">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white/50 px-4 py-3 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-4 focus:ring-zinc-900/5"
              />
            </label>
            {err ? (
              <p
                className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
                role="alert"
              >
                {err}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {loading ? "Mengirim…" : "Kirim link reset"}
            </button>
            <p className="text-center text-sm text-zinc-600">
              <Link href="/login" className="font-medium underline">
                Kembali
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

