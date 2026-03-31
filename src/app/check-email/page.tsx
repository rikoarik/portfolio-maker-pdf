"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CheckEmailInner() {
  const sp = useSearchParams();
  const email = sp.get("email") ?? "";

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-sm rounded-3xl border border-white/60 bg-white/70 p-8 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] backdrop-blur-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Cek email kamu
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Kami sudah kirim link konfirmasi ke email kamu.
        </p>

        {email ? (
          <p className="mt-4 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800">
            <span className="text-zinc-500">Email:</span>{" "}
            <span className="font-medium">{email}</span>
          </p>
        ) : null}

        <div className="mt-6 space-y-3 text-sm text-zinc-600">
          <p>
            Buka inbox/spam, klik link konfirmasi, lalu kembali ke aplikasi untuk
            login.
          </p>
          <p>
            Kalau email belum masuk, tunggu 1–2 menit dan cek folder spam.
          </p>
        </div>

        <div className="mt-7 flex flex-col gap-3">
          <Link
            href="/login"
            className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-center text-sm font-medium text-white hover:bg-zinc-800"
          >
            Saya sudah konfirmasi, lanjut login
          </Link>
          <Link
            href="/forgot-password"
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-center text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Tidak bisa masuk? Reset password
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-zinc-500">Memuat…</div>}>
      <CheckEmailInner />
    </Suspense>
  );
}

