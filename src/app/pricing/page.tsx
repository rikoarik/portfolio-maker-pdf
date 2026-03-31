"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createCheckoutSession, getMe } from "@/lib/api";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [checkoutErr, setCheckoutErr] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const { data, isPending } = useQuery({
    queryKey: ["auth_me"],
    queryFn: getMe,
    retry: false
  });

  const isAuthenticated = !!data?.user;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-zinc-50 selection:bg-zinc-200">
      {/* Background Orbs */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-0">
        <div className="absolute top-[-10%] sm:top-[-20%] left-[-10%] w-[60%] sm:w-[50%] aspect-square rounded-full bg-gradient-to-br from-indigo-200/40 to-purple-200/40 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] sm:bottom-[-20%] right-[-10%] w-[60%] sm:w-[50%] aspect-square rounded-full bg-gradient-to-tl from-emerald-100/40 to-teal-200/40 blur-[100px]"></div>
      </div>
      
      {/* Header (Simplified) */}
      <header className="relative z-50 flex h-20 items-center justify-between px-6 lg:px-12 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-3 font-semibold tracking-tight text-zinc-900">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-xl shadow-zinc-900/20 transition-transform group-hover:scale-105">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M19.5 22.5a3 3 0 003-3v-8.174l-6.879 4.022 3.485 1.876a.75.75 0 01-.712 1.321l-5.683-3.06a1.5 1.5 0 00-1.422 0l-5.683 3.06a.75.75 0 01-.712-1.32l3.485-1.877L1.5 11.326V19.5a3 3 0 003 3h15z" />
                <path d="M1.5 9.589v-.745a3 3 0 011.578-2.641l7.5-4.039a3 3 0 012.844 0l7.5 4.039A3 3 0 0122.5 8.844v.745l-8.426 4.926-.652-.35a3 3 0 00-2.844 0l-.652.35L1.5 9.59z" />
              </svg>
            </div>
            <span className="text-xl">Portfolio Maker</span>
          </Link>
        </div>
        <nav className="flex items-center gap-4 text-sm font-medium">
          {isPending ? null : isAuthenticated ? (
            <Link href="/app" className="rounded-full bg-zinc-900 px-5 py-2.5 text-white shadow-lg transition-all hover:bg-zinc-800 active:scale-95">Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="text-zinc-600 hover:text-zinc-900 transition-colors hidden sm:block">Masuk</Link>
              <Link href="/register" className="rounded-full bg-zinc-900 px-5 py-2.5 text-white shadow-lg transition-all hover:bg-zinc-800 active:scale-95">Daftar Gratis</Link>
            </>
          )}
        </nav>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-6 py-20 text-center">
        
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tighter text-zinc-900 text-balance leading-[1.1] max-w-3xl py-2">
          Pilih Paket yang Sesuai dengan Kebutuhanmu
        </h1>
        
        <p className="mt-4 text-lg text-zinc-600 max-w-2xl text-balance">
          Mulai gratis, lalu upgrade ke Pro saat kamu butuh analisis tanpa batas dan fitur export tingkat lanjut.
        </p>

        {/* Billing Toggle */}
        <div className="mt-10 flex items-center rounded-full border border-zinc-200 bg-white/50 p-1 shadow-sm backdrop-blur-md">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`rounded-full px-6 py-2.5 text-sm font-medium transition-all ${
              billingCycle === "monthly" 
                ? "bg-zinc-900 text-white shadow-md shadow-zinc-900/10" 
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Bulanan
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`rounded-full px-6 py-2.5 text-sm font-medium transition-all ${
              billingCycle === "yearly" 
                ? "bg-zinc-900 text-white shadow-md shadow-zinc-900/10" 
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Tahunan <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">-20%</span>
          </button>
        </div>

        {/* Pricing Cards */}
        <div className="mt-14 grid w-full max-w-4xl grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
          
          {/* Free Tier */}
          <div className="flex flex-col rounded-3xl border border-white/60 bg-white/70 p-8 text-left shadow-[0_8px_40px_-12px_rgba(0,0,0,0.05)] backdrop-blur-xl">
            <h3 className="text-xl font-bold tracking-tight text-zinc-900">Hobi (Gratis)</h3>
            <p className="mt-2 min-h-[48px] text-sm text-zinc-500">Mulai merangkum aplikasi favoritmu dan buat portofolio dasar.</p>
            
            <div className="my-8">
              <span className="text-4xl font-bold text-zinc-900">Rp0</span>
              <span className="text-sm font-medium text-zinc-500"> / selamanya</span>
            </div>

            <ul className="mb-8 space-y-4 flex-1">
              {[
                "Maks 5 Proyek Portofolio per Bulan",
                "Maks 10 gambar screenshot tiap proyek",
                "Ditenagai AI Gemini Flash (Cepat)",
                "5x Percobaan Generate (Daily)",
                "Export PDF Dasar (dengan watermark)"
              ].map((feature, i) => (
                <li key={i} className="flex flex-col sm:flex-row items-baseline gap-3">
                  <svg className="h-5 w-5 shrink-0 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-zinc-700">{feature}</span>
                </li>
              ))}
            </ul>

            <Link href={isAuthenticated ? "/app" : "/register"} className="flex w-full items-center justify-center rounded-xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200">
              {isAuthenticated ? "Mulai Gratis" : "Daftar Gratis"}
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="relative flex flex-col rounded-3xl border-2 border-indigo-500/50 bg-white/80 p-8 text-left shadow-[0_20px_60px_-15px_rgba(79,70,229,0.2)] backdrop-blur-2xl">
            <div className="absolute -top-4 right-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
              Paling Populer
            </div>
            
            <h3 className="text-xl font-bold tracking-tight text-indigo-900">Profesional</h3>
            <p className="mt-2 min-h-[48px] text-sm text-zinc-600">Didesain untuk pekerja kreatif yang ingin pamer karya terbaiknya dengan tanpa batas.</p>
            
            <div className="my-8">
              <span className="text-4xl font-bold text-zinc-900">
                {billingCycle === "monthly" ? "Rp49.000" : "Rp39.000"}
              </span>
              <span className="text-sm font-medium text-zinc-500"> / bulan</span>
              {billingCycle === "yearly" && (
                <p className="mt-1 text-xs text-emerald-600 font-medium">Ditagih Rp468.000 per tahun</p>
              )}
            </div>

            <ul className="mb-8 space-y-4 flex-1">
              {[
                "Proyek Portofolio Tanpa Batas (Unlimited)",
                "Maks 50 gambar screenshot per proyek",
                "Ditenagai AI Gemini Pro 1.5 (Akurat)",
                "Regenerate Teks Sesuka Hati",
                "Gabungkan Ratusan Proyek (Batch PDF)",
                "Ekspor PDF Kualitas Tinggi",
                "Bebas Watermark Premium"
              ].map((feature, i) => (
                <li key={i} className="flex flex-col sm:flex-row items-baseline gap-3">
                  <svg className="h-5 w-5 shrink-0 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-zinc-800">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              disabled={checkoutLoading || !isAuthenticated}
              onClick={async () => {
                if (!isAuthenticated) return;
                setCheckoutErr(null);
                setCheckoutLoading(true);
                try {
                  const { url } = await createCheckoutSession({
                    successPath: "/app",
                  });
                  window.location.href = url;
                } catch (e) {
                  setCheckoutErr(
                    e instanceof Error ? e.message : "Checkout gagal.",
                  );
                } finally {
                  setCheckoutLoading(false);
                }
              }}
              className="group relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg hover:shadow-indigo-600/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checkoutLoading ? "Mengalihkan ke Stripe…" : "Berlangganan Sekarang"}
              <svg className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </button>
            {!isAuthenticated ? (
              <p className="mt-3 text-center text-xs text-zinc-500">
                <Link href="/login?next=/pricing" className="font-medium underline">
                  Masuk
                </Link>{" "}
                untuk checkout Stripe.
              </p>
            ) : null}
            {checkoutErr ? (
              <p className="mt-3 text-center text-xs text-red-600" role="alert">
                {checkoutErr}
              </p>
            ) : null}
          </div>

        </div>
      </main>
      
      <footer className="relative z-10 w-full py-8 text-center text-sm font-medium text-zinc-500 backdrop-blur-md">
        <p>
          &copy; {new Date().getFullYear()} Portfolio Maker. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
