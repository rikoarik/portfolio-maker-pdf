# Portfolio Maker

Aplikasi web untuk membuat dokumen portofolio **PDF** dari **screenshot** aplikasi, dengan analisis teks menggunakan **Google Gemini** (multimodal) di sisi server.

## Persyaratan

- Node.js 20+
- **PostgreSQL 16+** (lokal via Docker, [Supabase](https://supabase.com/), Neon, dll.)
- Opsional: **Redis** (untuk antrian BullMQ menggantikan `after()`), **S3-compatible storage** (produksi multi-instance)

## Setup cepat

1. Jalankan database dan Redis (opsional):

   ```bash
   docker compose up -d postgres redis
   ```

2. Salin environment:

   ```bash
   cp .env.example .env
   ```

3. Isi `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (lihat [Cursor Supabase MCP](#cursor-supabase-mcp) atau dashboard → Settings → API), `DATABASE_URL`, dan `GEMINI_API_KEY`.

4. Migrasi dan dev:

   ```bash
   npm install
   npx prisma migrate deploy
   npm run dev
   ```

Buka [http://localhost:3000](http://localhost:3000).

## Antrian analisis (BullMQ)

- Tanpa `REDIS_URL`, job analisis berjalan di proses Next.js lewat `after()` (cocok dev / satu instance).
- Dengan `REDIS_URL`, API mem-**enqueue** job; jalankan worker terpisah:

  ```bash
  REDIS_URL=redis://127.0.0.1:6379 npm run worker
  ```

## Penyimpanan file

- Default: folder `storage/uploads/` di server.
- Produksi multi-instance: set `STORAGE_DRIVER=s3` dan variabel `S3_*` / `AWS_*` (lihat [.env.example](.env.example)).

## Autentikasi

- Daftar / masuk lewat **[Supabase Auth](https://supabase.com/docs/guides/auth)** (cookie sesi + JWT). Baris `User` di Postgres disinkronkan dari `auth.users` saat pertama kali profil dibutuhkan.
- Di Supabase: **Authentication → Providers → Email** — sesuaikan **konfirmasi email** (jika aktif, pengguna harus verifikasi sebelum sesi penuh).
- Proyek **anonim** (tanpa login) tetap bisa dibuat; proyek milik user hanya bisa diakses pemilik setelah login.

## Endpoint kesehatan

- `GET /api/health` — cek DB dan dapat menulis storage lokal.

## Deploy

- **Satu VM / satu container app**: Postgres + app + opsional Redis worker; volume atau S3 untuk upload.
- **Vercel / serverless**: tanpa volume bersama; wajib **S3** untuk file dan **Redis** (Upstash) untuk BullMQ jika dipakai; sesuaikan `DATABASE_URL` (Neon, Supabase, dll.).

### Supabase (PostgreSQL)

- Supabase **adalah Postgres**: skema Prisma dan migrasi yang ada dapat dipakai apa adanya.
- Di dashboard: **Project Settings → Database** — salin connection string; pastikan **`sslmode=require`** (biasanya sudah disertakan).
- **Satu koneksi langsung (port 5432)** ke database: cukup isi `DATABASE_URL` seperti biasa; jalankan sekali `npm run db:deploy` dari mesin yang punya akses internet ke host tersebut.
- **Pooler transaksi (port 6543 / PgBouncer)** untuk runtime di banyak instance: set `DATABASE_URL` ke URI pooling (ikuti label “Transaction” / pooler di Supabase), tambahkan parameter yang disarankan untuk Prisma ke PgBouncer (mis. `pgbouncer=true`). Untuk perintah migrasi, set juga **`DIRECT_URL`** ke URI koneksi **langsung** (port 5432); Prisma migrate memakai `DIRECT_URL` bila ada, sehingga migrasi tidak lewat pooler. Klien aplikasi (`pg` di `src/lib/db.ts`) tetap memakai `DATABASE_URL`.
- Setelah env diisi, dari root proyek: `npm run db:deploy` (atau `npx prisma migrate deploy`) lalu jalankan app/worker seperti biasa.
- Jika **`db:deploy` / `db:test` gagal (P1001, ENOTFOUND)**:
  1. Jalankan **`npm run db:test`**.
  2. Host **`db.<ref>.supabase.co`** sering hanya punya rekaman DNS **IPv6 (AAAA)**, tanpa IPv4 (A). `nslookup` bawaan hanya minta A → jawaban **"No answer"** itu normal; cek IPv6 dengan `dig AAAA db.<ref>.supabase.co @8.8.8.8`. Jika jaringan Anda **tanpa IPv6** yang jalan, klien tidak bisa menyambung ke host itu — **solusi paling andal**: salin URI **Session pooler** dari **Settings → Database → Connection string** (mode **Session**, host `*.pooler.supabase.com`, port **5432**) ke **`DATABASE_URL`**. Pooler biasanya punya **IPv4** (ELB) sehingga cocok untuk jaringan IPv4-only.
  3. Setelah pakai pooler, jalankan lagi **`npm run db:deploy`** (kosongkan `DIRECT_URL` kecuali Anda sengaja memisah URI untuk migrasi).
  4. Alternatif migrasi: **Supabase MCP** `apply_migration` / **SQL Editor** (urutan: `init_pg` lalu `supabase_auth_user_uuid`), lalu sinkronkan `_prisma_migrations` bila perlu.
  5. Error **`XX000` / Tenant or user not found** (setelah pakai pooler): URI atau **password database** tidak cocok dengan project. Buka [Database settings project ini](https://supabase.com/dashboard/project/iivfhmbdvpdxmntseinr/settings/database) → **Reset database password** (jika perlu) → **Connect** / **Connection string** → **Session pooler** → salin **satu baris** ke `DATABASE_URL`. Jangan menyusun `aws-0-REGION` manual; region salah = selalu XX000. Password dengan karakter khusus: `npm run db:encode-password -- 'password-mentah'` untuk nilai ter-encode di URI.

### Cursor Supabase MCP

Repo ini menyertakan [`.cursor/mcp.json`](.cursor/mcp.json) yang mengarah ke project Supabase `iivfhmbdvpdxmntseinr` (host MCP: `https://mcp.supabase.com/mcp?project_ref=...`). Di Cursor, aktifkan server **supabase** lalu Anda bisa:

- **`get_project_url`** — mengisi `NEXT_PUBLIC_SUPABASE_URL`
- **`get_publishable_keys`** — mengisi `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy anon atau publishable)
- **`apply_migration`** / **`execute_sql`** — operasi DDL/SQL ke database yang sama (alternatif dari `prisma migrate deploy` untuk kasus tertentu)
- **`list_tables`**, **`list_migrations`**, dll. — inspeksi skema

Aplikasi Next.js **tidak** memanggil MCP saat runtime; MCP dipakai untuk **pengembangan** (isi env, migrasi, debug). Autentikasi tetap memakai kunci **anon** di browser; jangan commit kunci ke repositori publik.

## Struktur penting

- `src/app/api/v1/*` — REST API
- `src/lib/gemini.ts` — vision + regenerate teks
- `src/lib/job-queue.ts` — BullMQ atau `after()`
- `src/worker.ts` — worker BullMQ
- `src/lib/storage/*` — lokal atau S3
- `prisma/` — skema PostgreSQL
- `src/lib/supabase/*` — klien Supabase (Auth + sesi)
- `docs/` — dokumen produk (plan, PRD, …)

Referensi integrasi: [Supabase Auth dengan Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs).

## Lisensi

Private / sesuaikan kebutuhan Anda.

# portfolio-maker-pdf
