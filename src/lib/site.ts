/**
 * Canonical public URL for SEO, OG tags, sitemap, and redirects.
 * Set NEXT_PUBLIC_APP_URL in production (see .env.example).
 */
export function getSiteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit?.startsWith("http")) {
    return new URL(explicit.replace(/\/$/, ""));
  }
  const v = process.env.VERCEL_URL?.trim();
  if (v) {
    const full = v.startsWith("http") ? v : `https://${v}`;
    return new URL(full.replace(/\/$/, ""));
  }
  return new URL("http://localhost:3000");
}
