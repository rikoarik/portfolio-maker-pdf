import {
  ApiError,
  type JobResponse,
  type MeUser,
  type ProjectResponse,
} from "@/lib/api";
import {
  generateTemplateSections,
  type TemplateDefinition,
} from "@/lib/template-sections";
import {
  jobFocusPlaceholder,
  screenshotDropzoneHint,
} from "@/lib/workspace-copy";

type WorkspaceChecklist = {
  uploaded: boolean;
  analyzed: boolean;
  drafted: boolean;
  exportReady: boolean;
};

export type WorkspaceViewModel = {
  analyzing: boolean;
  projectTitle: string;
  selectedTemplate: TemplateDefinition | null;
  usage: MeUser["usageThisMonth"] | undefined;
  plan: MeUser["plan"] | undefined;
  aiCap: number;
  aiUsed: number;
  pdfCap: number;
  pdfUsed: number;
  usageWarn: boolean;
  pdfWarn: boolean;
  missingScreenshotsForExport: boolean;
  jobFailureMessage: string | null;
  checklist: WorkspaceChecklist;
  dropHint: string;
  jobPh: string;
  showPersonaModal: boolean;
};

export function formatClientApiError(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.code === "quota_exceeded") {
      return `${e.message} Lihat /pricing untuk upgrade paket.`;
    }
    if (e.code === "rate_limited" || e.status === 429) {
      if (e.retryAfterSec && e.retryAfterSec > 0) {
        return `Permintaan terlalu cepat. Coba lagi dalam ${e.retryAfterSec} detik.`;
      }
      return "Permintaan terlalu cepat. Tunggu sebentar lalu coba lagi.";
    }
    if (e.code === "gemini_unconfigured") {
      return "Layanan AI sedang belum tersedia di server. Hubungi admin atau coba lagi nanti.";
    }
    if (e.code === "storage_unconfigured" || e.code === "storage_misconfigured") {
      return e.message;
    }
    if (e.code === "storage_write_failed" || e.code === "storage_read_failed") {
      return "Storage screenshot sedang bermasalah. Coba lagi beberapa saat.";
    }
    if (e.code === "no_screenshots") {
      return "Unggah minimal 1 screenshot dulu sebelum analisis atau export.";
    }
    if (e.code === "invalid_mime") {
      return "Format file belum didukung. Gunakan PNG, JPEG, atau WebP.";
    }
    if (e.code === "file_too_large") {
      return "Ukuran file terlalu besar. Kompres screenshot lalu coba lagi.";
    }
    if (e.status >= 500) {
      return "Server sedang sibuk. Coba lagi beberapa saat.";
    }
  }
  return e instanceof Error ? e.message : "Terjadi kesalahan.";
}

export function shouldOfferPersonaOnboarding(project: ProjectResponse): boolean {
  const draft = project.draft;
  if (draft.portfolioPersona) return false;
  if (project.screenshots.length > 0) return false;
  if (draft.projectSummary.trim()) return false;
  if ((draft.sections?.length ?? 0) > 0) return false;
  if (draft.templateId) return false;
  if (draft.screens.some((screen) => screen.title.trim() || screen.bullets.length > 0)) {
    return false;
  }
  return true;
}

export function getWorkspaceViewModel({
  project,
  job,
  user,
  analyzePending,
}: {
  project: ProjectResponse;
  job?: JobResponse;
  user?: MeUser | null;
  analyzePending: boolean;
}): WorkspaceViewModel {
  const draft = project.draft;
  const selectedTemplate = draft.templateId
    ? generateTemplateSections(draft.templateId)
    : null;
  const usage = user?.usageThisMonth;
  const plan = user?.plan;
  const aiCap = plan?.maxAiAnalysesPerPeriod ?? 0;
  const aiUsed = usage?.ai_analysis ?? 0;
  const pdfCap = plan?.maxPdfExportsPerPeriod ?? 0;
  const pdfUsed = usage?.pdf_export ?? 0;
  const usageWarn = !!usage && aiCap > 0 && aiUsed / aiCap >= 0.8;
  const pdfWarn = !!usage && pdfCap > 0 && pdfUsed / pdfCap >= 0.8;
  const missingScreenshotsForExport = project.screenshots.length === 0;
  const jobFailureMessage =
    job?.status === "failed"
      ? job.error
        ? `Analisis gagal: ${job.error}. Anda bisa coba lagi dari langkah Analisis atau per layar.`
        : "Analisis gagal. Coba lagi dari langkah Analisis atau per layar."
      : null;
  const checklist: WorkspaceChecklist = {
    uploaded: project.screenshots.length > 0,
    analyzed:
      project.screenshots.length > 0 &&
      project.screenshots.some((screen) => screen.analysisStatus === "ok"),
    drafted: draft.projectSummary.trim().length > 0 || draft.techStack.length > 0,
    exportReady: !missingScreenshotsForExport,
  };

  return {
    analyzing:
      job?.status === "queued" ||
      job?.status === "running" ||
      analyzePending,
    projectTitle: project.title.trim() || "Tanpa judul",
    selectedTemplate,
    usage,
    plan,
    aiCap,
    aiUsed,
    pdfCap,
    pdfUsed,
    usageWarn,
    pdfWarn,
    missingScreenshotsForExport,
    jobFailureMessage,
    checklist,
    dropHint: screenshotDropzoneHint(draft.templateId, draft.portfolioPersona),
    jobPh: jobFocusPlaceholder(draft.templateId, draft.portfolioPersona),
    showPersonaModal: shouldOfferPersonaOnboarding(project),
  };
}
