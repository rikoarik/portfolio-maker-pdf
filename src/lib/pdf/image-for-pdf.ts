import sharp from "sharp";

const MAX_EDGE = 1920;

/**
 * PNG/JPEG/WebP → PNG data URI yang kompatibel dengan @react-pdf/renderer
 * (WebP sering tidak tampil di PDF tanpa konversi).
 */
export async function bufferToPdfImageDataUri(input: Buffer): Promise<string> {
  let pipeline = sharp(input).rotate();
  const meta = await pipeline.metadata();
  if (
    (meta.width && meta.width > MAX_EDGE) ||
    (meta.height && meta.height > MAX_EDGE)
  ) {
    pipeline = pipeline.resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    });
  }
  const png = await pipeline.png({ compressionLevel: 6 }).toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}
