# Portfolio Maker — Rencana Produk (Web-Only)

Dokumen ini merencanakan aplikasi **berbasis web** untuk membuat portofolio dari **screenshot aplikasi**, dengan bantuan **AI** untuk menganalisis gambar dan menyusun konten, lalu mengekspor hasil ke **PDF**.

---

## 1. Ringkasan visi

| Aspek | Deskripsi |
|--------|-----------|
| **Produk** | Web app: unggah screenshot → AI menganalisis & menyusun teks → user mengedit → unduh PDF |
| **Platform** | **Hanya web** (browser desktop/mobile); tidak ada native app di fase ini |
| **Nilai utama** | Menghemat waktu menulis deskripsi proyek dari bukti visual (screenshot) |

---

## 2. Ruang lingkup (scope)

### 2.1 Dalam scope (fase awal)

- Autentikasi pengguna (opsional untuk MVP — bisa ditunda jika single-session / anonim cukup)
- Unggah banyak gambar (drag-drop atau file picker)
- Antrian pemrosesan: tiap gambar dianalisis model vision + LLM
- Editor teks terstruktur (judul proyek, deskripsi, tech stack, peran, dll.)
- Pratinjau layout sebelum PDF
- Ekspor **PDF** (unduh dari browser)
- Responsif: layar lebar untuk editing, layar sempit untuk review

### 2.2 Di luar scope (eksplisit)

- Aplikasi desktop / mobile native
- Hosting file screenshot jangka panjang tanpa kebijakan retensi (perlu diputuskan)
- OCR offline penuh tanpa API (bisa fase berikutnya jika perlu)

### 2.3 Asumsi

- Pengguna punya koneksi internet saat memproses AI
- Screenshot tidak mengandung rahasia yang tidak boleh dikirim ke penyedia AI (user bertanggung jawab; produk harus memberi **peringatan privasi**)

---

## 3. Persona & alur pengguna

### 3.1 Persona utama

- Developer / designer yang ingin portofolio cepat dari bukti aplikasi nyata
- Mahasiswa atau bootcamp graduate dengan proyek ber-UI

### 3.2 Alur utama (happy path)

1. Buka situs → buat sesi / login (jika ada auth)
2. Buat “proyek portofolio” baru atau langsung unggah
3. Unggah 1–N screenshot (format: PNG, JPG, WebP; batas ukuran & jumlah ditetapkan)
4. Klik “Analisis dengan AI” → loading per batch atau keseluruhan
5. Review hasil: teks per slide/layar, ringkasan proyek, saran section
6. Edit manual di form/editor
7. Pilih template PDF (minimal: 1–2 layout)
8. “Unduh PDF” → file tersimpan di perangkat user

### 3.3 Alur sekunder

- **Gagal analisis:** pesan jelas, retry satu gambar, atau skip gambar
- **Edit ulang prompt:** user bisa memberi instruksi tambahan (“fokus ke UX”, “bahasa Indonesia”) lalu regenerate sebagian teks

---

## 4. Arsitektur tingkat tinggi (web-only)

```
[Browser]
   │
   ├─ SPA/SSR frontend (UI, upload, editor, preview)
   │
   └─ HTTPS ───────────────────────────────► [Backend API]
                                                   │
                    ├─ Validasi & penyimpanan sementara file
                    ├─ Orkestrasi panggilan AI (vision + text)
                    ├─ Penyimpanan draft konten (DB)
                    └─ Generator PDF (server-side direkomendasikan)
```

**Catatan:** PDF **bisa** dibuat di klien (library JS), tetapi untuk konsistensi font, layout multi-halaman, dan embedding gambar berkualitas, **generasi PDF di server** lebih terkendali. Tetap “web-only” karena user hanya berinteraksi lewat browser.

---

## 5. Komponen teknis

### 5.1 Frontend (web)

| Tanggung jawab | Contoh teknologi (pilih salah satu stack) |
|----------------|-------------------------------------------|
| Routing, state | React / Vue / Svelte + router |
| Upload | `multipart/form-data`, progress bar, kompresi opsional di klien |
| Editor | Textarea rich atau MD ringan; form field terstruktur |
| Preview | HTML preview atau iframe sebelum PDF |
| Styling | Tailwind / CSS modules — konsisten untuk preview ≈ PDF |

### 5.2 Backend (API web)

| Tanggung jawab | Catatan |
|----------------|---------|
| Auth | JWT/session cookie, atau OAuth (Google) jika perlu |
| Upload | Simpan ke object storage (S3-compatible) atau disk sementara |
| Rate limit | Lindungi endpoint AI dari penyalahgunaan |
| Job queue | Untuk banyak gambar: antrian (Redis + worker) agar tidak timeout HTTP |

