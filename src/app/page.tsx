import type { Metadata } from "next";
import Link from "next/link";
import { LandingActions } from "@/components/landing-actions";
import { LandingNav } from "@/components/landing-nav";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#09090b] text-white selection:bg-indigo-500/30">
      {/* Animated Background — Linear-style radial spotlight */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* Primary spotlight */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-[radial-gradient(ellipse,rgba(99,102,241,0.15)_0%,transparent_70%)]" />
        {/* Secondary glow */}
        <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[400px] rounded-full bg-[radial-gradient(ellipse,rgba(168,85,247,0.08)_0%,transparent_70%)]" />
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:72px_72px]" />
        {/* Top edge glow line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-[60%] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
      </div>

      {/* Header */}
      <header className="relative z-50 flex h-20 items-center justify-between px-6 lg:px-12 w-full max-w-7xl mx-auto animate-fade-in-down">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-105">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5">
              <path d="M19.5 22.5a3 3 0 003-3v-8.174l-6.879 4.022 3.485 1.876a.75.75 0 01-.712 1.321l-5.683-3.06a1.5 1.5 0 00-1.422 0l-5.683 3.06a.75.75 0 01-.712-1.32l3.485-1.877L1.5 11.326V19.5a3 3 0 003 3h15z" />
              <path d="M1.5 9.589v-.745a3 3 0 011.578-2.641l7.5-4.039a3 3 0 012.844 0l7.5 4.039A3 3 0 0122.5 8.844v.745l-8.426 4.926-.652-.35a3 3 0 00-2.844 0l-.652.35L1.5 9.59z" />
            </svg>
          </div>
          <span className="text-base font-bold tracking-tight">Portfolio Maker</span>
        </Link>
        <LandingNav />
      </header>

      {/* Hero Section */}
      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 pt-12 pb-20 sm:pt-20 sm:pb-28 text-center">
        {/* Badge */}
        <div className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-[13px] backdrop-blur-sm">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
          <span className="text-zinc-400">Powered by AI Gemini</span>
        </div>

        {/* Headline */}
        <h1 className="animate-fade-in-up text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold tracking-[-0.035em] leading-[1.08] max-w-3xl" style={{ animationDelay: "60ms" }}>
          Buat portofolio{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">profesional</span>
          {" "}dari screenshot
        </h1>

        <p className="animate-fade-in-up mt-5 text-base sm:text-lg leading-relaxed text-zinc-400 max-w-xl text-balance" style={{ animationDelay: "120ms" }}>
          Unggah tangkapan layar aplikasimu, biarkan AI merangkum fitur, lalu unduh PDF portofolio siap lamar dalam hitungan menit.
        </p>

        {/* CTA */}
        <div className="animate-fade-in-up mt-8 w-full max-w-sm" style={{ animationDelay: "180ms" }}>
          <LandingActions />
        </div>
        <div className="animate-fade-in-up mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[13px] text-zinc-500" style={{ animationDelay: "240ms" }}>
          {["Tanpa kartu kredit", "Ada paket gratis", "Kuota jelas per periode"].map((t, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-zinc-600" />
              {t}
            </span>
          ))}
        </div>

        {/* Mockup */}
        <div className="animate-fade-in-up mt-16 sm:mt-20 w-full max-w-3xl" style={{ animationDelay: "320ms" }}>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1 shadow-2xl shadow-black/40 ring-1 ring-inset ring-white/[0.04]">
            <div className="aspect-[16/9.5] w-full rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-950 overflow-hidden relative">
              {/* Window Chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.04]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                </div>
                <div className="ml-4 flex-1 h-5 rounded-md bg-white/[0.04] max-w-[200px]" />
              </div>
              {/* Mock workspace content */}
              <div className="p-5 flex gap-5">
                {/* Sidebar */}
                <div className="w-1/4 flex flex-col gap-3">
                  <div className="h-3 bg-white/[0.06] rounded w-2/3" />
                  <div className="space-y-2 mt-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${i === 1 ? "bg-indigo-500" : "bg-zinc-700"}`} />
                        <div className={`h-2 rounded flex-1 ${i === 1 ? "bg-white/[0.12]" : "bg-white/[0.04]"}`} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto flex flex-col gap-2">
                    <div className="h-20 bg-white/[0.03] rounded-lg border border-white/[0.04]" />
                    <div className="h-20 bg-white/[0.03] rounded-lg border border-white/[0.04]" />
                  </div>
                </div>
                {/* Main content */}
                <div className="flex-1 flex flex-col gap-3">
                  <div className="h-3.5 bg-white/[0.08] rounded w-1/3" />
                  <div className="flex-1 bg-white/[0.02] rounded-lg border border-white/[0.04] p-4 flex flex-col gap-2.5">
                    <div className="h-2.5 bg-white/[0.06] rounded w-full" />
                    <div className="h-2.5 bg-white/[0.06] rounded w-[90%]" />
                    <div className="h-2.5 bg-white/[0.04] rounded w-3/4" />
                    <div className="mt-3 flex gap-1.5">
                      {["bg-indigo-500/20", "bg-purple-500/20", "bg-emerald-500/20"].map((c, i) => (
                        <div key={i} className={`h-5 ${c} rounded-md px-3 border border-white/[0.06]`} />
                      ))}
                    </div>
                    <div className="mt-auto flex gap-2">
                      <div className="h-8 bg-indigo-600/30 rounded-lg flex-1 border border-indigo-500/20" />
                      <div className="h-8 bg-white/[0.04] rounded-lg w-20 border border-white/[0.04]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* How it works */}
      <section className="relative z-10 mx-auto w-full max-w-4xl px-6 pb-24">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 mb-10">Cara kerja</p>
        <div className="grid gap-px sm:grid-cols-3 rounded-2xl border border-white/[0.06] overflow-hidden bg-white/[0.03]">
          {[
            {
              step: "01",
              title: "Upload screenshot",
              desc: "Drag & drop tangkapan layar aplikasi. PNG, JPEG, atau WebP.",
              color: "text-indigo-400",
            },
            {
              step: "02",
              title: "AI rangkum otomatis",
              desc: "Gemini AI menganalisis setiap layar dan buat deskripsi profesional.",
              color: "text-purple-400",
            },
            {
              step: "03",
              title: "Download PDF",
              desc: "Unduh portofolio A4 berkualitas tinggi, siap dikirim ke perekrut.",
              color: "text-emerald-400",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="animate-fade-in-up flex flex-col p-7 sm:p-8 bg-zinc-950/50 backdrop-blur-sm border-white/[0.03] [&:not(:last-child)]:border-b sm:[&:not(:last-child)]:border-b-0 sm:[&:not(:last-child)]:border-r"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className={`text-xs font-mono font-bold ${f.color} mb-4`}>{f.step}</span>
              <h3 className="text-[15px] font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-4xl px-6 pb-24">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Hasil yang Anda dapatkan
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Dari screenshot mentah jadi narasi proyek yang siap dipoles dan diekspor.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
                Fokusnya bukan sekadar upload gambar, tapi membantu Anda merapikan problem, solusi, impact, dan poin fitur agar lebih enak dibaca recruiter atau client.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs text-zinc-300">
                {[
                  "Ringkasan proyek otomatis",
                  "Poin fitur per layar",
                  "Narrative problem-solution-impact",
                  "Ekspor PDF siap kirim",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-zinc-950/80 p-4 shadow-xl shadow-black/30">
              <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
                <div>
                  <p className="text-sm font-semibold text-white">Preview output</p>
                  <p className="text-xs text-zinc-500">Apa yang akan tersusun setelah analisis</p>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                  Draft AI
                </span>
              </div>
              <div className="mt-4 space-y-3 text-sm text-zinc-300">
                <div className="rounded-xl border border-white/[0.05] bg-white/[0.03] p-3">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Project summary</p>
                  <p className="mt-1 text-sm text-zinc-200">
                    Platform booking servis dengan alur reservasi, pelacakan status, dan notifikasi yang lebih ringkas untuk pengguna.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ["Problem", "User sulit memantau progres setelah booking."],
                    ["Solution", "Dashboard dan status servis dibuat lebih jelas per langkah."],
                    ["Impact", "Komunikasi manual berkurang dan alur lebih mudah dipahami."],
                  ].map(([title, body]) => (
                    <div key={title} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">{title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-300">{body}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3">
                  <p className="text-xs uppercase tracking-wide text-indigo-200">Feature bullets</p>
                  <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-indigo-50/90">
                    <li>• Upload screenshot dan grouping per flow</li>
                    <li>• Draft copy bisa diedit ulang sebelum export</li>
                    <li>• PDF akhir lebih rapi untuk portfolio case study</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.04] py-8">
        <div className="mx-auto max-w-4xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} Portfolio Maker
          </p>
          <nav className="flex items-center gap-5 text-xs text-zinc-600">
            <Link href="/pricing" className="hover:text-zinc-400 transition-colors">Harga</Link>
            <Link href="/privacy" className="hover:text-zinc-400 transition-colors">Privasi</Link>
            <Link href="/app" className="hover:text-zinc-400 transition-colors">Dashboard</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
