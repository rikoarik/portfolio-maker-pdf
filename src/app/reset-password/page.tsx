"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function parseHashParams(hash: string): Record<string, string> {
  const h = hash.startsWith("#") ? hash.slice(1) : hash;
  const sp = new URLSearchParams(h);
  const out: Record<string, string> = {};
  for (const [k, v] of sp.entries()) out[k] = v;
  return out;
}

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createClient(), []);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Recovery link biasanya mengandung access_token + refresh_token di URL hash
    const params = parseHashParams(window.location.hash);
    const access_token = params["access_token"];
    const refresh_token = params["refresh_token"];
    if (!access_token || !refresh_token) {
      setErr(
        "Link reset tidak valid atau sudah kedaluwarsa. Coba kirim ulang dari halaman lupa password.",
      );
      setReady(true);
      return;
    }
    void (async () => {
      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      if (error) {
        setErr(
          "Sesi reset tidak valid. Coba kirim ulang email reset password.",
        );
      }
      setReady(true);
    })();
  }, [supabase]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password.length < 8) {
      setErr("Password minimal 8 karakter.");
      return;
    }
    if (password !== confirm) {
      setErr("Konfirmasi password tidak sama.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setErr(error.message);
        return;
      }
      setDone(true);
      // Optional: clear hash so token not linger
      window.history.replaceState(null, "", "/reset-password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-sm rounded-3xl border border-white/60 bg-white/70 p-8 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] backdrop-blur-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Buat password baru
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Masukkan password baru untuk akunmu.
        </p>

        {!ready ? (
          <p className="mt-6 text-sm text-zinc-500">Memuat…</p>
        ) : done ? (
          <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
            Password berhasil diubah.
            <div className="mt-3">
              <Link href="/login" className="underline">
                Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-zinc-700">
              Password baru
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white/50 px-4 py-3 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-4 focus:ring-zinc-900/5"
              />
            </label>
            <label className="block text-sm font-medium text-zinc-700">
              Konfirmasi password
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Ulangi password"
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
              {loading ? "Menyimpan…" : "Simpan password"}
            </button>
            <p className="text-center text-sm text-zinc-600">
              <Link href="/forgot-password" className="font-medium underline">
                Kirim ulang email reset
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

