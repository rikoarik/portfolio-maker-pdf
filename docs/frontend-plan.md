# Frontend Plan — Portfolio Maker

Dokumen ini merinci **struktur UI**, **halaman**, **state**, **integrasi API**, dan **UX teknis** untuk aplikasi web Portfolio Maker. Selaras dengan `plan.md`, `prd.md`, dan `backend-plan.md`.

---

## 1. Peran frontend

| Fungsi | Deskripsi |
|--------|-----------|
| **Onboarding & privasi** | Menjelaskan alur + peringatan pengiriman gambar ke AI |
| **Unggah** | Drag-drop & file picker, daftar file, validasi klien |
| **Status async** | Analisis & PDF: loading, progress, error yang dapat ditindaklanjuti |
| **Editor** | Form terstruktur untuk judul, ringkasan, per-screenshot, tech stack |
| **Pratinjau** | Layout mendekati PDF sebelum unduh |
| **Unduh** | Memicu generate PDF dan mengunduh file |
| **Responsif** | Layout berbeda untuk layar lebar (editor) vs sempit (review) |

Tidak memanggil API AI langsung dari browser — hanya backend.

---

## 2. Arsitektur UI

### 2.1 Pola aplikasi

| Opsi | Kapan cocok |
|------|-------------|
| **SPA** (Vite + React/Vue/Svelte) | MVP cepat; SEO landing terpisah atau prerender ringan |
| **Full-stack framework** (Next.js App Router, Nuxt) | SSR untuk marketing + API route opsional (bisa menggabung BFF) |

Rekomendasi MVP: **SPA + satu halaman marketing statis** atau route `/` + `/app` tanpa kompleksitas SSR wajib.

### 2.2 Struktur folder (contoh React)

```
src/
  app/                 # router (React Router / TanStack Router)
  components/
    ui/                # tombol, input, modal (bisa shadcn/ui)
    layout/
    upload/
    editor/
    preview/
  hooks/
  lib/
    api.ts             # fetch client + types
    query-keys.ts      # jika pakai TanStack Query
  stores/              # Zustand / Jotai (opsional)
  styles/
```

---

## 3. Halaman & routing

| Rute | Tujuan | Prioritas |
|------|--------|-----------|
| `/` | Landing: value prop, CTA “Mulai”, link privasi | MVP |
| `/app` atau `/projects/new` | Workspace proyek (bisa langsung tanpa daftar proyek di MVP) | MVP |
| `/app/projects/:id` | Edit proyek yang sama (deep link jika ada persistensi) | MVP |
| `/privacy`, `/terms` | Legal | MVP (minimal privasi) |
| `/login`, `/register` | Hanya jika backend auth aktif | F2 |

**MVP tanpa daftar proyek:** satu route `/app` dengan `projectId` di state atau localStorage setelah `POST /projects`.

---

## 4. Alur layar (wireframe logis)

### 4.1 Alur utama

1. **Landing** → klik Mulai → buat proyek (`POST /projects`) → redirect ke workspace dengan `projectId`.
2. **Workspace — zona unggah**  
   - Dropzone + tombol pilih file  
   - Daftar thumbnail + nama + hapus + urutkan (drag handle) jika FR mendukung  
3. **Persetujuan privasi** — modal atau inline sebelum `POST .../analyze` (sesuai PRD).
4. **Tombol “Analisis dengan AI”** → `POST .../analyze` → tampilkan status (polling `GET /jobs/:id` atau SSE).
5. **Zona hasil** — kartu per screenshot: judul layar, bullet, teks (dari API); skeleton saat loading per kartu.
6. **Editor global** — judul proyek, ringkasan, tech stack (textarea / tag input).
7. **Pratinjau** — tab atau split view: HTML/CSS yang mirror template PDF (sumber styling sama dengan rekomendasi backend).
8. **Unduh PDF** — `POST .../pdf` → tunggu job → `GET` unduh atau buka URL presigned.

### 4.2 State error

- Toast atau inline: gagal unggah, gagal analisis, gagal PDF — dengan tombol **Coba lagi** jika relevan.

---

## 5. Komponen utama

