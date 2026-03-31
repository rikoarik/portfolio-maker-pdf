import sharp from "sharp";

const MAX_WIDTH = 1600;

/** Resize large screenshots to reduce tokens/cost; returns JPEG bytes for Gemini. */
export async function resizeForVision(
  buffer: Buffer,
): Promise<{ buffer: Buffer; mimeType: string }> {
  const img = sharp(buffer);
  const meta = await img.metadata();
  const w = meta.width ?? MAX_WIDTH;
  if (w <= MAX_WIDTH) {
    const mime = meta.format === "png" ? "image/png" : "image/jpeg";
    if (mime === "image/png") {
      return { buffer, mimeType: "image/png" };
    }
    const jpeg = await sharp(buffer).jpeg({ quality: 88 }).toBuffer();
    return { buffer: jpeg, mimeType: "image/jpeg" };
  }
  const out = await img
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
  return { buffer: out, mimeType: "image/jpeg" };
}
