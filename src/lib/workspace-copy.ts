import type { TemplateDefinition } from "@/lib/template-sections";

/** Subtitle under project title — depends on template / persona */
export function workspaceHeroSubtitle(
  templateId?: string,
  portfolioPersona?: string,
): string {
  const id = templateId?.trim() || portfolioPersona?.trim() || "";
  if (id === "backend_api")
    return "Unggah gambar bukti (API, diagram, metrik, log anonim), analisis AI, susun case study, lalu unduh PDF.";
  if (id === "frontend_web" || id === "mobile")
    return "Unggah screenshot implementasi UI, analisis AI, isi narrative portofolio, lalu unduh PDF.";
  if (id === "uiux")
    return "Unggah alur layar atau desain, analisis AI, susun case study UI/UX, lalu unduh PDF.";
  if (id === "product")
    return "Unggah bukti produk (UI, metrik, slide), analisis AI, susun narrative PM, lalu unduh PDF.";
  return "Unggah gambar bukti kerja (UI, diagram, tools), analisis AI, lalu susun PDF portofolio.";
}

export function jobFocusPlaceholder(
  templateId?: string,
  portfolioPersona?: string,
): string {
  const id = templateId?.trim() || portfolioPersona?.trim() || "";
  if (id === "backend_api") return "Mis. Backend engineer (Node.js), Platform engineer";
  if (id === "frontend_web") return "Mis. Frontend engineer (React), Web developer";
  if (id === "mobile") return "Mis. Mobile developer (Flutter), iOS engineer";
  if (id === "uiux") return "Mis. Product designer, UI/UX designer";
  if (id === "product") return "Mis. Product manager, Associate PM";
  if (id === "engineering") return "Mis. Full-stack engineer, Software engineer";
  return "Mis. Product designer, Backend engineer, Frontend engineer";
}

export function industryPlaceholder(): string {
  return "Mis. Fintech, E-commerce, Healthtech";
}

export function screenshotDropzoneHint(
  templateId?: string,
  portfolioPersona?: string,
): string {
  const id = templateId?.trim() || portfolioPersona?.trim() || "";
  if (id === "backend_api")
    return "Seret atau klik — screenshot Postman, Grafana, diagram arsitektur, dsb. (PNG, JPG, WebP)";
  return "Seret atau klik untuk memilih gambar (PNG, JPG, WebP)";
}

export function templateNoteForSelect(selected: TemplateDefinition | null): string {
  if (!selected) {
    return "Pilih jenis portofolio untuk mendapat kerangka section yang cocok. Kamu tetap bisa menyesuaikan setelahnya.";
  }
  return selected.description;
}
