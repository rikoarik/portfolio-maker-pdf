import { renderToBuffer } from "@react-pdf/renderer";
import {
  MultiProjectPdfDocument,
  MultiProjectPdfDocumentCompact,
  PortfolioPdfDocument,
  PortfolioPdfDocumentCompact,
  type MultiProjectPdfProps,
  type PortfolioPdfProps,
} from "@/lib/pdf/portfolio-document";

export async function renderPortfolioPdfBuffer(
  props: PortfolioPdfProps,
  templateId: string = "default",
): Promise<Buffer> {
  const doc =
    templateId === "compact" ? (
      <PortfolioPdfDocumentCompact {...props} />
    ) : (
      <PortfolioPdfDocument {...props} />
    );
  const buf = await renderToBuffer(doc);
  return Buffer.from(buf);
}

export async function renderMultiProjectPdfBuffer(
  props: MultiProjectPdfProps,
  templateId: string = "default",
): Promise<Buffer> {
  const doc =
    templateId === "compact" ? (
      <MultiProjectPdfDocumentCompact {...props} />
    ) : (
      <MultiProjectPdfDocument {...props} />
    );
  const buf = await renderToBuffer(doc);
  return Buffer.from(buf);
}
