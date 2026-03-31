export const MAX_SCREENSHOT_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_SCREENSHOTS_PER_PROJECT = 20;

export const ALLOWED_IMAGE_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

/** In-memory rate limits (per IP) — tune for production */
export const RATE_LIMIT_UPLOAD = { max: 40, windowMs: 60_000 };
export const RATE_LIMIT_ANALYZE = { max: 15, windowMs: 60_000 };
