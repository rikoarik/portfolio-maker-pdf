import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800">
        ← Beranda
      </Link>
      <h1 className="mt-6 text-3xl font-semibold text-zinc-900">
        Kebijakan privasi (ringkas)
      </h1>
      <div className="prose prose-zinc mt-8 max-w-none text-sm leading-relaxed">
        <p>
          Portfolio Maker mengirim gambar screenshot yang Anda unggah ke backend
          kami, lalu ke layanan Google Gemini untuk analisis teks. Jangan
          mengunggah data sensitif, kata sandi, atau informasi pribadi pihak
          ketiga.
        </p>
        <p className="mt-4">
          File disimpan di server pengembangan secara lokal; untuk produksi,
          tentukan retensi penyimpanan dan penyedia sesuai kebutuhan Anda.
        </p>
        <p className="mt-4">
          Penggunaan API Google tunduk pada syarat layanan Google dan kebijakan
          Google AI.
        </p>
      </div>
    </div>
  );
}
