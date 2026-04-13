import Link from "next/link";

export default function StatusPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800">
        ← Beranda
      </Link>
      <h1 className="mt-6 text-3xl font-semibold text-zinc-900">Status layanan</h1>
      <p className="mt-4 text-sm text-zinc-600">
        Halaman ini memberi status operasional dasar. Untuk produksi, Anda bisa
        menghubungkan ke layanan status eksternal seperti Better Uptime.
      </p>

      <div className="mt-6 space-y-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-medium text-zinc-900">Aplikasi web</p>
          <p className="mt-1 text-sm text-emerald-700">Operasional</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-medium text-zinc-900">API analisis</p>
          <p className="mt-1 text-sm text-emerald-700">Operasional</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-medium text-zinc-900">Pembayaran</p>
          <p className="mt-1 text-sm text-emerald-700">Operasional</p>
        </div>
      </div>
    </div>
  );
}
