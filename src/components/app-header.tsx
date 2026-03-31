"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/lib/api";

export function AppHeader() {
  const router = useRouter();
  const meQ = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    staleTime: 60_000,
  });

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    await meQ.refetch();
    router.refresh();
  }

  return (
    <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-zinc-900"
        >
          Portfolio Maker
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm text-zinc-600">
          <Link href="/" className="hover:text-zinc-900">
            Beranda
          </Link>
          <Link href="/app" className="font-medium text-zinc-900">
            Proyek saya
          </Link>
          {meQ.data?.user?.role === "ADMIN" ? (
            <Link href="/admin" className="text-amber-700 hover:text-amber-900">
              Admin
            </Link>
          ) : null}
          {meQ.data?.user ? (
            <>
              <span className="hidden max-w-[12rem] truncate text-xs text-zinc-500 sm:inline">
                {meQ.data.user.email}
              </span>
              <button
                type="button"
                onClick={() => void onLogout()}
                className="text-zinc-600 hover:text-zinc-900"
              >
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-zinc-900">
                Masuk
              </Link>
              <Link href="/register" className="hover:text-zinc-900">
                Daftar
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
