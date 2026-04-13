import { ALLOWED_IMAGE_MIMES } from "@/lib/constants";

/**
 * Infer image MIME from magic bytes when the browser sends an empty or generic type
 * (common for WebP on some OS/browsers).
 */
export function detectImageMimeFromBuffer(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  const b0 = buf[0];
  const b1 = buf[1];
  if (b0 === 0xff && b1 === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (
    b0 === 0x89 &&
    b1 === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    b0 === 0x52 &&
    b1 === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

/** Resolve MIME from File.type + buffer sniffing. */
export function resolveScreenshotMime(file: File, buf: Buffer): string {
  const raw = file.type?.trim() ?? "";
  if (raw && ALLOWED_IMAGE_MIMES.has(raw)) return raw;
  if (raw === "" || raw === "application/octet-stream") {
    const sniffed = detectImageMimeFromBuffer(buf);
    if (sniffed) return sniffed;
  }
  return raw || "application/octet-stream";
}
