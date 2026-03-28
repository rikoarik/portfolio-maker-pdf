# Backend Plan — Portfolio Maker

Dokumen ini merinci **arsitektur backend**, **API**, **data**, **pipeline AI & PDF**, dan **operasional** untuk aplikasi web Portfolio Maker. Selaras dengan `plan.md` dan `prd.md`.

---

## 1. Peran backend

| Fungsi | Deskripsi |
|--------|-----------|
| **API HTTP** | CRUD proyek, unggah file, trigger analisis, simpan draft, minta PDF |
| **Penyimpanan file** | Screenshot sementara atau sesuai retensi; akses aman untuk worker |
| **Orkestrasi AI** | Vision + teks per gambar; agregasi narasi proyek |
| **Antrian pekerjaan** | Job analisis & generate PDF agar tidak timeout request sinkron |
| **PDF** | Render template HTML → PDF (disarankan server-side) |
| **Auth (opsional)** | Sesuai keputusan MVP: session/JWT/OAuth |

---

## 2. Arsitektur logis

```
                    ┌─────────────┐
                    │   Client    │
                    └──────┬──────┘
                           │ HTTPS
              ┌────────────┴────────────┐
              │     API Gateway /       │
              │     App Server          │
              │  (REST atau tRPC/BFF) │
              └────────────┬────────────┘
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   ┌──────────┐     ┌────────────┐   ┌────────────┐
   │PostgreSQL│     │Object      │   │Redis       │
   │(metadata)│     │Storage S3  │   │(queue)     │
   └──────────┘     └────────────┘   └──────┬─────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    ▼                                               ▼
            ┌───────────────┐                             ┌───────────────┐
            │ Worker: AI    │                             │ Worker: PDF   │
            │ (vision+LLM)  │                             │ (Playwright)  │
            └───────────────┘                             └───────────────┘
                    │                                               │
                    └───────────────────┬───────────────────────────┘
                                        ▼
                              ┌──────────────────┐
                              │ External AI API  │
                              │ (OpenAI/Google/  │
                              │  Anthropic, dll) │
                              └──────────────────┘
```

**Catatan MVP:** Satu proses monolit (API + worker dalam satu repo) boleh; pisahkan antrian begitu unggahan banyak atau timeout menjadi masalah.

---

## 3. Stack backend (rekomendasi fleksibel)

| Lapisan | Opsi A | Opsi B |
|---------|--------|--------|
| Runtime | Node 20+ (Fastify / Hono) | Python 3.12+ (FastAPI) |
| ORM / query | Prisma / Drizzle (Node) | SQLAlchemy 2 (Python) |
| DB | PostgreSQL | PostgreSQL |
| Queue | BullMQ + Redis | Celery + Redis |
| Storage | S3-compatible (MinIO lokal dev) | Sama |
| PDF | Playwright atau Puppeteer di worker | Sama |
| Auth | Lucia / Auth.js / Clerk (Node) | Authlib / Clerk | 

Pilih **satu** jalur konsisten untuk mengurangi kompleksitas operasional.

---

## 4. Model data (implementasi)

Perluasan dari model konseptual di `plan.md`:

### 4.1 Entitas

| Entitas | Field utama | Catatan |
|---------|-------------|---------|
| **User** | `id`, `email`, `password_hash` atau `oauth_sub`, `created_at` | Opsional MVP |
| **PortfolioProject** | `id`, `user_id` (nullable jika anonim), `title`, `locale`, `draft_payload` (JSONB), `status`, `created_at`, `updated_at` | `draft_payload` menyimpan struktur editor (judul, sections, tech stack) |
| **ScreenshotAsset** | `id`, `project_id`, `sort_order`, `storage_key`, `mime`, `width`, `height`, `analysis_status` (`pending`/`ok`/`failed`) | |
| **AnalysisResult** | `id`, `asset_id`, `model`, `raw_json` (JSONB), `summary_text`, `error_code`, `created_at` | Satu baris terbaru per asset atau riwayat versi (pilih skema) |
| **Job** | `id`, `type` (`analyze`/`aggregate`/`pdf`), `project_id`, `payload`, `status`, `attempts`, `run_after` | Untuk antrian |
| **GeneratedDocument** | `id`, `project_id`, `template_id`, `storage_key`, `expires_at` | PDF; URL unduh bertanda tangan |

### 4.2 Indeks & constraint

- Foreign key `ScreenshotAsset.project_id` → `PortfolioProject.id` (on delete cascade atau soft delete sesuai kebijakan).
- Indeks pada `Job(status, run_after)` untuk worker polling.
- Unik `(asset_id)` jika hanya satu `AnalysisResult` aktif per gambar.

---

## 5. API (REST) — kontrak tingkat tinggi

Base URL: `/api/v1`. Semua respons error: `{ "error": { "code": "...", "message": "..." } }`.

### 5.1 Proyek

| Method | Path | Deskripsi |
|--------|------|-----------|
| `POST` | `/projects` | Buat proyek kosong (judul opsional, locale) |
| `GET` | `/projects/:id` | Detail + draft + daftar asset |
| `PATCH` | `/projects/:id` | Update `draft_payload`, judul, locale |
| `DELETE` | `/projects/:id` | Hapus proyek + asset terkait (sesuai policy) |

### 5.2 Unggah screenshot

| Method | Path | Deskripsi |
|--------|------|-----------|
| `POST` | `/projects/:id/screenshots` | `multipart/form-data`: satu atau banyak `files[]`; validasi MIME/size; simpan storage; buat `ScreenshotAsset` |

