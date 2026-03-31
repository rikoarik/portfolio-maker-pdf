/**
 * Uji koneksi Postgres (DATABASE_URL / DIRECT_URL) dari mesin Anda.
 * Jalankan: npm run db:test
 */
import "dotenv/config";
import pg from "pg";

function sslForUrl(url) {
  return url.includes("supabase.co")
    ? { rejectUnauthorized: false }
    : undefined;
}

/** Sama dengan src/lib/pg-ssl `sanitizeConnectionStringForNodePg` — sslmode di URI mengalahkan opsi ssl. */
function sanitizeConnectionStringForNodePg(url) {
  if (!url.includes("supabase.co")) return url;
  try {
    const u = new URL(url);
    u.searchParams.delete("sslmode");
    return u.toString();
  } catch {
    return url;
  }
}

const urls = [
  ["DATABASE_URL", process.env.DATABASE_URL],
  ["DIRECT_URL", process.env.DIRECT_URL],
].filter(([, u]) => typeof u === "string" && u.length > 0);

if (urls.length === 0) {
  console.error("Setidaknya satu dari DATABASE_URL atau DIRECT_URL harus ada di .env");
  process.exit(1);
}

for (const [name, connectionString] of urls) {
  console.log(`\n--- ${name} ---`);
  const cs = sanitizeConnectionStringForNodePg(connectionString);
  const ssl = sslForUrl(cs);
  const client = new pg.Client({
    connectionString: cs,
    connectionTimeoutMillis: 10000,
    ...(ssl ? { ssl } : {}),
  });
  try {
    await client.connect();
    const r = await client.query("SELECT current_database() AS db");
    console.log("OK:", r.rows[0]);
    await client.end();
  } catch (e) {
    const err = /** @type {NodeJS.ErrnoException} */ (e);
    console.error("GAGAL:", err.message);
    if (err.code) console.error("code:", err.code);
    if (err.code === "ENOTFOUND") {
      console.error(
        "DNS gagal (ENOTFOUND). Host db.*.supabase.co sering hanya punya IPv6; jaringan tanpa IPv6 perlu URI Session pooler (*.pooler.supabase.com) dari Dashboard. Lihat README bagian P1001/ENOTFOUND.",
      );
      const ref = /db\.([^.]+)\.supabase\.co/.exec(connectionString);
      if (ref) {
        console.error(
          `  → Ganti DATABASE_URL: https://supabase.com/dashboard/project/${ref[1]}/settings/database — Connection string — mode Session (pooler, host *.pooler.supabase.com:5432).`,
        );
      }
    } else if (err.code === "XX000" || /tenant or user not found/i.test(String(err.message))) {
      console.error(
        "Kredensial pooler salah atau region/host tidak cocok project. Reset password di Supabase → Database, lalu salin URI Session pooler lengkap. Lihat README.",
      );
    } else if (err.code === "ETIMEDOUT" || err.code === "ECONNREFUSED") {
      console.error(
        "Saran: coba connection string Session pooler dari Supabase Dashboard (host *.pooler.supabase.com), hotspot, atau migrasi lewat SQL Editor / MCP.",
      );
    }
    await client.end().catch(() => {});
    process.exitCode = 1;
  }
}

if (process.exitCode === 1) {
  console.error("\nSetidaknya satu koneksi gagal.");
  process.exit(1);
}
console.log("\nSemua URL yang diuji berhasil.");
