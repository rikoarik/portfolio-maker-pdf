import Link from "next/link";
import { LandingActions } from "@/components/landing-actions";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-zinc-50 selection:bg-zinc-200">
      {/* Decorative Background */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-0">
        <div className="absolute top-[-10%] sm:top-[-20%] left-[-10%] w-[60%] sm:w-[50%] aspect-square rounded-full bg-gradient-to-br from-indigo-100/60 to-purple-100/60 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] sm:bottom-[-20%] right-[-10%] w-[60%] sm:w-[50%] aspect-square rounded-full bg-gradient-to-tl from-emerald-50/60 to-teal-100/60 blur-[100px]"></div>
      </div>
      
      {/* Header/Nav */}
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
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/login" className="text-zinc-600 hover:text-zinc-900 transition-colors hidden sm:block">Masuk</Link>
          <Link href="/register" className="rounded-full bg-zinc-900 px-5 py-2.5 text-white shadow-lg transition-all hover:bg-zinc-800 hover:shadow-zinc-900/20 active:scale-95">Daftar Gratis</Link>
        </nav>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-8 inline-flex items-center rounded-full border border-zinc-200/60 bg-white/50 px-4 py-1.5 text-sm font-medium text-zinc-600 backdrop-blur-md shadow-sm">
          <span className="mr-2 flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Ubah screenshot menjadi portofolio profesional
        </div>
        
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tighter text-zinc-900 text-balance leading-[1.1] max-w-4xl py-2">
          Buat <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">CV &amp; Portofolio</span> dengan AI
        </h1>
        
        <p className="mt-6 text-lg sm:text-xl leading-relaxed text-zinc-600 max-w-2xl text-balance">
          Pamerkan karya terbaikmu tanpa ribet. Unggah tangkapan layar aplikasi, biarkan AI merangkum fitur, lalu unduh PDF siap lamar dalam hitungan menit.
        </p>

        <div className="mt-10 flex flex-col items-center gap-6 w-full">
          <div className="w-full max-w-sm">
            <LandingActions />
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-emerald-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Tanpa kartu kredit</span>
            <span className="mx-2">·</span>
            <span>Gratis selamanya (versi dasar)</span>
          </div>
        </div>

        {/* Feature Grid/Mockup */}
        <div className="mt-20 w-full max-w-4xl rounded-3xl border border-white/40 bg-white/40 p-2 shadow-2xl backdrop-blur-xl">
          <div className="aspect-[16/9] w-full items-center justify-center rounded-2xl bg-zinc-900/5 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 to-zinc-200 flex flex-col pt-8 px-8">
              <div className="w-full flex gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              </div>
              <div className="flex-1 bg-white rounded-t-xl shadow-lg border border-zinc-200 p-6 flex gap-6">
                <div className="w-1/3 flex flex-col gap-4">
                  <div className="h-32 bg-zinc-100 rounded-lg w-full ring-1 ring-zinc-200/50"></div>
                  <div className="h-4 bg-zinc-200 rounded w-3/4"></div>
                  <div className="h-4 bg-zinc-100 rounded w-1/2"></div>
                </div>
                <div className="w-2/3 flex flex-col gap-4">
                  <div className="h-8 bg-zinc-100 rounded w-1/3"></div>
                  <div className="h-4 bg-zinc-100 rounded w-full mt-4"></div>
                  <div className="h-4 bg-zinc-100 rounded w-full"></div>
                  <div className="h-4 bg-zinc-100 rounded w-4/5"></div>
                  <div className="h-20 bg-indigo-50 rounded-lg w-full mt-4 border border-indigo-100"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="relative z-10 w-full py-8 text-center text-sm font-medium text-zinc-500 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 px-4">
          <Link href="/login" className="hover:text-zinc-900 transition-colors">Masuk</Link>
          <Link href="/register" className="hover:text-zinc-900 transition-colors">Daftar</Link>
          <Link href="/app" className="hover:text-zinc-900 transition-colors">Dashboard</Link>
          <Link href="/privacy" className="hover:text-zinc-900 transition-colors">Privasi</Link>
        </div>
        <p className="mt-6">
          &copy; {new Date().getFullYear()} Portfolio Maker. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