Respons: daftar `{ id, sort_order, url_preview }` — `url_preview` bisa presigned GET singkat atau ID saja + route terpisah.

### 5.3 Analisis AI

| Method | Path | Deskripsi |
|--------|------|-----------|
| `POST` | `/projects/:id/analyze` | Enqueue job analisis (semua gambar `pending` atau subset); respons `202` + `job_id` |
| `GET` | `/jobs/:jobId` | Status: `queued` / `running` / `completed` / `failed` + progress opsional |
| `POST` | `/projects/:id/screenshots/:assetId/retry` | (Post-MVP) Retry satu gambar |

Alternatif: WebSocket atau SSE untuk push status agar mengurangi polling.

### 5.4 PDF

| Method | Path | Deskripsi |
|--------|------|-----------|
| `POST` | `/projects/:id/pdf` | Body: `{ "templateId": "default" }` — enqueue generate PDF dari `draft_payload` + asset |
| `GET` | `/projects/:id/pdf/latest` | Metadata + URL unduh presigned atau redirect sekali pakai |

### 5.5 Auth (jika aktif)

| Method | Path | Deskripsi |
|--------|------|-----------|
| `POST` | `/auth/register`, `/auth/login`, `/auth/logout` | Sesuai strategi (cookie httpOnly vs JWT) |
| `GET` | `/auth/me` | Profil ringkas |

### 5.6 Kesehatan & operasional

| Method | Path | Deskripsi |
|--------|------|-----------|
| `GET` | `/health` | DB + Redis + storage reachability |
| `GET` | `/ready` | Siap terima traffic (untuk orchestrator) |

---

## 6. Pipeline AI

### 6.1 Input per gambar

- URL presigned atau buffer dari storage
- Metadata: `locale`, `project_title` (opsional), `sort_order`

### 6.2 Prompt & output

- **System + user prompt** meminta JSON valid: mis. `{ "screen_title", "features": [], "detected_ui_patterns": [], "tech_guess": [] }`
- Validasi dengan **JSON Schema** atau parser ketat; retry 1× dengan instruksi “output JSON only”
- **Agregasi:** satu panggilan LLM teks-only dengan ringkasan semua `raw_json` → `project_summary`, `suggested_tech_stack` (gabung ke `draft_payload` atau field terpisah)

### 6.3 Biaya & batas

- Resize gambar di worker (mis. lebar maks 2048px) sebelum kirim API
- Batas concurrent job per proyek / per user
- Log: `model`, `token_usage` (jika API menyediakan), tanpa menyimpan konten gambar di log teks

### 6.4 Rahasia

- `AI_API_KEY` hanya di server & worker; tidak pernah ke client
- Variabel lingkungan per environment (`dev` / `staging` / `prod`)

---

## 7. Pipeline PDF

1. Worker membaca `draft_payload` + path gambar dari storage.
2. Render **HTML** dengan template (Handlebars, React renderToString, atau engine lain) — **sama** dengan yang dipakai pratinjau di frontend jika memungkinkan (bagi partial template).
3. **Playwright/Puppeteer:** `page.setContent(html)` → `page.pdf({ format: 'A4', printBackground: true })`
4. Upload PDF ke storage; simpan `GeneratedDocument`; set `expires_at` jika URL sementara.

Fallback MVP: library PDF murni (mis. pdf-lib) jika headless Chrome sulit di-deploy — trade-off layout vs operasional.

---

## 8. Keamanan

| Area | Tindakan |
|------|----------|
| **Upload** | Whitelist MIME; batas ukuran; nama file disanitasi; virus scan opsional (fase lanjut) |
| **Autorisasi** | User hanya mengakses `project_id` miliknya; anonim: token sesi rahasia di cookie |
| **Rate limit** | Per IP + per user id pada `POST .../analyze` dan `.../pdf` |
| **Presigned URL** | TTL pendek untuk GET gambar/PDF |
| **CORS** | Hanya origin frontend produksi |
| **Secrets** | Vault atau managed secrets; rotasi API key |

---

## 9. Observabilitas

- **Structured logging** (JSON): `request_id`, `job_id`, `user_id`, level
- **Metrics:** durasi job AI, gagal rate, ukuran PDF
- **Tracing** (opsional): OpenTelemetry ke collector
- **Alert** pada error rate health check gagal

---

## 10. Deployment (gambaran)

| Komponen | Catatan |
|----------|---------|
| API | Container (Docker) atau PaaS (Railway, Fly, Render) |
| Worker | Proses terpisah atau worker dyno yang sama consume Redis queue |
| DB | Managed PostgreSQL |
| Redis | Managed Redis |
| Storage | S3 / R2 / GCS |

**Migrasi DB:** tool migrasi (Prisma migrate, Alembic) di CI/CD sebelum deploy.

---

## 11. Fase implementasi backend

| Fase | Deliverable |
|------|-------------|
| **B1** | `POST/GET/PATCH` proyek + `draft_payload`; upload screenshot ke storage |
| **B2** | Job analisis + integrasi satu penyedia vision API + simpan `AnalysisResult` |
| **B3** | Agregasi narasi + merge ke draft |
| **B4** | Job PDF + endpoint unduh |
| **B5** | Auth + ownership (jika bukan anonim) |
| **B6** | Rate limit, health, logging terstruktur |

---

## 12. Referensi

- `plan.md` — visi & model data konseptual
- `prd.md` — FR/NFR produk
- `frontend-plan.md` — konsumsi API dari sisi UI

---

*Backend plan v1.0 — revisi seiring keputusan stack dan MVP auth.*