### 5.3 AI pipeline

1. **Input:** URL/path gambar + metadata (opsional: nama proyek, bahasa output)
2. **Vision + language model:**  
   - Ekstraksi: apa yang terlihat di layar, kemungkinan fitur, kesan UX  
   - Output terstruktur: JSON (judul slide, bullet points, keywords tech)
3. **Aggregator:** gabungkan N hasil gambar jadi satu narasi proyek (satu panggilan LLM tambahan)
4. **Validasi:** skema JSON; jika gagal, retry dengan prompt lebih ketat atau fallback teks generik

**Privasi:** dokumentasikan bahwa gambar dikirim ke penyedia model; pertimbangkan **retensi singkat** atau hapus setelah proses.

### 5.4 PDF

- **Server:** HTML template → headless Chrome (Puppeteer/Playwright) atau library native (mis. per bahasa)
- **Isi:** cover, ringkasan proyek, halaman per screenshot dengan caption dari AI, footer konsisten
- **Unduh:** `Content-Disposition: attachment` atau signed URL sekali pakai

---

## 6. Model data (konseptual)

- **User** — id, email, created_at (jika ada auth)
- **PortfolioProject** — id, user_id, judul, bahasa, status draft
- **ScreenshotAsset** — id, project_id, urutan, url storage, lebar/tinggi, status analisis
- **AnalysisResult** — id, asset_id, raw_json, teks ringkasan, error message
- **GeneratedDocument** — id, project_id, versi template, url PDF (opsional, expired)

Penyesuaian dilakukan saat implementasi ORM/schema konkret.

---

## 7. Non-fungsional

| Area | Target |
|------|--------|
| **Performa** | Feedback < 200 ms untuk UI; analisis ditampilkan async (polling/WebSocket) |
| **Batas upload** | Mis. 10 MB per file, maks 20 gambar per proyek (disesuaikan biaya AI) |
| **A11y** | Label form, kontras warna, keyboard untuk alur utama |
| **Keamanan** | HTTPS, validasi tipe MIME, sanitasi HTML di preview, CSP |

---

## 8. Stack yang disarankan (contoh koheren)

Hanya salah satu contoh — tim bebas mengganti setara.

- **Frontend:** Next.js (App Router) atau Vite + React — SSR/SSG opsional untuk SEO landing
- **Backend:** API route Next.js atau server terpisah (Node/Fastify, atau Python/FastAPI)
- **DB:** PostgreSQL + Prisma / Drizzle / SQLAlchemy
- **Queue:** Redis + BullMQ (Node) atau Celery (Python)
- **Storage:** S3-compatible
- **PDF:** Playwright/Puppeteer di worker
- **AI:** API resmi OpenAI / Google / Anthropic (vision-capable models)

---

## 9. Fase implementasi (roadmap)

| Fase | Isi | Hasil deliverable |
|------|-----|-------------------|
| **F0 — Discovery** | Finalisasi persona, batas ukuran file, bahasa UI default | Dokumen keputusan singkat |
| **F1 — MVP** | Upload → 1 penyedia AI → teks terstruktur → edit manual → PDF satu template | Demo end-to-end di web |
| **F2 — Skalabilitas** | Antrian job, retry, template PDF ke-2, penyimpanan proyek + auth | Siap beta terbatas |
| **F3 — Polish** | Regenerate per section, prompt kustom, optimasi biaya (resize gambar) | Rilis publik |

---

## 10. Risiko & mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Biaya API melonjak | Resize/kompres gambar, batas gambar per hari per user, caching hasil analisis per hash file |
| Hasil AI tidak akurat | Editor wajib; opsi “regenerate” dengan instruksi |
| PDF tidak mirip preview | Satu sumber template (HTML) untuk preview dan PDF server |
| Regulasi data | Kebijakan privasi, lokasi server/storage, hapus data on-request jika memungkinkan |

---

## 11. Checklist sebelum development

- [ ] Memilih penyedia AI (vision + text) dan mengecek syarat penggunaan gambar user
- [ ] Menentukan apakah MVP perlu login atau anonim + rate limit IP
- [ ] Menentukan batas ukuran & jumlah file
- [ ] Satu contoh template PDF (wireframe) disetujui

---

## 12. Istilah

- **Web-only:** seluruh interaksi pengguna melalui browser; backend tetap bisa API + worker di server (masih termasuk produk web).
- **MVP:** versi minimal yang membuktikan alur unggah → AI → PDF.

---

*Dokumen ini hidup: revisi sejalan dengan keputusan produk dan teknis.*
