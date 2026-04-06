"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/lib/api";

export function LandingNav() {
  const { data, isPending } = useQuery({
    queryKey: ["auth_me"],
    queryFn: getMe,
    retry: false,
    staleTime: 60_000,
  });

  const isLoggedIn = !!data?.user;

  return (
    <nav className="flex items-center gap-2 text-sm">
      <Link
        href="/pricing"
        className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white transition-colors hidden sm:block"
      >
        Harga
      </Link>
      {isPending ? (
        <div className="w-24 h-10" />
      ) : isLoggedIn ? (
        <Link
          href="/app"
          className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 shadow-lg transition-all hover:bg-zinc-100 hover:shadow-white/20 active:scale-95"
        >
          Dashboard →
        </Link>
      ) : (
        <>
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white transition-colors hidden sm:block"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 shadow-lg transition-all hover:bg-zinc-100 hover:shadow-white/20 active:scale-95"
          >
            Daftar Gratis
          </Link>
        </>
      )}
    </nav>
  );
}
