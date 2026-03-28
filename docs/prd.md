# Product Requirements Document (PRD)

## Portfolio Maker — AI dari Screenshot ke PDF (Web)

| Field | Nilai |
|--------|--------|
| **Versi dokumen** | 1.0 |
| **Tanggal** | 28 Maret 2026 |
| **Status** | Draft — siap review |
| **Platform** | Web (browser desktop & mobile) |
| **Referensi** | Lihat `plan.md` untuk arsitektur & roadmap teknis |

---

## 1. Ringkasan eksekutif

**Portfolio Maker** adalah aplikasi web yang membantu pengguna menyusun dokumen portofolio proyek dari **screenshot antarmuka aplikasi**. Pengguna mengunggah gambar; **AI** menganalisis tiap layar dan menyusun teks terstruktur; pengguna **mengedit** hasil; lalu mengekspor **PDF** untuk dibagikan (lamaran kerja, klien, atau akademik).

**Masalah yang dipecahkan:** Menulis deskripsi proyek yang meyakinkan dari bukti visual memakan waktu dan sering tidak konsisten. Produk ini mempercepat draft awal dengan tetap memberi kontrol penuh kepada pengguna sebelum PDF dihasilkan.

---

## 2. Tujuan produk & metrik keberhasilan

### 2.1 Tujuan bisnis / produk

| ID | Tujuan | Ukurannya |
|----|--------|-----------|
| G1 | Pengguna dapat menghasilkan **satu PDF portofolio** dari screenshot tanpa menulis dari nol | Selesai alur end-to-end (MVP) |
| G2 | Mengurangi waktu menyusun draft portofolio dibanding menulis manual sepenuhnya | Survei atau waktu sesi (pasca-MVP) |
| G3 | Kepercayaan pengguna: hasil AI **bisa diedit** sebelum final | Fitur editor wajib di MVP |

### 2.2 Metrik keberhasilan (disarankan)

| Metrik | Definisi | Target awal (indikatif) |
|--------|----------|-------------------------|
| **Activation** | Pengguna yang mengunggah ≥1 gambar dan menjalankan analisis AI | Baseline pasca-launch |
| **Completion** | Pengguna yang mengunduh PDF setidaknya sekali per sesi/proyek | > X% dari yang activation (ditetapkan setelah baseline) |
| **Error rate** | Gagal analisis / gagal generate PDF / timeout | < Y% (ditetapkan bersama engineering) |
| **Biaya per pengguna** | Biaya API AI + storage per proyek selesai | Di bawah ambang yang ditetapkan finance/PM |

*Angka X/Y disepakati setelah MVP berjalan dan ada data.*

---

## 3. Non-tujuan (out of scope produk)

| Item | Alasan |
|------|--------|
| Aplikasi native (iOS/Android/desktop) | Fokus fase ini: **web-only** |
| Pengganti desain grafis profesional (Figma, dsb.) | Produk menghasilkan PDF berbasis template, bukan desain bebas penuh |
| Jaminan keakuratan AI 100% | User wajib review; disclaimer di UI |
| OCR offline tanpa layanan pihak ketiga | Bisa dieksplorasi fase berikutnya |

---

## 4. Persona & kebutuhan

### 4.1 Persona utama

| Persona | Kebutuhan | Bagaimana produk membantu |
|---------|-----------|-----------------------------|
| **P1 — Developer / designer** | Menunjukkan proyek nyata ke recruiter/klien dengan cepat | Draft teks + susunan screenshot → PDF |
| **P2 — Mahasiswa / lulusan bootcamp** | Portofolio tugas/proyek akhir dengan penjelasan yang rapi | AI mengisi struktur awal dari screenshot |

### 4.2 Asumsi pengguna

- Punya koneksi internet saat unggah dan analisis.
- Memahami bahwa **gambar dapat diproses oleh penyedia AI** (lihat bagian legal/UX).
- Bertanggung jawab atas isi screenshot (tidak mengandung data sensitif yang tidak boleh dibagikan).

---

## 5. User stories (prioritas)

### 5.1 MVP (must have)

