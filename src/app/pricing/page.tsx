"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createCheckoutSession, getMe } from "@/lib/api";

const FREE_FEATURES = [
  { text: "Maks 5 Proyek Portofolio per Bulan", included: true },
  { text: "Maks 10 gambar screenshot tiap proyek", included: true },
  { text: "Ditenagai AI Gemini Flash (Cepat)", included: true },
  { text: "5x Percobaan Generate (Daily)", included: true },
  { text: "Export PDF Dasar (dengan watermark)", included: true },
];

const PRO_FEATURES = [
  { text: "Proyek Portofolio Tanpa Batas (Unlimited)", included: true },
  { text: "Maks 50 gambar screenshot per proyek", included: true },
  { text: "Ditenagai AI Gemini Pro 1.5 (Akurat)", included: true },
  { text: "Regenerate Teks Sesuka Hati", included: true },
  { text: "Gabungkan Ratusan Proyek (Batch PDF)", included: true },
  { text: "Ekspor PDF Kualitas Tinggi", included: true },
  { text: "Bebas Watermark Premium", included: true },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [checkoutErr, setCheckoutErr] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const { data, isPending } = useQuery({
    queryKey: ["auth_me"],
    queryFn: getMe,
    retry: false,
  });

  const isAuthenticated = !!data?.user;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#09090b] text-white selection:bg-indigo-500/30">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[10%] left-[20%] w-[40%] aspect-square rounded-full bg-indigo-600/15 blur-[120px] animate-float" />
        <div className="absolute bottom-[10%] right-[20%] w-[35%] aspect-square rounded-full bg-purple-600/10 blur-[120px] animate-float" style={{ animationDelay: "3s" }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Header */}
      <header className="relative z-50 flex h-20 items-center justify-between px-6 lg:px-12 w-full max-w-7xl mx-auto animate-fade-in-down">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M19.5 22.5a3 3 0 003-3v-8.174l-6.879 4.022 3.485 1.876a.75.75 0 01-.712 1.321l-5.683-3.06a1.5 1.5 0 00-1.422 0l-5.683 3.06a.75.75 0 01-.712-1.32l3.485-1.877L1.5 11.326V19.5a3 3 0 003 3h15z" />
              <path d="M1.5 9.589v-.745a3 3 0 011.578-2.641l7.5-4.039a3 3 0 012.844 0l7.5 4.039A3 3 0 0122.5 8.844v.745l-8.426 4.926-.652-.35a3 3 0 00-2.844 0l-.652.35L1.5 9.59z" />
            </svg>
          </div>
          <span className="text-lg font-bold">Portfolio Maker</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          {isPending ? null : isAuthenticated ? (
            <Link href="/app" className="rounded-xl bg-white px-5 py-2.5 font-semibold text-zinc-900 shadow-lg transition-all hover:bg-zinc-100 active:scale-95">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 text-zinc-400 hover:text-white transition-colors hidden sm:block">Masuk</Link>
              <Link href="/register" className="rounded-xl bg-white px-5 py-2.5 font-semibold text-zinc-900 shadow-lg transition-all hover:bg-zinc-100 active:scale-95">Daftar Gratis</Link>
            </>
          )}
        </nav>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-6 py-16 sm:py-20">
        {/* Heading */}
        <div className="animate-fade-in-up text-center max-w-3xl">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tighter leading-[1.1]">
            Pilih paket yang{" "}
            <span className="gradient-text">sesuai kebutuhanmu</span>
          </h1>
          <p className="mt-5 text-lg text-zinc-400 max-w-2xl mx-auto text-balance">
            Mulai gratis, lalu upgrade ke Pro saat kamu butuh analisis tanpa batas dan fitur export tingkat lanjut.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="animate-fade-in-up mt-10 flex items-center rounded-2xl border border-white/10 bg-white/[0.03] p-1 backdrop-blur-md" style={{ animationDelay: "80ms" }}>
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`rounded-xl px-6 py-2.5 text-sm font-semibold transition-all ${
              billingCycle === "monthly"
                ? "bg-white text-zinc-900 shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Bulanan
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`rounded-xl px-6 py-2.5 text-sm font-semibold transition-all flex items-center gap-2 ${
              billingCycle === "yearly"
                ? "bg-white text-zinc-900 shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Tahunan
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              -20%
            </span>
          </button>
        </div>

        {/* Pricing Cards */}
        <div className="mt-14 grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
          {/* Free Tier */}
          <div className="animate-fade-in-up flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 text-left backdrop-blur-sm" style={{ animationDelay: "120ms" }}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 text-zinc-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">Hobi (Gratis)</h3>
            </div>
            <p className="mt-3 min-h-[44px] text-sm text-zinc-400 leading-relaxed">
              Mulai merangkum aplikasi favoritmu dan buat portofolio dasar.
            </p>

            <div className="my-8">
              <span className="text-5xl font-extrabold text-white">Rp0</span>
              <span className="ml-2 text-sm font-medium text-zinc-500">/ selamanya</span>
            </div>

            <ul className="mb-8 space-y-3.5 flex-1">
              {FREE_FEATURES.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <svg className="h-5 w-5 shrink-0 text-zinc-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-zinc-300">{feature.text}</span>
                </li>
              ))}
            </ul>

            <Link
              href={isAuthenticated ? "/app" : "/register"}
              className="flex w-full items-center justify-center rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-white/15 active:scale-[0.98]"
            >
              {isAuthenticated ? "Mulai Gratis" : "Daftar Gratis"}
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="animate-fade-in-up relative flex flex-col rounded-2xl border-2 border-indigo-500/40 bg-gradient-to-b from-indigo-500/[0.08] to-transparent p-8 text-left backdrop-blur-sm overflow-hidden" style={{ animationDelay: "200ms" }}>
            {/* Glow */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-3/4 h-48 bg-indigo-500/20 blur-[80px] rounded-full" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Profesional</h3>
                </div>
                <span className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-indigo-500/20">
                  Populer
                </span>
              </div>
              <p className="mt-3 min-h-[44px] text-sm text-zinc-400 leading-relaxed">
                Didesain untuk pekerja kreatif yang ingin pamer karya terbaiknya tanpa batas.
              </p>

              <div className="my-8">
                <span className="text-5xl font-extrabold text-white">
                  {billingCycle === "monthly" ? "Rp49.000" : "Rp39.000"}
                </span>
                <span className="ml-2 text-sm font-medium text-zinc-500">/ bulan</span>
                {billingCycle === "yearly" && (
                  <p className="mt-1.5 text-xs text-emerald-400 font-medium">
                    Ditagih Rp468.000 per tahun · Hemat Rp120.000
                  </p>
                )}
              </div>

              <ul className="mb-8 space-y-3.5 flex-1">
                {PRO_FEATURES.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <svg className="h-5 w-5 shrink-0 text-indigo-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-white">{feature.text}</span>
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
                      e instanceof Error ? e.message : "Checkout gagal."
                    );
                  } finally {
                    setCheckoutLoading(false);
                  }
                }}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-500/20 transition-all hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:transform-none disabled:hover:shadow-xl"
              >
                {checkoutLoading ? "Mengalihkan ke Stripe…" : "Berlangganan Sekarang"}
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                </svg>
              </button>
              {!isAuthenticated ? (
                <p className="mt-3 text-center text-xs text-zinc-500">
                  <Link href="/login?next=/pricing" className="font-medium text-indigo-400 underline hover:text-indigo-300">
                    Masuk
                  </Link>{" "}
                  untuk checkout Stripe.
                </p>
              ) : null}
              {checkoutErr ? (
                <p className="mt-3 text-center text-xs text-red-400" role="alert">
                  {checkoutErr}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* FAQ */}
        <section className="animate-fade-in-up mt-20 w-full max-w-3xl" style={{ animationDelay: "300ms" }}>
          <h2 className="text-2xl font-bold text-center text-white mb-8">Pertanyaan Umum</h2>
          <div className="space-y-4">
            {[
              {
                q: "Apakah saya bisa upgrade dari Gratis ke Pro kapan saja?",
                a: "Ya, Anda bisa upgrade kapan saja. Langganan akan langsung aktif setelah pembayaran berhasil.",
              },
              {
                q: "Apakah data saya aman?",
                a: "Absolut. Screenshot diproses oleh AI hanya untuk menghasilkan deskripsi dan tidak disimpan oleh pihak ketiga. Lihat halaman Privasi untuk detail lengkap.",
              },
              {
                q: "Bisa batalkan langganan?",
                a: "Tentu. Anda bisa membatalkan langganan kapan saja melalui dashboard Stripe. Akses Pro tetap aktif hingga akhir periode billing.",
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="group rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm"
              >
                <summary className="flex cursor-pointer items-center justify-between p-5 text-sm font-semibold text-white">
                  {faq.q}
                  <svg
                    className="h-5 w-5 shrink-0 text-zinc-500 transition-transform group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </summary>
                <p className="px-5 pb-5 text-sm text-zinc-400 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-8 text-center">
        <p className="text-sm text-zinc-600">
          &copy; {new Date().getFullYear()} Portfolio Maker. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
