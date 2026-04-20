import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pusat bantuan",
  description:
    "Panduan penggunaan Portfolio Maker, billing, dan tautan ke status layanan.",
  alternates: { canonical: "/help" },
  robots: { index: true, follow: true },
};

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800">
        ← Beranda
      </Link>
      <h1 className="mt-6 text-3xl font-semibold text-zinc-900">Pusat bantuan</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Panduan singkat untuk penggunaan, billing, dan status layanan.
      </p>

      <div className="mt-8 space-y-4">
        <details className="rounded-xl border border-zinc-200 bg-white p-4">
          <summary className="cursor-pointer font-medium text-zinc-900">
            Bagaimana cara upgrade paket?
          </summary>
          <p className="mt-2 text-sm text-zinc-600">
            Buka halaman <Link href="/pricing" className="text-indigo-600 hover:underline">harga</Link>,
            pilih paket Pro, lalu lanjutkan checkout.
          </p>
        </details>

        <details className="rounded-xl border border-zinc-200 bg-white p-4">
          <summary className="cursor-pointer font-medium text-zinc-900">
            Bagaimana cara membatalkan langganan?
          </summary>
          <p className="mt-2 text-sm text-zinc-600">
            Jika menggunakan Stripe, Anda bisa kelola langganan dari halaman pengaturan.
            Untuk Midtrans, pembatalan mengikuti alur dukungan pembayaran.
          </p>
        </details>

        <details className="rounded-xl border border-zinc-200 bg-white p-4">
          <summary className="cursor-pointer font-medium text-zinc-900">
            Bagaimana cara ekspor atau hapus data aplikasi?
          </summary>
          <p className="mt-2 text-sm text-zinc-600">
            Buka <Link href="/app/settings" className="text-indigo-600 hover:underline">pengaturan akun</Link>,
            lalu gunakan tombol ekspor data atau hapus data aplikasi. Proses ini menghapus data Portfolio Maker, bukan selalu identitas login dari penyedia autentikasi.
          </p>
        </details>
      </div>

      <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
        Status layanan: <Link href="/status" className="text-indigo-600 hover:underline">lihat halaman status</Link>.
      </div>
    </div>
  );
}