| ID | User story | Kriteria penerimaan (ringkas) |
|----|------------|-------------------------------|
| US-1 | Sebagai pengguna, saya ingin **mengunggah banyak screenshot** sekaligus agar satu proyek tercakup. | Drag-drop atau file picker; format PNG/JPG/WebP; batas ukuran & jumlah sesuai kebijakan produk. |
| US-2 | Sebagai pengguna, saya ingin memicu **analisis AI** pada gambar yang diunggah. | Tombol jelas; status loading/error; hasil tersimpan untuk diedit. |
| US-3 | Sebagai pengguna, saya ingin **melihat dan mengedit** teks yang dihasilkan (judul, deskripsi, poin-poin, dsb.). | Form/editor terstruktur; perubahan tidak hilang sebelum unduh (persistensi minimal per sesi atau akun). |
| US-4 | Sebagai pengguna, saya ingin **melihat pratinjau** kira-kira tampilan sebelum PDF. | Pratinjau HTML/layout yang konsisten dengan output PDF. |
| US-5 | Sebagai pengguna, saya ingin **mengunduh PDF** portofolio saya. | File terunduh di browser; nama file masuk akal; isi mencakup ringkasan + screenshot + teks yang diedit. |
| US-6 | Sebagai pengguna, saya ingin **peringatan privasi** sebelum mengirim gambar ke AI. | Copy singkat + link ke kebijakan privasi (jika ada); setuju atau lanjut eksplisit jika diputuskan. |

### 5.2 Post-MVP (should / could)

| ID | User story | Prioritas |
|----|------------|-----------|
| US-7 | Login / simpan proyek lintas perangkat | Should (F2) |
| US-8 | **Retry** atau **skip** satu gambar jika analisis gagal | Should |
| US-9 | **Regenerate** teks dengan instruksi tambahan (bahasa, fokus UX, dsb.) | Could (F3) |
| US-10 | Pilihan **lebih dari satu template PDF** | Could (F2+) |

---

## 6. Alur pengguna (flows)

### 6.1 Happy path

1. Landing / halaman utama → mulai proyek baru (atau langsung unggah jika tanpa auth).
2. Unggah 1–N screenshot → konfirmasi daftar file.
3. Setuju privasi (jika dipersyaratkan) → **Analisis dengan AI**.
4. Tampil hasil per gambar + ringkasan proyek (jika ada agregasi).
5. Edit teks di form/editor → pratinjau.
6. Pilih template (MVP: satu template default).
7. **Unduh PDF** → sukses dengan konfirmasi.

### 6.2 Alur pengecualian

| Situasi | Perilaku yang diharapkan |
|---------|---------------------------|
| File terlalu besar / format tidak didukung | Pesan error jelas; file ditolak sebelum proses AI |
| Gagal analisis satu atau lebih gambar | Pesan error; opsi retry/skip (post-MVP minimal: pesan + tidak blokir unduh jika user setuju pakai teks manual) |
| Gagal generate PDF | Pesan error; tidak kehilangan draft teks; retry unduh |
| Jaringan putus | Indikasi status; tidak kehilangan data jika sudah disimpan (sesuai desain persistensi) |

---

## 7. Persyaratan fungsional

### 7.1 Unggah & manajemen file

| ID | Persyaratan |
|----|-------------|
| FR-1 | Sistem menerima format **PNG, JPEG, WebP** (validasi MIME + ekstensi). |
| FR-2 | Batas **ukuran per file** dan **jumlah file per proyek** didefinisikan dan ditampilkan ke pengguna (nilai numerik dapat diubah lewat konfigurasi). |
| FR-3 | Pengguna dapat mengurutkan atau menghapus gambar dari daftar sebelum analisis (jika didukung UI). |
| FR-4 | Unggah mendukung **multipart** dengan indikator progres untuk file besar. |

### 7.2 Analisis AI

| ID | Persyaratan |
|----|-------------|
| FR-5 | Untuk setiap gambar, sistem memanggil pipeline **vision-capable** untuk menghasilkan output **terstruktur** (mis. JSON: judul layar, poin fitur, keyword teknologi). |
| FR-6 | Sistem dapat menjalankan **agregasi** (opsional tapi disarankan): menggabungkan hasil N gambar menjadi narasi/ringkasan proyek tunggal. |
| FR-7 | Output gagal validasi skema dapat di-retry otomatis terbatas atau fallback ke placeholder dengan pesan ke pengguna. |
| FR-8 | Riwayat **error** dari AI disimpan untuk debugging (tanpa menyimpan konten sensitif berlebihan di log publik). |

### 7.3 Editor & konten

| ID | Persyaratan |
|----|-------------|
| FR-9 | Field minimal: **judul proyek**, **deskripsi/summary**, konten per screenshot (caption atau section), **tech stack** (teks atau tag). |
| FR-10 | Pengguna dapat mengedit semua field yang memengaruhi PDF sebelum ekspor. |
| FR-11 | Bahasa output AI mengikuti **pilihan bahasa** atau default produk (ditetapkan di konfigurasi MVP). |

### 7.4 PDF

| ID | Persyaratan |
|----|-------------|
| FR-12 | PDF memuat minimal: **halaman sampul atau header**, **ringkasan proyek**, **halaman atau section per screenshot** dengan teks yang diedit. |
| FR-13 | PDF dihasilkan dengan **konsistensi** dengan pratinjau (satu sumber kebenaran template disarankan). |
| FR-14 | Pengguna memperoleh file melalui **unduhan browser** (HTTP response attachment atau URL bertanda tangan sekali pakai). |