| Komponen | Tanggung jawab |
|----------|----------------|
| `UploadDropzone` | Drag-drop, `accept` image/*, validasi ukuran di klien |
| `ScreenshotList` | Daftar file + reorder + remove |
| `PrivacyGate` | Modal copy singkat + checkbox/konfirmasi |
| `AnalyzeButton` | Disabled sampai ada file + gate privasi |
| `JobProgress` | Indeterminate atau step “Menganalisis gambar X dari Y” |
| `ScreenCard` | Satu blok per asset: hasil AI + edit field |
| `ProjectForm` | Judul, summary, tech stack |
| `PreviewPane` | Render read-only dari struktur draft (props sama dengan template PDF jika memungkinkan) |
| `PdfDownloadBar` | Tombol unduh + status generating |

---

## 6. State & data fetching

### 6.1 Rekomendasi

- **TanStack Query (React Query)** untuk cache `GET /projects/:id`, invalidation setelah upload/analyze/PDF.
- **Zustand atau Context** untuk UI lokal: modal terbuka, tab aktif, draft optimistik sebelum `PATCH`.

### 6.2 Sinkronisasi draft

- **Debounced `PATCH`** saat user mengetik (mis. 500 ms) untuk mengurangi beban — atau tombol “Simpan” eksplisit di MVP untuk kesederhanaan.
- Saat refresh halaman: reload `GET /projects/:id` agar tidak kehilangan data server.

### 6.3 Polling job

- Interval 1–2 s dengan batas maks durasi; backoff jika 429.
- Alternatif: **SSE** dari backend untuk status job (kurangi polling).

---

## 7. Integrasi API (klien)

| Aksi UI | API |
|---------|-----|
| Buat sesi proyek | `POST /projects` |
| Unggah gambar | `POST /projects/:id/screenshots` (multipart) |
| Mulai analisis | `POST /projects/:id/analyze` |
| Cek status | `GET /jobs/:jobId` (atau stream) |
| Simpan teks | `PATCH /projects/:id` dengan `draft_payload` |
| Minta PDF | `POST /projects/:id/pdf` |
| Unduh | `GET` presigned URL dari respons atau endpoint dedicated |

**Client HTTP:** `fetch` + wrapper error; atau ky/axios. Sertakan **credentials** jika cookie session.

---

## 8. Styling & desain

| Aspek | Arah |
|-------|------|
| **Sistem** | Tailwind CSS + komponen headless (Radix) jika perlu aksesibilitas |
| **Tema** | Satu palet konsisten; mode gelap opsional |
| **Tipografi** | Font web yang sama dengan yang dipakai template PDF (definisikan di satu file token) |
| **Pratinjau** | Lebar kontainer mirip A4 (mis. `max-w-[210mm]`) agar perasaan mirip PDF |

---

## 9. Aksesibilitas & i18n

- Label terikat ke input; tombol dengan `aria-busy` saat loading.
- Fokus trap di modal privasi.
- **i18n:** siapkan kunci string (format JSON) jika UI bilingual; default bisa Indonesia sesuai keputusan PRD.

---

## 10. Performa frontend

- **Lazy load** rute berat (editor preview) jika bundle besar.
- **Thumbnail** gambar: `URL.createObjectURL` lokal sebelum upload; setelah upload gunakan URL preview dari API.
- Hindari mengirim gambar ulang ke client untuk AI — hanya tampilkan dari storage/preview endpoint.

---

## 11. Keamanan di klien

- Jangan simpan API key AI di frontend.
- Sanitasi jika ada rich text di preview (DOMPurify) untuk mencegah XSS dari paste konten.

---

## 12. Testing (disarankan)

| Jenis | Cakupan |
|-------|---------|
| **Unit** | Utils validasi file, formatter draft |
| **Komponen** | UploadDropzone, PrivacyGate (Testing Library) |
| **E2E** | Playwright: alur unggah → mock API → klik analisis (opsional dengan MSW) |

---

## 13. Fase implementasi frontend

| Fase | Deliverable |
|------|-------------|
| **F1** | Landing + layout + routing |
| **F2** | Workspace: upload + daftar + create project |
| **F3** | Privasi gate + analyze + polling + kartu hasil |
| **F4** | Editor + debounced PATCH |
| **F5** | Preview pane + styling selaras PDF |
| **F6** | PDF download flow + error states lengkap |
| **F7** | Responsif mobile untuk review & unduh |

---

## 14. Referensi

- `plan.md` — visi & komponen frontend ringkas
- `prd.md` — user stories & UX wajib
- `backend-plan.md` — endpoint dan kontrak data

---

*Frontend plan v1.0 — revisi setelah keputusan framework dan auth.*
