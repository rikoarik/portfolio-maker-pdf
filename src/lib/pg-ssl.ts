import type { ConnectionConfig } from "pg";

/**
 * Supabase Postgres memakai sertifikat valid; di jaringan dengan inspeksi SSL / proxy
 * kadang Node memunculkan SELF_SIGNED_CERT_IN_CHAIN — longgarkan verifikasi hanya untuk host Supabase.
 */
export function pgSslForConnectionString(url: string): ConnectionConfig["ssl"] {
  if (!url.includes("supabase.co")) return undefined;
  return { rejectUnauthorized: false };
}

/**
 * `sslmode=require` di URI membuat driver `pg` mem-verifikasi chain secara ketat dan bisa
 * mengabaikan opsi `ssl: { rejectUnauthorized: false }`. Hapus dari string agar TLS + opsi ssl konsisten.
 */
export function sanitizeConnectionStringForNodePg(url: string): string {
  if (!url.includes("supabase.co")) return url;
  try {
    const u = new URL(url);
    u.searchParams.delete("sslmode");
    return u.toString();
  } catch {
    return url;
  }
}