### 7.5 Autentikasi & penyimpanan (opsional MVP)

| ID | Persyaratan |
|----|-------------|
| FR-15 | Jika MVP **tanpa login**: persistensi minimal (session/local) atau batasan eksplisit “data hilang jika tab ditutup” harus dikomunikasikan. |
| FR-16 | Jika **dengan login**: proyek terikat ke akun; logout tidak menghapus data tanpa konfirmasi (sesuai kebijakan). |

---

## 8. Persyaratan non-fungsional

| ID | Kategori | Persyaratan |
|----|----------|-------------|
| NFR-1 | Performa — UI | Interaksi UI umum (klik, navigasi) responsif; target indikatif **< 200 ms** perceived untuk feedback visual. |
| NFR-2 | Performa — AI | Analisis tidak memblokir selamanya: **async** (polling/WebSocket/job) dengan status jelas. |
| NFR-3 | Skalabilitas | Banyak gambar diproses lewat **antrian** atau chunking agar tidak timeout (setelah MVP jika perlu). |
| NFR-4 | Keamanan | **HTTPS**; validasi input file; sanitasi konten di pratinjau; **CSP** sesuai kemampuan tim. |
| NFR-5 | Rate limiting | Endpoint mahal (upload AI) dibatasi per IP/user untuk mencegah penyalahgunaan. |
| NFR-6 | Aksesibilitas | Label form, fokus keyboard pada alur utama, kontras warna memadai (WCAG sebagai target bertahap). |
| NFR-7 | Privasi | Kebijakan retensi file screenshot; penghapusan sesuai janji produk; dokumentasi pemrosesan pihak ketiga (AI). |

---

## 9. Kebutuhan UX & konten

| Item | Deskripsi |
|------|-----------|
| **Onboarding** | Singkat: apa yang dilakukan produk dalam 1–2 kalimat + CTA unggah. |
| **Privasi** | Copy: gambar dikirim ke layanan AI; jangan unggah data rahasia; tautan ke kebijakan. |
| **Empty state** | Ilustrasi/teks saat belum ada file. |
| **Loading** | Skeleton atau progress untuk analisis dan generate PDF. |
| **Error** | Bahasa manusiawi + langkah berikutnya (coba lagi, periksa format, dsb.). |

---

## 10. Legal & kepatuhan (checklist produk)

- [ ] Halaman atau footer **Kebijakan Privasi** menjelaskan pengiriman gambar ke penyedia AI.
- [ ] **Syarat Penggunaan** menyebut batas tanggung jawab atas konten yang diunggah pengguna.
- [ ] Kepatuhan terhadap syarat API penyedia model (data pengguna, retensi, wilayah).

---

## 11. Ketergantungan & risiko

| Ketergantungan | Dampak |
|----------------|--------|
| Penyedia API AI (vision + teks) | Ketersediaan, biaya, perubahan model |
| Penyimpanan file & DB | Biaya infrastruktur |
| Generator PDF di server | Perlu environment yang mendukung (worker, browser headless, dsb.) |

| Risiko | Mitigasi (ringkas) |
|--------|---------------------|
| Biaya API tinggi | Resize gambar, batas kuota, cache hasil per hash |
| Output AI tidak relevan | Editor wajib; regenerate (post-MVP) |
| PDF beda dengan preview | Template HTML tunggal untuk preview & PDF |

---

## 12. Rilis & ruang lingkup MVP

| Lingkup | Termasuk dalam MVP |
|---------|---------------------|
| Platform | Web |
| Unggah multi-gambar | Ya |
| Analisis AI + edit + PDF | Ya |
| Template PDF | **Satu** template |
| Auth | Opsional — keputusan eksplisit sebelum build |
| Regenerate bertingkat | Post-MVP |

Detail fase lanjutan: lihat **Roadmap** di `plan.md`.

---

## 13. Pertanyaan terbuka (untuk disepakati)

1. **Bahasa UI default** (Indonesia vs Inggris vs bilingual)?
2. **MVP dengan atau tanpa login?**
3. **Nilai pasti** batas ukuran file, jumlah gambar, dan rate limit?
4. **Nama merek** final dan domain?
5. **Retensi file** screenshot: berapa lama disimpan setelah proses?

---

## 14. Lampiran & referensi

- `plan.md` — arsitektur, stack contoh, model data konseptual, roadmap teknis.
- Versi PRD ini harus di-**version** bersama milestone produk (mis. PRD 1.1 setelah keputusan MVP auth).

---

*Akhir dokumen PRD v1.0*
