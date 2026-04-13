import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Syarat layanan",
  description:
    "Syarat penggunaan Portfolio Maker: tanggung jawab konten, layanan, dan pembatasan yang berlaku.",
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800">
        ← Beranda
      </Link>
      <h1 className="mt-6 text-3xl font-semibold text-zinc-900">Syarat layanan</h1>
      <div className="prose prose-zinc mt-8 max-w-none text-sm leading-relaxed">
        <p>
          Dengan menggunakan Portfolio Maker, Anda menyetujui bahwa Anda bertanggung jawab
          atas konten yang diunggah dan output dokumen yang dihasilkan.
        </p>
        <p className="mt-4">
          Paket berbayar diperpanjang mengikuti metode pembayaran yang Anda pilih.
          Pembatalan berlaku untuk periode berikutnya, dan akses Pro tetap aktif
          hingga periode berjalan berakhir.
        </p>
        <p className="mt-4">
          Anda dilarang mengunggah konten ilegal, melanggar hak cipta, atau data
          rahasia pihak ketiga tanpa izin. Kami dapat membatasi atau menutup akun
          yang melanggar ketentuan ini.
        </p>
        <p className="mt-4">
          Layanan disediakan apa adanya. Kami berupaya menjaga ketersediaan
          layanan, namun tidak menjamin tanpa gangguan.
        </p>
      </div>
    </div>
  );
}
