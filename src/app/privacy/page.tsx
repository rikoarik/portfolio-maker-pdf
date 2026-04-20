import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kebijakan privasi",
  description:
    "Cara Portfolio Maker memproses akun, proyek, screenshot, dan integrasi pihak ketiga (Supabase, penyimpanan, Gemini).",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800">
        ← Beranda
      </Link>
      <h1 className="mt-6 text-3xl font-semibold text-zinc-900">
        Kebijakan privasi
      </h1>
      <div className="prose prose-zinc mt-8 max-w-none text-sm leading-relaxed">
        <p>
          Portfolio Maker memproses data akun, proyek, dan screenshot Anda untuk
          menghasilkan dokumen portofolio PDF. Data tertentu dapat diproses oleh
          penyedia pihak ketiga yang kami gunakan, termasuk Supabase (auth/db),
          penyimpanan file (lokal/S3), dan Google Gemini untuk analisis teks
          dari screenshot.
        </p>
        <p className="mt-4">
          Jangan unggah data sensitif, rahasia, kata sandi, atau data pribadi
          pihak ketiga tanpa izin. Kami menyarankan Anda hanya mengunggah
          materi yang memang aman untuk dianalisis.
        </p>
        <p className="mt-4">
          Data proyek dan screenshot disimpan selama akun aktif, atau sampai Anda
          menghapus proyek atau data aplikasi Anda. Fitur ekspor data dan
          penghapusan data aplikasi tersedia di halaman pengaturan akun.
        </p>
        <p className="mt-4">
          Penggunaan layanan pihak ketiga tunduk pada ketentuan masing-masing
          penyedia, termasuk kebijakan Google AI dan penyedia pembayaran.
        </p>
        <p className="mt-4">
          Jika ada pertanyaan privasi atau permintaan penghapusan data, hubungi
          kami melalui halaman bantuan.
        </p>
      </div>
    </div>
  );
}
